import { TEAMS } from "./teams.js";

/**
 * Genera la tabla de posiciones a partir de los resultados ingresados.
 * @param {string[]} teamCodes  - Códigos de los equipos del grupo
 * @param {Object[]} fixtures   - Array de partidos del grupo
 * @param {Object}  results     - Mapa { fixtureId: { home, away } }
 * @returns {Object[]} Filas ordenadas de la tabla
 */
export function computeStandings(teamCodes, fixtures, results) {
  // Inicializar filas con todos los equipos en cero
  const rows = {};
  for (const code of teamCodes) {
    rows[code] = {
      team: TEAMS[code],
      pj: 0, // Partidos jugados
      pg: 0, // Ganados
      pe: 0, // Empatados
      pp: 0, // Perdidos
      gf: 0, // Goles a favor
      gc: 0, // Goles en contra
      get dg() { return this.gf - this.gc; }, // Diferencia de gol
      get pts() { return this.pg * 3 + this.pe; } // Puntos
    };
  }

  // Recorrer cada partido y acumular estadísticas
  for (const fixture of fixtures) {
    const result = results[fixture.id];
    if (result === undefined || result.home === "" || result.away === "") continue;

    const gh = parseInt(result.home, 10);
    const ga = parseInt(result.away, 10);
    if (isNaN(gh) || isNaN(ga)) continue;

    const home = rows[fixture.home];
    const away = rows[fixture.away];

    home.pj++;
    away.pj++;
    home.gf += gh;
    home.gc += ga;
    away.gf += ga;
    away.gc += gh;

    if (gh > ga) {
      home.pg++;
      away.pp++;
    } else if (gh < ga) {
      away.pg++;
      home.pp++;
    } else {
      home.pe++;
      away.pe++;
    }
  }

  // Convertir a array y ordenar: PTS → DG → GF
  return Object.values(rows).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg  !== a.dg)  return b.dg  - a.dg;
    return b.gf - a.gf;
  });
}
