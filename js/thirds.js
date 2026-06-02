const THIRDS_STORAGE_KEY = "worldcup2026_best_thirds_groups";

export function renderThirdsView(container, qualifiedAll) {
  // Extract the 3rd-place team from each group
  const thirds = Object.entries(qualifiedAll).map(([groupLabel, rows]) => {
    const r = rows[2];
    return {
      group: groupLabel,
      team: r.team,
      pj:   r.pj,
      pg:   r.pg,
      pe:   r.pe,
      pp:   r.pp,
      gf:   r.gf,
      gc:   r.gc,
      dg:   r.dg,
      pts:  r.pts
    };
  });

  // Sort: PTS → DG → GF (same tiebreaker as group standings)
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg  !== a.dg)  return b.dg  - a.dg;
    return b.gf - a.gf;
  });

  // Persist the groups of the 8 best thirds (sorted alphabetically)
  const top8Groups = thirds.slice(0, 8).map(t => t.group).sort().join("");
  localStorage.setItem(THIRDS_STORAGE_KEY, top8Groups);

  const dgLabel = r => (r.dg >= 0 ? "+" : "") + r.dg;

  container.innerHTML = `
    <div class="thirds-container">
      <div class="thirds-header">
        <h2 class="thirds-title">MEJORES TERCEROS</h2>
      </div>
      <div class="standings-wrapper thirds-table-wrap">
        <table class="thirds-table">
          <thead>
            <tr>
              <th class="grupo-col">GRUPO</th>
              <th class="team-col">Equipo</th>
              <th title="Partidos Jugados">PJ</th>
              <th title="Ganados">PG</th>
              <th title="Empatados">PE</th>
              <th title="Perdidos">PP</th>
              <th title="Goles a Favor">GF</th>
              <th title="Goles en Contra">GC</th>
              <th title="Diferencia de Gol">DG</th>
              <th title="Puntos">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${thirds.map((r, idx) => `
              <tr class="${idx < 8 ? "qualified" : ""}">
                <td class="grupo-cell">${r.group}</td>
                <td class="team-cell">
                  <span class="flag">${r.team.flag}</span>
                  <span class="team-name">${r.team.name}</span>
                </td>
                <td>${r.pj}</td>
                <td>${r.pg}</td>
                <td>${r.pe}</td>
                <td>${r.pp}</td>
                <td>${r.gf}</td>
                <td>${r.gc}</td>
                <td>${dgLabel(r)}</td>
                <td class="pts">${r.pts}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
