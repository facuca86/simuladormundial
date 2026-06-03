# Simulador Mundial FIFA 2026

Aplicación web estática (HTML + CSS + JavaScript puro, sin frameworks) que simula el Mundial FIFA 2026. Funciona directamente en el navegador y puede publicarse en GitHub Pages sin configuración adicional.

## Demo

Abre `index.html` en el navegador o publica el repositorio en GitHub Pages.

## Funcionalidades

- Carga de resultados por partido con inputs de goles
- Cálculo automático de tabla de posiciones (PJ / PG / PE / PP / GF / GC / DG / PTS)
- Ordenamiento por puntos → diferencia de gol → goles a favor
- Clasificados destacados visualmente (los 2 primeros del grupo)
- Persistencia automática en LocalStorage
- Restauración de resultados al recargar la página
- Botón de reinicio con confirmación
- UT

## Estructura de archivos

```
/
├── index.html          ← Shell HTML con las 3 secciones principales
├── css/
│   └── styles.css      ← Diseño oscuro tipo FIFA, responsive
└── js/
    ├── teams.js        ← Constantes de los equipos
    ├── fixtures.js     ← Partidos del Grupo A en 3 fechas
    ├── standings.js    ← Cálculo puro de tabla (sin DOM)
    ├── storage.js      ← Wrapper de localStorage
    └── app.js          ← Orquestador: render + eventos
```

## Tecnologías

- HTML5 semántico
- CSS3 (variables, flexbox, media queries)
- JavaScript ES Modules (sin bundler, sin frameworks)

## Cómo agregar un nuevo grupo

### 1. `js/teams.js` — Agregar los equipos del nuevo grupo

```js
export const TEAMS = {
  // ... equipos existentes ...
  ENG: { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  USA: { code: "USA", name: "Estados Unidos", flag: "🇺🇸" },
  // ...
};
```

### 2. `js/fixtures.js` — Exportar una nueva constante

```js
export const GROUP_B_FIXTURES = [
  { id: 3, matchday: 1, date: "2026-06-12", home: "ENG", away: "USA", stadium: "SoFi Stadium" },
  // ...
];
```

### 3. `js/storage.js` — Agregar la clave del nuevo grupo

```js
const KEYS = {
  groupA: "worldcup2026_groupA",
  groupB: "worldcup2026_groupB"   // ← nueva clave
};
```

### 4. `js/app.js` — Importar los datos y agregar la lógica del grupo

```js
import { GROUP_B_FIXTURES } from "./fixtures.js";

const GROUP_B_TEAMS = ["ENG", "USA", ...];
let resultsB = loadResults("groupB");
// Repetir renderGroupCard, renderFixtures, renderStandings para el Grupo B
```

### 5. `index.html` — Duplicar los bloques de tarjeta, fixture y tabla

Copiar los tres bloques `<div class="card">` y actualizar los `id` con el sufijo del nuevo grupo (ej. `group-card-b`, `fixtures-b`, `standings-body-b`).

La separación de responsabilidades garantiza que cada grupo sea completamente independiente.

## Sistema de puntos

| Resultado | Puntos |
|-----------|--------|
| Victoria  | 3      |
| Empate    | 1      |
| Derrota   | 0      |

## Grupo A — Fixture

| # | Fecha      | Local           | Visitante       | Estadio               |
|---|------------|-----------------|-----------------|----------------------|
| 1 | 11/06/2026 | 🇲🇽 México      | 🇿🇦 Sudáfrica   | Estadio Azteca        |
| 2 | 11/06/2026 | 🇰🇷 Corea del Sur | 🇨🇿 Rep. Checa | Estadio Chivas        |
|25 | 18/06/2026 | 🇨🇿 Rep. Checa  | 🇿🇦 Sudáfrica   | Mercedes-Benz Stadium |
|28 | 18/06/2026 | 🇲🇽 México      | 🇰🇷 Corea del Sur | Estadio Chivas      |
|53 | 24/06/2026 | 🇨🇿 Rep. Checa  | 🇲🇽 México      | Estadio Azteca        |
|54 | 24/06/2026 | 🇿🇦 Sudáfrica   | 🇰🇷 Corea del Sur | Estadio BBVA        |
