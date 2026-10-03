# BloxDance Live

Live vertical de TikTok donde 4 personajes de bloques bailan y la audiencia decide, con regalos, likes y comentarios, quién tiene más energía. Todo corre en un motor 3D propio en el navegador (Three.js) capturado con OBS a 1080×1920 / 60 fps.

- `PLAN.md`: plan completo de construcción.
- `CLAUDE.md`: reglas de código y de producto.
- `docs/obs.md`: cómo capturar el stage en OBS y transmitir.

## Arranque rápido

```bash
pnpm install
pnpm dev     # stage :5173, server :3000, panel admin en http://localhost:3000/admin
pnpm start   # producción: compila el stage y lo sirve el server en :3000
```

Sin conexión a TikTok el show funciona completo con el simulador (panel admin → Simulador → «Tormenta»).

## Estructura

| Ruta              | Contenido                                                                             |
| ----------------- | ------------------------------------------------------------------------------------- |
| `apps/stage`      | Render Three.js, personajes, animación, escenario, overlay, audio, `/lab` y `/editor` |
| `apps/server`     | Máquina de rondas, puntos, SQLite, simulador, conector de TikTok, `/admin`            |
| `packages/shared` | Tipos compartidos, constantes, roster y playlist                                      |

## Comandos

`pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm build`

## Páginas

- `/` stage (lo que captura OBS)
- `/lab.html` visor de personajes y bailes (`?all`, `?id=nova&expression=victory`, `?dance=floss&strip=8`)
- `/editor.html` editor de bailes con línea de tiempo en beats, exportar/importar JSON
- `/admin` panel local (solo desde localhost)
