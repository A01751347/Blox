# Despliegue en homelab (corriendo solo, 24/7)

Dos piezas:

1. **`bloxdance`**: servidor Node + stage web. Decide el juego, guarda historial en SQLite, se conecta a TikTok y sirve el stage.
2. **`streamer`** (opcional): contenedor con Xvfb + Chromium + ffmpeg que abre el stage, captura 1080×1920 con audio y lo manda por RTMP. Reemplaza a OBS cuando no hay escritorio.

Si ya tienes una PC con OBS, solo necesitas la primera pieza y apuntar OBS a `http://TU-HOMELAB:3000/` (ver `docs/obs.md`).

## 1. Requisitos

- Docker + Docker Compose v2.
- Para el streamer: **URL y clave RTMP** de tu live. TikTok solo entrega servidor/clave a cuentas elegibles (en TikTok LIVE Studio para Windows/Mac o en la sección de transmisión en vivo de tu cuenta). Si no la tienes, usa el streamer en modo prueba (sin `RTMP_URL` graba a `/tmp/dry-run.flv`) o deja OBS/LIVE Studio en una PC.
- GPU recomendada para el streamer: 60 fps a 1080×1920 con bloom y sombras no es realista con render por software.

## 2. Primer arranque

```bash
git clone https://github.com/a01751347/blox.git && cd blox
cp .env.example .env
nano .env                       # ADMIN_TOKEN y, si quieres, TIKTOK_USERNAME
docker compose up -d            # solo servidor + stage
docker compose ps               # espera a "healthy"
```

- Stage: `http://IP-DEL-HOMELAB:3000/`
- Panel admin: `http://IP-DEL-HOMELAB:3000/admin` (usuario cualquiera, contraseña = `ADMIN_TOKEN`).
- Salud: `http://IP-DEL-HOMELAB:3000/api/health` · Métricas: `/metrics`.

Sin `TIKTOK_USERNAME` corre con el simulador. Para probar sin gastar un live: panel admin → Simulador → «Tormenta».

## 3. Streamer automático

```bash
# en .env
RTMP_URL=rtmp://servidor-de-tiktok/live/TU-CLAVE
ENCODER=libx264        # o h264_nvenc / h264_vaapi

docker compose --profile stream up -d --build
docker compose logs -f streamer
```

El script reinicia solo Chromium, PulseAudio y ffmpeg si alguno muere, y espera a que el servidor esté sano antes de empezar.

### Codificación por hardware

| GPU                 | Pasos                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intel / AMD (VAAPI) | En `docker-compose.yml` descomenta `devices: /dev/dri:/dev/dri` y pon `ENCODER=h264_vaapi`. Si usas Intel moderno puede hacer falta el paquete `intel-media-va-driver-non-free` en la imagen. |
| NVIDIA (NVENC)      | Instala `nvidia-container-toolkit`, descomenta el bloque `deploy.resources` y pon `ENCODER=h264_nvenc`.                                                                                       |
| Sin GPU             | `libx264 veryfast`: funciona pero no esperes 60 fps estables; baja `FPS=30`.                                                                                                                  |

La captura de este pipeline (Xvfb → Chromium → ffmpeg → H.264 1080×1920) se probó en seco sin Docker; las imágenes no se construyeron en el entorno de desarrollo, así que el primer `docker compose build` es la verdadera prueba.

## 4. Variables de entorno

| Variable                                                   | Defecto            | Para qué                                                                                                          |
| ---------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `ADMIN_TOKEN`                                              | vacío              | Contraseña del panel. Vacío = solo accesible desde `localhost` (dentro de Docker eso significa nadie). **Ponla.** |
| `TIKTOK_USERNAME`                                          | vacío              | Se conecta solo al arrancar.                                                                                      |
| `SIGN_API_KEY`                                             | vacío              | Clave del servicio de firma de `tiktok-live-connector`, si la necesitas.                                          |
| `LOG_LEVEL`                                                | `info`             | Nivel de logs (pino).                                                                                             |
| `BACKUPS_TO_KEEP`                                          | `7`                | Respaldos diarios que se conservan.                                                                               |
| `RAW_RETENTION_DAYS`                                       | `7`                | Días que se guardan los eventos crudos de TikTok.                                                                 |
| `TRUST_PROXY`                                              | `false`            | `true` si va detrás de un reverse proxy (para ver la IP real).                                                    |
| `HTTP_PORT`                                                | `3000`             | Puerto publicado en el host.                                                                                      |
| `RTMP_URL`, `STAGE_URL`, `FPS`, `VIDEO_BITRATE`, `ENCODER` | ver `.env.example` | Streamer.                                                                                                         |

## 5. Reverse proxy y acceso remoto

No expongas el puerto 3000 a Internet. Para ver el panel desde fuera usa una VPN (WireGuard/Tailscale) o un proxy con TLS. Ejemplo con Caddy:

```caddyfile
bloxdance.tu-dominio.com {
    reverse_proxy bloxdance:3000
}
```

Caddy soporta WebSockets sin configuración extra. Con proxy pon `TRUST_PROXY=true` y mantén `ADMIN_TOKEN` (el panel pide Basic Auth). El stage (`/`) y el WebSocket son de solo lectura.

## 6. Monitoreo

- **Docker healthcheck**: el contenedor pasa a `unhealthy` si el bucle del juego se detiene más de 5 s.
- **Uptime Kuma**: monitor HTTP a `/api/health` (devuelve 503 si el bucle se detiene) y opcionalmente palabra clave `"ok":true`.
- **Prometheus**:

```yaml
scrape_configs:
  - job_name: bloxdance
    static_configs:
      - targets: ['IP-DEL-HOMELAB:3000']
```

Métricas útiles: `bloxdance_tiktok_connected`, `bloxdance_ws_clients` (si baja a 0 el navegador del streamer cayó), `bloxdance_last_tick_age_seconds`, `bloxdance_events_total{source,kind}`, `bloxdance_energy{team}`.

Alertas sugeridas: `bloxdance_ws_clients == 0` por 2 min mientras estás en vivo; `bloxdance_tiktok_connected == 0` por 5 min; el contenedor `unhealthy`.

## 7. Datos, respaldos y restauración

Todo vive en el volumen `bloxdance-data` (`/data`): la base `bloxdance.sqlite` y `backups/`.

- Cada 6 h el servidor poda eventos crudos antiguos, hace un respaldo del día (`bloxdance-AAAA-MM-DD.sqlite`) y conserva los últimos `BACKUPS_TO_KEEP`.
- Copiar respaldos al host: `docker compose cp bloxdance:/data/backups ./backups`.
- Restaurar: `docker compose stop bloxdance`, copia el respaldo como `/data/bloxdance.sqlite` (por ejemplo con un contenedor temporal que monte el volumen) y `docker compose start bloxdance`.
- Recomendado: incluye el volumen en tu respaldo del homelab (restic/borg).

## 8. Actualizar

Cada push a `main` publica `ghcr.io/a01751347/blox:latest` (workflow `Docker`).

```bash
docker compose pull && docker compose up -d
```

Para hacerlo automático, Watchtower sobre el servicio `bloxdance`. Si el paquete de GHCR es privado, haz `docker login ghcr.io` con un token con permiso `read:packages`.

## 9. Sin Docker (systemd)

```bash
sudo useradd --system --home /opt/bloxdance bloxdance
sudo git clone https://github.com/a01751347/blox.git /opt/bloxdance
cd /opt/bloxdance && sudo -u bloxdance pnpm install --frozen-lockfile && sudo -u bloxdance pnpm build
sudo cp deploy/systemd/bloxdance.service /etc/systemd/system/
sudo cp .env.example /etc/bloxdance.env      # y edítalo; usa DB_PATH=/var/lib/bloxdance/bloxdance.sqlite
sudo systemctl enable --now bloxdance
```

## 10. Checklist antes del primer live automatizado

- [ ] `ADMIN_TOKEN` definido y panel probado desde otro equipo.
- [ ] `docker compose ps` en `healthy` y `/metrics` responde.
- [ ] Live privado de prueba de 1 hora con el streamer (sin tocar nada): sin caídas ni pérdida de fps.
- [ ] Simulador probado como respaldo con TikTok desconectado a propósito.
- [ ] Cortar el contenedor `streamer` a mano y comprobar que vuelve solo.
- [ ] Respaldo restaurado al menos una vez.
- [ ] Licencias de la música verificadas (ver `docs/obs.md`).
