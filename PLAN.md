# BloxDance Live — Plan de construcción

2026-10-03 · 

## Visión del show

BloxDance es un live vertical de TikTok donde 4 personajes de bloques bailan en una pista y la audiencia decide, con regalos, likes y comentarios, quién tiene más energía. Todo corre en nuestro propio motor 3D en el navegador, capturado con OBS a 1080×1920 a 60 fps.

**Reglas del juego**

- Cada ronda dura 3 minutos y tiene 4 bailarines con color de equipo (Rojo, Azul, Verde, Amarillo).

- El espectador se une a un equipo comentando `1`, `2`, `3` o `4`. Su equipo queda guardado para toda la sesión hasta que cambie.

- Cada regalo suma puntos de energía al equipo del donador; los likes suman energía pequeña; follow y share disparan efectos visuales.

- La energía sube la intensidad del baile en tiempo real: más energía = bailes más grandes, partículas y desbloqueo de movimientos especiales.

- Al final de la ronda el equipo con más energía gana: su personaje hace un baile de victoria y sube al podio. Luego entra un nuevo roster.

- Nadie gana dinero ni premios: el show es entretenimiento, la energía solo decide quién sigue bailando.

**Meta del MVP:** un live de 1 hora estable, sin intervención manual, con 4 personajes, 12 bailes y regalos reales conectados.

## Restricciones

El look es de bloques tipo Roblox, pero todo es nuestro: geometría, caras, texturas y nombre. Estas reglas van al CLAUDE.md para que Sonnet nunca las rompa.

- **Marca:** nunca usar la palabra Roblox, su logo, la tipografía Gotham/Builder ni assets descargados de Roblox. El proyecto se llama BloxDance.

- **Personajes:** proporciones de bloques propias (ver Diseño de personajes). Caras dibujadas por nosotros en canvas; nada de calcar la cara clásica ni accesorios del catálogo de Roblox.

- **Música:** solo pistas con licencia para streaming (biblioteca comercial de TikTok, música propia o librerías royalty-free con licencia de live). Una pista con copyright puede cortar el live.

- **TikTok LIVE:** planteado como juego de energía, no como apuesta. No se promete nada a cambio de regalos, no se pide dinero directamente en pantalla y no se muestran montos en pesos. Revisar las políticas de LIVE y de regalos antes del primer stream.

- **Audiencia:** el estilo atrae a menores. Los regalos requieren 18+ en TikTok, pero el overlay no debe presionar a donar (nada de cuentas regresivas tipo "última oportunidad de salvarlo").

- **Conector:** TikTok no tiene API oficial de eventos de LIVE para esto; se usa una librería no oficial que puede romperse cuando TikTok cambia. El sistema debe seguir funcionando con el simulador si el conector se cae.

## Arquitectura y stack

Dos apps: un servidor Node que recibe eventos y decide el estado del juego, y un stage en el navegador que solo dibuja lo que el servidor le manda. OBS captura el stage y lo transmite.

<embed id='.20243' h='6f740d9c' caption='arquitectura · de TikTok al stream' ref='node/85d0cb41-ee7f'/>Si TikTok se cae, el simulador mete eventos por la misma entrada y el show sigue igual.

| Capa | Tecnología | Por qué |
|---|---|---|
| Render | Three.js + Vite + TypeScript | control total y corre directo en Browser Source de OBS |
| Overlay | HTML/CSS sobre el canvas | se itera más rápido que UI en 3D |
| Servidor | Node 20 + Fastify + ws | eventos y estado en tiempo real |
| Conector | tiktok-live-connector | lee regalos, likes, comentarios, follows y shares |
| Datos | SQLite con better-sqlite3 | historial sin montar infraestructura |
| Tests | Vitest | lógica de rondas, puntos y animación |
| Salida | OBS → TikTok LIVE Studio | stream vertical estable |
**Estructura del repo**

```text
bloxdance/
  PLAN.md
  CLAUDE.md
  apps/
    stage/
      src/
        character/
        animation/
        stage/
        fx/
        overlay/
        net/
        pages/lab.ts
        pages/editor.ts
        data/characters/*.json
        data/dances/*.json
        data/playlist.json
    server/
      src/
        game/
        sources/simulator.ts
        sources/tiktok.ts
        moderation/
        db/
        admin/
  packages/
    shared/src/types.ts
```

## Diseño de personajes

Cada personaje es un rig de 6 bloques redondeados, armado por código y descrito por un JSON. Nada de modelos importados: geometría, caras y ropa se generan en runtime, así que crear uno nuevo es escribir un archivo.

**Cuerpo (unidad = 1 stud)**

| Parte | Tamaño (an × al × pr) | Bisel | Pivote |
|---|---|---|---|
| Cabeza | 1.3 × 1.3 × 1.3 | 0.18 | base del cuello |
| Torso | 2.0 × 2.0 × 1.0 | 0.08 | centro de la cadera |
| Brazo (×2) | 1.0 × 2.0 × 1.0 | 0.08 | hombro, 0.25 bajo la parte alta |
| Pierna (×2) | 1.0 × 2.0 × 1.0 | 0.08 | cadera, borde superior |
Jerarquía: `root → hips → torso → neck → head`, `torso → shoulderL/R → armL/R`, `hips → legL/R`. Cada articulación es un `Object3D` vacío en el pivote con la malla desplazada dentro, para que rotar el pivote gire la parte desde el punto correcto. Geometría: `RoundedBoxGeometry` de Three.js. Material: `MeshStandardMaterial` con roughness 0.45 y metalness 0 para el look de plástico.

**Caras**

Textura canvas de 256×256 aplicada solo a la cara frontal de la cabeza. Se combinan piezas:

- Ojos: punto, óvalo, arco feliz, estrella, lentes oscuros, ojos cerrados (parpadeo)

- Bocas: sonrisa, sonrisa abierta, «O», lengua, dientes, línea

- Extras: cachetes, cejas, pecas

Expresiones: `idle`, `hype` (energía alta), `victory`, `lose`. Parpadeo cada 3–5 s cambiando a ojos cerrados por 120 ms.

**Ropa**

Camisa y pantalón son texturas canvas por cara del bloque (UV por cara de `RoundedBoxGeometry`). Plantillas: liso, rayas, sudadera con número de equipo, chamarra abierta, overol, traje. Cada plantilla recibe 2–3 colores, así que un roster nuevo es solo cambiar paleta.

**Accesorios**

Construidos con primitivas y anclados a un hueso: gorra, gorro, corona, audífonos, cono de tráfico (cabeza); pelo de bloques en picos o melena; lentes (cara); alas, capa, mochila (espalda). La capa usa 4 segmentos con retraso para que se mueva al bailar.

**Roster inicial**

| Nombre | Equipo | Look | Personalidad del baile |
|---|---|---|---|
| Chispa | Rojo | sudadera roja, pelo en picos, audífonos | explosiva, saltos grandes |
| Mochi | Azul | overol azul, gorro, cachetes | tierna, rebotes cortos |
| Turbo | Verde | chamarra verde, lentes oscuros | callejero, footwork |
| Nova | Amarillo | traje amarillo, corona, capa | diva, poses lentas |
| Rex | Rojo | sudadera de dinosaurio con picos | torpe y gracioso |
| Bloop | Azul | rayas, cono de tráfico | robótico |
| Taco | Verde | camisa lisa, gorra al revés | cumbia y paso de cadera |
| Pixel | Amarillo | sudadera con número, mochila, alas | flotante, giros |
**Formato de un personaje**

```json
{
  "id": "chispa",
  "name": "Chispa",
  "team": "red",
  "skinTone": "#F2C48D",
  "face": { "eyes": "oval", "mouth": "grinOpen", "extras": ["brows"] },
  "shirt": { "template": "hoodie", "colors": ["#E5383B", "#FFFFFF"], "number": 1 },
  "pants": { "template": "plain", "colors": ["#22223B"] },
  "accessories": ["hair_spiky", "headphones"],
  "style": { "energyBias": 1.2, "signature": "spark_jump" }
}
```

## Escenario y cámara

Una pista de baile flotante estilo obby, con 4 plataformas de equipo en arco frente a cámara y un podio atrás. Pensado para pantalla vertical: los personajes ocupan la mitad central y el overlay vive arriba y abajo.

- **Piso:** baseplate gris con textura de studs (canvas repetido). Cada plataforma de equipo es un bloque de 4×1×4 con studs en su color que se ilumina al ritmo; su brillo sube con la energía del equipo.

- **Fondo:** cielo con gradiente y nubes de bloques que se mueven lento; torres y árboles de bloques a lo lejos con niebla.

- **Luces:** una direccional con sombras suaves (mapa de 2048), una hemisférica, y 4 reflectores de color que barren la pista en el beat.

- **Efectos:** confeti de cubos, partículas de chispas por regalo, anillo de energía en el piso de cada equipo, bloom ligero (UnrealBloomPass, fuerza 0.6).

- **Podio:** 3 escalones al fondo; el ganador camina hasta el primero al final de la ronda.

- **Cámara:** 1080×1920, FOV 40. Modos: plano general (default), zoom suave al equipo que recibe un regalo grande (2.5 s y regresa), órbita lenta en victoria. Nunca cortes bruscos: todo con interpolación de 0.6–1.2 s.

- **Rendimiento:** 60 fps estables en la PC de stream. Studs con `InstancedMesh`, máximo 2,000 partículas vivas, sombras solo de personajes y plataformas.

## Animación y bailes

Los bailes son keyframes propios en JSON, medidos en beats y no en segundos, así cualquier baile queda sincronizado con cualquier canción. Es la razón principal de no usar Roblox real: control total del movimiento.

**Motor de animación**

- `BeatClock`: lleva BPM, beat actual y fase (0–1) a partir del audio. Cada pista declara su BPM y offset en un manifiesto; no se detecta en vivo.

- `DanceClip`: lista de keyframes `{ beat, joints: { torso: [x,y,z], armL: [...] }, rootOffset, ease }` con rotaciones en grados por articulación. Duración en beats (normalmente 4 u 8) y loop.

- `Animator` por personaje: interpola entre keyframes con easing (`linear`, `easeInOut`, `backOut`, `bounce`), mezcla al cambiar de baile con crossfade de 1 beat, y escala la amplitud según la energía (0.6× en reposo, hasta 1.4× en hype).

- Capas encima del clip: respiración, rebote de cabeza en cada beat, mirada a cámara, física simple de capa y pelo.

- `DanceDirector`: decide qué baile hace cada personaje. Cambia cada 8 o 16 beats, evita repetir, y desbloquea bailes por nivel de energía.

**Biblioteca de bailes (MVP: 12)**

| Baile | Nivel | Beats | Movimiento |
|---|---|---|---|
| Idle Bop | 0 | 4 | rebote de rodillas, cabeza al beat |
| Side Step | 0 | 4 | paso lateral con brazos sueltos |
| Arm Wave | 1 | 8 | ola de brazos de izquierda a derecha |
| Robot | 1 | 8 | movimientos cortados de 90°, sin easing |
| Floss | 1 | 4 | cadera y brazos opuestos al frente y atrás |
| Cumbia Hip | 1 | 8 | paso de cadera con brazos al frente |
| Running Man | 2 | 4 | piernas alternas deslizando hacia atrás |
| Disco Point | 2 | 8 | brazo arriba y abajo en diagonal |
| Spin Jump | 2 | 8 | salto con giro de 360° del root |
| Worm Wave | 3 | 8 | ola de todo el cuerpo |
| Breakdance Freeze | 3 | 8 | baja al piso, giro y pose congelada |
| Signature | 3 | 8 | uno distinto por personaje (ver roster) |
Niveles de energía del equipo: 0 (0–99 pts), 1 (100–499), 2 (500–1,999), 3 (2,000+). Más el baile de victoria y uno de derrota (sentado, cabeza abajo, se levanta y aplaude al ganador).

**Editor de bailes**

Una página interna (`/editor`) con el personaje al centro, sliders por articulación, línea de tiempo en beats, play/pausa con metrónomo y botón de exportar JSON. Sin esto, crear bailes buenos es adivinar números; con esto, un baile nuevo toma 20 minutos.

## Regalos, rondas y estado

El servidor es la única fuente de verdad: recibe eventos, calcula puntos y manda el estado al render 10 veces por segundo, más eventos sueltos para efectos inmediatos.

**Conversión de eventos**

| Evento de TikTok | Efecto en el juego |
|---|---|
| Comentario 1–4 | asigna al usuario a ese equipo para la sesión |
| Regalo | diamantes × 10 puntos al equipo del donador + partículas proporcionales |
| Regalo de 100+ diamantes | zoom de cámara al equipo, baile Signature inmediato, alerta grande |
| Likes | 1 punto por cada 10 likes, acumulados por usuario |
| Follow | lluvia de confeti en la pista |
| Share | todos los personajes hacen un paso sincronizado de 4 beats |
Regalos en racha: la librería manda varios eventos por la misma racha; solo se cuentan cuando `repeatEnd` es verdadero (o cuando el regalo no es de racha), con el total `diamondCount × repeatCount`. Usuario sin equipo que regala: se asigna al equipo con menos miembros y se le muestra «comenta 1–4 para elegir».

**Máquina de estados de la ronda**

- `LOBBY` (15 s): entran los 4 personajes del roster, se muestran equipos e instrucciones.

- `ROUND` (180 s): baile libre, energía acumulando.

- `FINAL_30` (últimos 30 s): la música sube, la cámara se acerca. Solo cambia el ritmo visual, no los puntos.

- `RESULTS` (15 s): ganador al podio, baile de victoria, top 3 donadores del equipo ganador por nombre.

- `COOLDOWN` (10 s): sale el roster y se elige el siguiente (rota los 8 personajes).

Empate: gana el equipo con más miembros activos; si sigue el empate, ambos suben al podio.

**Estado compartido**

```ts
type TeamId = "red" | "blue" | "green" | "yellow";

interface GameState {
  phase: "LOBBY" | "ROUND" | "FINAL_30" | "RESULTS" | "COOLDOWN";
  phaseEndsAt: number;
  roundNumber: number;
  roster: Record<TeamId, string>;
  energy: Record<TeamId, number>;
  level: Record<TeamId, 0 | 1 | 2 | 3>;
  members: Record<TeamId, number>;
  topDonors: Array<{ user: string; team: TeamId; points: number }>;
  track: { id: string; bpm: number; startedAt: number };
  source: "tiktok" | "simulator";
}

type FxEvent =
  | { kind: "gift"; team: TeamId; user: string; giftName: string; points: number; big: boolean }
  | { kind: "join"; team: TeamId; user: string }
  | { kind: "follow"; user: string }
  | { kind: "share"; user: string };
```
Persistencia: SQLite con tablas `sessions`, `rounds`, `events` y `users` para tener historial, ranking semanal y poder repetir una ronda desde el log.

## Overlay, panel admin y moderación

El overlay es HTML/CSS encima del canvas en la misma página, con tipografía gruesa redondeada (Fredoka o Baloo 2 de Google Fonts) para combinar con el estilo de bloques.

**Overlay (zonas seguras de TikTok)**

- Arriba (y 180–420): temporizador de ronda, número de ronda y barras de energía de los 4 equipos con su nivel.

- Centro: nombre flotante sobre cada personaje con su número de equipo grande («1», «2»…).

- Abajo-izquierda (encima de la zona de comentarios de TikTok): alertas de regalos en cola, máximo 3 visibles, 2.5 s cada una.

- Instrucción fija rotativa: «comenta 1, 2, 3 o 4 para unirte a un equipo».

- Dejar libres los últimos 600 px de abajo y los 160 px de la derecha: ahí TikTok pone comentarios y botones.

**Panel admin (****`/admin`****, solo localhost)**

- Estado de conexión a TikTok, usuario del live y fuente activa (TikTok o simulador)

- Controles de ronda: iniciar, pausar, saltar fase, reiniciar puntos

- Simulador: botones para mandar regalos, likes, follows y comentarios falsos; modo «tormenta» que genera tráfico aleatorio durante X minutos

- Selector de roster y de playlist

- Botón de pánico: oculta todas las alertas y nombres al instante

- Lista de usuarios bloqueados y palabras prohibidas

**Moderación**

- Nunca se muestra texto libre de comentarios en pantalla, solo nombres de usuario.

- Nombres de usuario pasan por un filtro de groserías en español e inglés; si fallan se muestran como «un fan».

- Nombres truncados a 16 caracteres y sin emojis raros que rompan la tipografía.

- Usuarios bloqueados desde el panel siguen sumando puntos pero nunca aparecen por nombre.

## Fases de construcción

Son 10 fases, cada una un prompt para Sonnet en Claude Code con este documento y el CLAUDE.md en el repo. No pases a la siguiente sin cumplir los criterios de aceptación; cada fase termina en un commit.

**Fase 1 — Monorepo base**

```text
Lee PLAN.md y CLAUDE.md. Crea el monorepo con pnpm workspaces: apps/stage (Vite + TypeScript + Three.js), apps/server (Node 20 + TypeScript + Fastify + ws), packages/shared (tipos GameState y FxEvent del plan). Configura TypeScript strict, ESLint, Prettier y Vitest. stage debe renderizar una escena vacía a 1080x1920 escalada al viewport, con contador de FPS en modo dev. server expone /health y un WebSocket en /ws que manda un GameState de ejemplo cada 100 ms. stage se conecta y muestra phase en pantalla.
```
Acepta: `pnpm dev` levanta ambos, el canvas muestra la fase que manda el server.

**Fase 2 — Rig de bloques**

```text
Implementa en apps/stage/src/character el rig del plan (sección Diseño de personajes): tamaños, biseles, pivotes y jerarquía exactos, RoundedBoxGeometry y MeshStandardMaterial roughness 0.45. Clase Character con método setJoint(nombre, [x,y,z]) en grados. Crea una página /lab con un personaje gris, OrbitControls y sliders por articulación para verificar que cada parte gira desde su pivote.
```
Acepta: en /lab los brazos giran desde el hombro y las piernas desde la cadera, sin separarse del torso.

**Fase 3 — Caras, ropa y accesorios**

```text
Implementa el generador de caras en canvas 256x256 con todas las piezas de ojos, bocas y extras del plan, las 4 expresiones y el parpadeo. Implementa las plantillas de ropa como texturas por cara del bloque y los accesorios con primitivas anclados al hueso correcto, incluida la capa de 4 segmentos con retraso. Carga personajes desde apps/stage/src/data/characters/*.json con el formato del plan y crea los 8 del roster. En /lab agrega un selector de personaje y de expresión.
```
Acepta: los 8 personajes se ven distintos y reconocibles en /lab, las caras no se ven pixeleadas a 1080 px de alto.

**Fase 4 — Motor de animación**

```text
Implementa BeatClock, DanceClip, Animator y DanceDirector como describe el plan. Los clips son JSON en apps/stage/src/data/dances, en beats, con easing por keyframe y crossfade de 1 beat al cambiar. La amplitud escala de 0.6 a 1.4 según energía. Agrega las capas de respiración, rebote de cabeza y física de capa/pelo. Escribe 3 bailes (Idle Bop, Side Step, Floss) y pruébalos en /lab con un metrónomo a 120 BPM. Tests de Vitest para la interpolación y el loop.
```
Acepta: el baile cae exacto en el beat del metrónomo después de 5 minutos, sin deriva.

**Fase 5 — Editor de bailes y biblioteca completa**

```text
Crea /editor: personaje al centro, sliders por articulación, línea de tiempo en beats con keyframes que se agregan, mueven y borran, selector de easing, play/pausa con metrónomo, y exportar/importar JSON. Luego crea los 12 bailes del plan, los 8 Signature, el de victoria y el de derrota.
```
Acepta: puedo crear un baile nuevo de 8 beats desde cero y exportarlo sin tocar código.

**Fase 6 — Escenario**

```text
Construye el escenario del plan: baseplate con studs por InstancedMesh, 4 plataformas de equipo que pulsan al beat y brillan según energía, cielo, nubes y ciudad de bloques con niebla, luces y reflectores, partículas de chispas y confeti de cubos, bloom 0.6 y podio. Cámara con modos general, zoom a equipo y órbita de victoria, todo interpolado. Mantén 60 fps.
```
Acepta: 60 fps con 4 personajes bailando y 2,000 partículas en la PC de stream.

**Fase 7 — Juego y simulador**

```text
En apps/server implementa la máquina de estados de ronda, la conversión de eventos a puntos, la asignación de equipos, niveles, empates y rotación de roster exactamente como el plan. Persistencia en SQLite con better-sqlite3 y las tablas del plan. Crea un EventSource común con dos implementaciones: SimulatorSource y (vacía por ahora) TikTokSource. El stage consume GameState y FxEvent y dispara bailes, efectos y cámara. Tests de la máquina de estados y del conteo de rachas.
```
Acepta: con el simulador en modo tormenta corre 1 hora de rondas sin errores y los puntos cuadran con el log.

**Fase 8 — Overlay y panel admin**

```text
Implementa el overlay HTML/CSS del plan respetando las zonas seguras, con Fredoka, barras de energía animadas y cola de alertas. Implementa /admin en el server, solo accesible desde localhost, con todo lo que pide el plan incluido el botón de pánico, y el filtro de nombres de la sección Moderación.
```
Acepta: el overlay no tapa ningún personaje ni cae en la zona de comentarios de TikTok.

**Fase 9 — Conexión con TikTok**

```text
Implementa TikTokSource con tiktok-live-connector: conecta por usuario, normaliza chat, gift, like, follow y share al formato interno, cuenta las rachas solo con repeatEnd, reconecta con backoff exponencial y, si falla 3 veces, avisa en /admin y sigue con lo que haya. Guarda todos los eventos crudos en SQLite para depurar.
```
Acepta: en un live privado de prueba, un regalo real mueve la barra correcta en menos de 1 s.

**Fase 10 — Audio, OBS y pulido**

```text
Agrega la playlist desde un manifiesto con id, archivo, BPM, offset y licencia; el BeatClock se sincroniza con el audio real. Documenta en docs/obs.md cómo capturar el stage como Browser Source 1080x1920 con audio. Pulido final: transiciones entre fases, sonidos de alerta, pantalla de «volvemos enseguida» activable desde /admin.
```
Acepta: live de prueba de 1 hora sin intervención manual.

## CLAUDE.md y lanzamiento

Exporta este documento como `PLAN.md` en la raíz del repo y crea este `CLAUDE.md` junto a él antes de la Fase 1.

```markdown
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
```
**Checklist antes del primer live**

- Políticas de TikTok LIVE y de regalos revisadas con el formato final

- Cuenta con LIVE y regalos habilitados (requisitos de edad y seguidores cumplidos)

- Playlist de al menos 45 minutos con licencia de streaming verificada por pista

- Live privado de prueba de 1 hora sin errores ni caídas de fps

- Simulador probado como respaldo con el conector desconectado a propósito

- Lista de palabras prohibidas cargada y botón de pánico probado

- OBS: Browser Source 1080x1920, audio del stage capturado, bitrate estable

- Revisión visual: nada del overlay cae en las zonas de comentarios o botones de TikTok
