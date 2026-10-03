# BloxDance

Motor de live interactivo para TikTok con personajes de bloques. El plan completo está en PLAN.md; síguelo literal y pregunta antes de desviarte.

## Reglas de código

- TypeScript strict en todo, sin any.
- Sin comentarios en el código. Nombres claros en lugar de comentarios.
- Archivos de máximo 250 líneas; si crece, divídelo.
- Datos (personajes, bailes, playlist) en JSON, nunca hardcodeados en código.
- Tipos compartidos solo en packages/shared.
- Cada fase termina con pnpm typecheck, pnpm test y pnpm lint en verde.

## Reglas de producto

- Nunca usar la palabra Roblox, su logo, tipografías ni assets.
- Nunca mostrar texto libre de comentarios en pantalla.
- Nunca mostrar montos de dinero; solo puntos de energía.
- El juego debe funcionar completo con el simulador sin conexión a TikTok.
- 60 fps a 1080x1920 es requisito, no meta.

## Comandos

- pnpm dev: stage en :5173 y server en :3000
- pnpm test, pnpm typecheck, pnpm lint
