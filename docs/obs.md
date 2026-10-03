# BloxDance en OBS y TikTok LIVE Studio

El show corre en una sola página web (`stage`) que OBS captura como **Browser Source** vertical. El servidor Node decide el juego y el stage solo dibuja.

## 1. Arrancar

Desarrollo (recarga en caliente):

```bash
pnpm install
pnpm dev            # stage en :5173, server en :3000
```

Producción (un solo proceso, sin Vite):

```bash
pnpm start          # compila el stage y lo sirve el server en http://localhost:3000
```

Variables de entorno opcionales del server:

| Variable          | Para qué                                                                       |
| ----------------- | ------------------------------------------------------------------------------ |
| `TIKTOK_USERNAME` | Se conecta solo a ese live al arrancar. También se puede hacer desde `/admin`. |
| `SIGN_API_KEY`    | Clave del servicio de firma de `tiktok-live-connector` si tu uso la necesita.  |
| `PORT`            | Puerto del server (3000 por defecto).                                          |
| `DB_PATH`         | Archivo SQLite (`apps/server/data/bloxdance.sqlite` por defecto).              |

Sin `TIKTOK_USERNAME` el show corre completo con el **simulador**.

## 2. Browser Source en OBS

1. Ajustes → Video: lienzo base y de salida **1080 × 1920**, **60 FPS**.
2. Fuentes → **+** → _Navegador_ (Browser Source).
3. URL: `http://localhost:3000/` (o `http://localhost:5173/` en desarrollo).
4. Ancho **1080**, alto **1920**, FPS personalizados **60**.
5. Marca **Controlar audio con OBS** (así la música y los efectos llegan al mezclador) y **Apagar la fuente cuando no está visible: no**.
6. Activa la aceleración por hardware del navegador (Ajustes → Avanzado) para sostener 60 fps con bloom y sombras.
7. En el mezclador de audio comprueba que _Navegador_ se mueve y ajusta el nivel (la música ya sale a un volumen de transmisión conservador).

Parámetros útiles de URL: `?mute` (sin audio), `?demo` (sin servidor), `?bench` (tormenta de partículas para medir fps).

## 3. Salida a TikTok LIVE Studio

1. Bitrate de video estable: 4000–6000 kbps CBR, keyframe cada 2 s, codificador por hardware.
2. En TikTok LIVE Studio usa la captura de OBS (Virtual Camera o «Add source → OBS»), formato vertical.
3. No muestres montos en pesos ni pidas dinero en pantalla: el overlay solo habla de energía.

## 4. Zonas seguras

El overlay respeta las zonas de TikTok: nada en los últimos **600 px** de abajo ni en los **160 px** de la derecha. Las alertas viven abajo a la izquierda, justo encima de esa franja; la barra de energía va entre y=180 y y=420.

## 5. Panel admin

`http://localhost:3000/admin` (solo desde la misma computadora):

- Conectar/desconectar TikTok y ver la fuente activa.
- Iniciar, pausar, saltar fase y reiniciar puntos.
- Simulador: regalos, likes, follows, shares y modo tormenta.
- **Botón de pánico**: oculta alertas y nombres al instante.
- **Volvemos enseguida**: pantalla de pausa con la música bajada.
- Moderación: bloquear usuarios y palabras prohibidas.
- Selector de roster y de playlist (aplica en la siguiente ronda).

## 6. Música

La playlist está en `packages/shared/src/data/playlist.json`. Cada entrada declara `id`, `file`, `bpm`, `offsetSeconds` y `license`.

- Las pistas incluidas son **música original generada en el navegador** (`file: null`, con un `style` que describe batería, bajo y melodía). No dependen de terceros ni de derechos de autor.
- Para usar una canción real pon su archivo en `apps/stage/public/audio/`, apunta `file` a `/audio/tu-cancion.mp3`, declara su `bpm`/`offsetSeconds` y rellena `license` con la prueba de licencia para streaming. El `BeatClock` se sincroniza con el `currentTime` del audio real.
- Antes del primer live verifica la licencia de cada pista.

## 7. Checklist del live de prueba

Ver la sección «Checklist antes del primer live» de `PLAN.md`.
