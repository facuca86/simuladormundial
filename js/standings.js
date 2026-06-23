import { TEAMS } from "./teams.js";

/**
 * Genera la tabla de posiciones a partir de los resultados ingresados.
 * Aplica desempates oficiales FIFA: PTS → H2H (pts, DG, GF) → DG general → GF general.
 * @param {string[]} teamCodes  - Códigos de los equipos del grupo
 * @param {Object[]} fixtures   - Array de partidos del grupo
 * @param {Object}  results     - Mapa { fixtureId: { home, away } }
 * @returns {Object[]} Filas ordenadas de la tabla
 */
export function computeStandings(teamCodes, fixtures, results) {
  const rows = {};
  for (const code of teamCodes) {
    rows[code] = {
      team: TEAMS[code],
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      get dg() { return this.gf - this.gc; },
      get pts() { return this.pg * 3 + this.pe; }
    };
  }

  for (const fixture of fixtures) {
    const result = results[fixture.id];
    if (result === undefined || result.home === "" || result.away === "") continue;
    const gh = parseInt(result.home, 10);
    const ga = parseInt(result.away, 10);
    if (isNaN(gh) || isNaN(ga)) continue;

    const home = rows[fixture.home];
    const away = rows[fixture.away];
    home.pj++; away.pj++;
    home.gf += gh; home.gc += ga;
    away.gf += ga; away.gc += gh;

    if (gh > ga) { home.pg++; away.pp++; }
    else if (gh < ga) { away.pg++; home.pp++; }
    else { home.pe++; away.pe++; }
  }

  const h2hMap = _buildH2HMap(teamCodes, fixtures, results);
  const arr = Object.values(rows);

  // Ordenar por puntos, luego desempatar grupos de igual puntaje con h2h
  arr.sort((a, b) => b.pts - a.pts);

  const sorted = [];
  let i = 0;
  while (i < arr.length) {
    let j = i + 1;
    while (j < arr.length && arr[j].pts === arr[i].pts) j++;
    sorted.push(..._sortTiedTeams(arr.slice(i, j), h2hMap));
    i = j;
  }

  return sorted;
}

/**
 * Determina si un equipo todavía puede terminar en el top 2 simulando todos
 * los escenarios posibles de los partidos restantes, incluyendo desempates h2h.
 * @param {string}   teamCode   - Código del equipo a evaluar
 * @param {string[]} teamCodes  - Todos los equipos del grupo
 * @param {Object[]} fixtures   - Todos los partidos del grupo
 * @param {Object}   results    - Resultados actuales
 * @returns {boolean} true si existe al menos un escenario donde termina 1° o 2°
 */
export function canStillQualify(teamCode, teamCodes, fixtures, results) {
  const remaining = fixtures.filter(f => {
    const r = results[f.id];
    return !r || r.home === "" || r.away === "" ||
      isNaN(parseInt(r.home, 10)) || isNaN(parseInt(r.away, 10));
  });

  for (const scenario of _generateScenarios(remaining)) {
    const standings = computeStandings(teamCodes, fixtures, { ...results, ...scenario });
    if (standings.findIndex(r => r.team.code === teamCode) < 3) return true;
  }
  return false;
}

// ─── Funciones internas ────────────────────────────────────────────────────

// Construye mapa de resultados h2h: map[codeA][codeB] = { pts, gf, gc } de A vs B.
function _buildH2HMap(teamCodes, fixtures, results) {
  const map = {};
  for (const code of teamCodes) {
    map[code] = {};
    for (const other of teamCodes) {
      if (other !== code) map[code][other] = { pts: 0, gf: 0, gc: 0 };
    }
  }
  for (const fixture of fixtures) {
    const result = results[fixture.id];
    if (!result || result.home === "" || result.away === "") continue;
    const gh = parseInt(result.home, 10);
    const ga = parseInt(result.away, 10);
    if (isNaN(gh) || isNaN(ga)) continue;
    const h = fixture.home, a = fixture.away;
    map[h][a].gf += gh; map[h][a].gc += ga;
    map[a][h].gf += ga; map[a][h].gc += gh;
    if (gh > ga) { map[h][a].pts += 3; }
    else if (gh < ga) { map[a][h].pts += 3; }
    else { map[h][a].pts += 1; map[a][h].pts += 1; }
  }
  return map;
}

// Desempata un grupo de equipos con igual puntaje usando mini-tabla h2h, luego stats globales.
function _sortTiedTeams(tiedRows, h2hMap) {
  if (tiedRows.length === 1) return tiedRows;

  const mini = {};
  for (const row of tiedRows) {
    const code = row.team.code;
    mini[code] = { pts: 0, gf: 0, gc: 0 };
    for (const other of tiedRows) {
      if (other.team.code === code) continue;
      const h = h2hMap[code]?.[other.team.code];
      if (h) { mini[code].pts += h.pts; mini[code].gf += h.gf; mini[code].gc += h.gc; }
    }
  }

  return [...tiedRows].sort((a, b) => {
    const ma = mini[a.team.code], mb = mini[b.team.code];
    const maGD = ma.gf - ma.gc, mbGD = mb.gf - mb.gc;
    if (mb.pts !== ma.pts) return mb.pts - ma.pts;
    if (mbGD !== maGD) return mbGD - maGD;
    if (mb.gf !== ma.gf) return mb.gf - ma.gf;
    if (b.dg !== a.dg) return b.dg - a.dg;
    return b.gf - a.gf;
  });
}

// Genera todos los escenarios posibles para partidos restantes.
// Usa 5 resultados representativos por partido para cubrir diferencias de gol relevantes.
function _generateScenarios(remainingFixtures) {
  if (remainingFixtures.length === 0) return [{}];
  const [first, ...rest] = remainingFixtures;
  const subScenarios = _generateScenarios(rest);
  const outcomes = [
    { home: "3", away: "0" },
    { home: "1", away: "0" },
    { home: "0", away: "0" },
    { home: "0", away: "1" },
    { home: "0", away: "3" },
  ];
  const result = [];
  for (const outcome of outcomes) {
    for (const sub of subScenarios) {
      result.push({ [first.id]: outcome, ...sub });
    }
  }
  return result;
}
