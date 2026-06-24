import { TEAMS } from "./teams.js";
import {
  GROUP_A_FIXTURES, GROUP_B_FIXTURES, GROUP_C_FIXTURES,
  GROUP_D_FIXTURES, GROUP_E_FIXTURES, GROUP_F_FIXTURES,
  GROUP_G_FIXTURES, GROUP_H_FIXTURES, GROUP_I_FIXTURES,
  GROUP_J_FIXTURES, GROUP_K_FIXTURES, GROUP_L_FIXTURES
} from "./fixtures.js";
import { computeStandings, canStillQualify, computeBestThirds } from "./standings.js";
import { saveResults, loadResults, clearResults, loadResultsFromFirebase } from "./storage.js";
import { buildBracket, refreshBracketSeeds, scaleBracketToFit, getBracketStats } from "./bracket.js";
import { renderThirdsView } from "./thirds.js";
import { renderHistoriaView } from "./historia.js";

// ─── Configuración de grupos ───────────────────────────────────────────────
// Para agregar un nuevo grupo solo hay que añadir una entrada a este array.
const GROUPS = [
  { id: "groupA", label: "A", teams: ["MEX", "RSA", "KOR", "CZE"], fixtures: GROUP_A_FIXTURES },
  { id: "groupB", label: "B", teams: ["CAN", "BIH", "QAT", "SUI"], fixtures: GROUP_B_FIXTURES },
  { id: "groupC", label: "C", teams: ["BRA", "MAR", "HAI", "SCO"], fixtures: GROUP_C_FIXTURES },
  { id: "groupD", label: "D", teams: ["USA", "PAR", "AUS", "TUR"], fixtures: GROUP_D_FIXTURES },
  { id: "groupE", label: "E", teams: ["GER", "CUW", "CIV", "ECU"], fixtures: GROUP_E_FIXTURES },
  { id: "groupF", label: "F", teams: ["NED", "JPN", "SWE", "TUN"], fixtures: GROUP_F_FIXTURES },
  { id: "groupG", label: "G", teams: ["BEL", "EGY", "IRN", "NZL"], fixtures: GROUP_G_FIXTURES },
  { id: "groupH", label: "H", teams: ["ESP", "CPV", "KSA", "URU"], fixtures: GROUP_H_FIXTURES },
  { id: "groupI", label: "I", teams: ["FRA", "SEN", "IRQ", "NOR"], fixtures: GROUP_I_FIXTURES },
  { id: "groupJ", label: "J", teams: ["ARG", "ALG", "AUT", "JOR"], fixtures: GROUP_J_FIXTURES },
  { id: "groupK", label: "K", teams: ["POR", "COD", "UZB", "COL"], fixtures: GROUP_K_FIXTURES },
  { id: "groupL", label: "L", teams: ["ENG", "CRO", "GHA", "PAN"], fixtures: GROUP_L_FIXTURES }
];

// ─── Estado: un objeto de resultados por grupo ─────────────────────────────
const state = {};
for (const g of GROUPS) {
  state[g.id] = loadResults(g.id);
}

// ─── Contador de equipos ───────────────────────────────────────────────────
function computeTournamentCounts() {
  const allGroupsComplete = isGroupStageComplete();
  let bestThirdCodes = null;

  if (allGroupsComplete) {
    const thirds = computeBestThirds(GROUPS, state);
    bestThirdCodes = new Set(thirds.slice(0, 8).map(t => t.team.code));
  }

  const groupEliminated = new Set();

  for (const g of GROUPS) {
    const rows = computeStandings(g.teams, g.fixtures, state[g.id]);
    rows.forEach((row, idx) => {
      if (idx < 2) return;
      if (idx === 2) {
        if (allGroupsComplete) {
          if (!bestThirdCodes || !bestThirdCodes.has(row.team.code)) {
            groupEliminated.add(row.team.code);
          }
        } else {
          if (!canStillQualify(row.team.code, g.teams, g.fixtures, state[g.id])) {
            groupEliminated.add(row.team.code);
          }
        }
      } else {
        if (allGroupsComplete) {
          groupEliminated.add(row.team.code);
        } else {
          if (!canStillQualify(row.team.code, g.teams, g.fixtures, state[g.id])) {
            groupEliminated.add(row.team.code);
          }
        }
      }
    });
  }

  const { eliminatedCodes, champion, runnerUp, thirdPlace } = getBracketStats();
  const totalEliminated = groupEliminated.size + eliminatedCodes.size;
  const inRace = 48 - totalEliminated;

  return { eliminated: totalEliminated, inRace, champion, runnerUp, thirdPlace };
}

function updateStatusBar() {
  const bar = document.getElementById("tournament-status");
  if (!bar) return;

  const { eliminated, inRace, champion, runnerUp, thirdPlace } = computeTournamentCounts();

  if (champion) {
    const thirdHtml = thirdPlace
      ? `<span class="header-podium__flag">${thirdPlace.flag}</span><span class="header-podium__name">${thirdPlace.name}</span>`
      : `<span class="header-podium__name header-podium__name--pending">Por definir</span>`;

    bar.innerHTML = `
      <div class="header-podium">
        <div class="header-podium__item header-podium__item--gold">
          <span class="header-podium__medal">🥇</span>
          <span class="header-podium__flag">${champion.flag}</span>
          <span class="header-podium__name">${champion.name}</span>
        </div>
        <div class="header-podium__item header-podium__item--silver">
          <span class="header-podium__medal">🥈</span>
          <span class="header-podium__flag">${runnerUp.flag}</span>
          <span class="header-podium__name">${runnerUp.name}</span>
        </div>
        <div class="header-podium__item header-podium__item--bronze">
          <span class="header-podium__medal">🥉</span>
          ${thirdHtml}
        </div>
      </div>
    `;
    return;
  }

  let raceClass;
  if (inRace > 8)      raceClass = "green";
  else if (inRace > 4) raceClass = "bronze";
  else if (inRace > 2) raceClass = "silver";
  else                 raceClass = "gold";

  bar.innerHTML = `
    <span class="status-eliminated">Equipos eliminados: <strong>${eliminated}</strong></span>
    <span class="status-divider">·</span>
    <span class="status-in-race status-in-race--${raceClass}">En Carrera: <strong>${inRace}</strong></span>
  `;
}

// ─── Inicialización ────────────────────────────────────────────────────────
function init() {
  const grid = document.getElementById("groups-grid");
  for (const group of GROUPS) {
    grid.appendChild(buildGroupArticle(group));
  }
  document.getElementById("phase-groups").appendChild(buildExportButton());
  buildBracket(document.getElementById("bracket-root"), getQualifiedTeams());
  renderThirdsView(document.getElementById("phase-thirds"), getQualifiedTeams());
  initTabs();
  updateStatusBar();
  document.addEventListener("bracketUpdated", updateStatusBar);
}

function initTabs() {
  const TABS = ["groups", "thirds", "bracket", "historia"];
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("tab-btn--active"));
      btn.classList.add("tab-btn--active");
      const tab = btn.dataset.tab;
      TABS.forEach(t => document.getElementById(`phase-${t}`).classList.toggle("hidden", tab !== t));
      const banner = document.getElementById("champion-banner");
      if (banner) banner.classList.toggle("champion-banner--tab-hidden", tab !== "bracket");
      if (tab === "bracket") { refreshBracketSeeds(getQualifiedTeams()); scaleBracketToFit(); }
      if (tab === "thirds") renderThirdsView(document.getElementById("phase-thirds"), getQualifiedTeams());
      if (tab === "historia") renderHistoriaView(document.getElementById("phase-historia"));
    });
  });
}

export function getQualifiedTeams() {
  const qualified = {};
  for (const g of GROUPS) {
    const rows = computeStandings(g.teams, g.fixtures, state[g.id]);
    qualified[g.label] = rows;
  }
  return qualified;
}

// ─── Construcción del artículo de grupo ────────────────────────────────────
function buildGroupArticle(group) {
  const article = document.createElement("article");
  article.classList.add("group-article");
  article.id = `group-${group.id}`;

  // Cabecera: nombre del grupo + tiles de banderas
  article.innerHTML = `
    <header class="group-article__header">
      <div class="group-header-top">
        <h2 class="group-title">GRUPO ${group.label}</h2>
        <span class="group-stats-icon">📊</span>
      </div>
      <div class="team-tiles">
        ${group.teams.map(code => {
          const t = TEAMS[code];
          return `<div class="team-tile"><span class="tile-flag">${t.flag}</span><span class="tile-code">${code}</span></div>`;
        }).join("")}
      </div>
    </header>
  `;

  // Sección de partidos
  const fixturesSection = document.createElement("section");
  fixturesSection.classList.add("group-article__fixtures");
  fixturesSection.innerHTML = `<h3 class="section-title">Partidos</h3>`;
  fixturesSection.appendChild(buildMatchdays(group));
  article.appendChild(fixturesSection);

  // Tabla de posiciones
  const standingsSection = document.createElement("section");
  standingsSection.classList.add("group-article__standings");
  standingsSection.id = `standings-section-${group.id}`;
  standingsSection.innerHTML = `<h3 class="section-title">Posiciones</h3>`;
  standingsSection.appendChild(buildStandingsTable(group));
  article.appendChild(standingsSection);

  // Botón de reinicio
  const footer = document.createElement("footer");
  footer.classList.add("group-article__footer");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-reset";
  btn.textContent = `🔄 Reiniciar Grupo ${group.label}`;
  btn.addEventListener("click", () => resetGroup(group));
  footer.appendChild(btn);
  article.appendChild(footer);

  return article;
}

// ─── Partidos agrupados por fecha ──────────────────────────────────────────
function buildMatchdays(group) {
  const container = document.createDocumentFragment();

  // Agrupar fixtures por matchday
  const matchdays = {};
  for (const fix of group.fixtures) {
    if (!matchdays[fix.matchday]) matchdays[fix.matchday] = [];
    matchdays[fix.matchday].push(fix);
  }

  for (const [day, matches] of Object.entries(matchdays)) {
    const section = document.createElement("div");
    section.classList.add("matchday");

    const dateLabel = formatDate(matches[0].date);
    section.innerHTML = `
      <h4 class="matchday-title">
        Fecha ${day}
        <span class="matchday-date">${dateLabel}</span>
      </h4>
    `;

    for (const fix of matches) {
      section.appendChild(buildMatchCard(group, fix));
    }

    container.appendChild(section);
  }

  return container;
}

function buildMatchCard(group, fix) {
  const home = TEAMS[fix.home];
  const away = TEAMS[fix.away];
  const saved = state[group.id][fix.id] || { home: "", away: "" };

  const card = document.createElement("div");
  card.classList.add("match-card");

  const argTime = toArgTime(fix.time, fix.utcOffset);
  card.innerHTML = `
    <div class="match-stadium">${fix.stadium}</div>
    <div class="match-time-row">${fix.time}&nbsp;(GMT${fmtOffset(fix.utcOffset)})&ensp;${argTime}&nbsp;(GMT-3)</div>
    <div class="match-row">
      <span class="team home-team">
        <span class="flag">${home.flag}</span>
        <span class="team-name">${home.name}</span>
      </span>
      <div class="score-inputs">
        <input
          type="number" min="0" step="1"
          class="score-input" id="h-${fix.id}"
          value="${saved.home}" placeholder="–"
          aria-label="Goles ${home.name}"
        />
        <span class="score-sep">:</span>
        <input
          type="number" min="0" step="1"
          class="score-input" id="a-${fix.id}"
          value="${saved.away}" placeholder="–"
          aria-label="Goles ${away.name}"
        />
      </div>
      <span class="team away-team">
        <span class="team-name">${away.name}</span>
        <span class="flag">${away.flag}</span>
      </span>
    </div>
  `;

  const homeInput = card.querySelector(`#h-${fix.id}`);
  const awayInput = card.querySelector(`#a-${fix.id}`);
  [homeInput, awayInput].forEach(input => {
    input.addEventListener("input", () => handleScoreChange(group, fix.id, homeInput, awayInput));
  });

  return card;
}

// ─── Tabla de posiciones ────────────────────────────────────────────────────
function buildStandingsTable(group) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("standings-wrapper");

  wrapper.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
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
      <tbody id="standings-body-${group.id}"></tbody>
    </table>
    <div class="qualified-section">
      <h4>Clasificados</h4>
      <ol id="qualified-${group.id}"></ol>
    </div>
  `;

  // Llenar con los datos actuales
  updateStandingsDOM(group, wrapper);
  return wrapper;
}

function isGroupStageComplete() {
  for (const g of GROUPS) {
    for (const fix of g.fixtures) {
      const r = state[g.id]?.[fix.id];
      if (!r || r.home === "" || r.away === "" ||
          isNaN(parseInt(r.home, 10)) || isNaN(parseInt(r.away, 10))) return false;
    }
  }
  return true;
}

function updateStandingsDOM(group, container) {
  // Puede recibir el wrapper recién creado o buscarlo en el DOM
  const tbody = (container || document).querySelector(`#standings-body-${group.id}`);
  const qualifiedList = (container || document).querySelector(`#qualified-${group.id}`);
  if (!tbody || !qualifiedList) return;

  const rows = computeStandings(group.teams, group.fixtures, state[group.id]);

  const allComplete = isGroupStageComplete();
  let bestThirdCodes = null;
  if (allComplete) {
    const thirds = computeBestThirds(GROUPS, state);
    bestThirdCodes = new Set(thirds.slice(0, 8).map(t => t.team.code));
  }

  tbody.innerHTML = rows.map((row, idx) => {
    let cls;
    if (idx < 2) {
      cls = "qualified";
    } else if (idx === 2) {
      if (allComplete) {
        cls = bestThirdCodes.has(row.team.code) ? "qualified" : "eliminated";
      } else {
        cls = "";
      }
    } else {
      const alive = canStillQualify(row.team.code, group.teams, group.fixtures, state[group.id]);
      cls = !alive ? "eliminated" : "";
    }
    return `
    <tr class="${cls}">
      <td class="pos">${idx + 1}</td>
      <td class="team-cell">
        <span class="flag">${row.team.flag}</span>
        <span class="team-name">${row.team.name}</span>
      </td>
      <td>${row.pj}</td>
      <td>${row.pg}</td>
      <td>${row.pe}</td>
      <td>${row.pp}</td>
      <td>${row.gf}</td>
      <td>${row.gc}</td>
      <td>${row.dg >= 0 ? "+" : ""}${row.dg}</td>
      <td class="pts">${row.pts}</td>
    </tr>
  `;
  }).join("");

  qualifiedList.innerHTML = rows.slice(0, 2).map((row, idx) => `
    <li>
      <span class="qualified-pos">${idx + 1}.</span>
      <span class="flag">${row.team.flag}</span>
      ${row.team.name}
    </li>
  `).join("");
}

// ─── Cambio de marcador ────────────────────────────────────────────────────
function handleScoreChange(group, fixtureId, homeInput, awayInput) {
  if (homeInput.value !== "" && parseInt(homeInput.value) < 0) homeInput.value = 0;
  if (awayInput.value !== "" && parseInt(awayInput.value) < 0) awayInput.value = 0;

  state[group.id][fixtureId] = { home: homeInput.value, away: awayInput.value };
  saveResults(group.id, state[group.id]);
  updateStandingsDOM(group);
  const qualified = getQualifiedTeams();
  refreshBracketSeeds(qualified);
  renderThirdsView(document.getElementById("phase-thirds"), qualified);
  updateStatusBar();
}

// ─── Reinicio ──────────────────────────────────────────────────────────────
function resetGroup(group) {
  if (!confirm(`¿Seguro que deseas reiniciar todos los resultados del Grupo ${group.label}?`)) return;

  clearResults(group.id);
  state[group.id] = {};

  // Vaciar todos los inputs del grupo
  const article = document.getElementById(`group-${group.id}`);
  article.querySelectorAll(".score-input").forEach(input => { input.value = ""; });

  updateStandingsDOM(group);
  const qualified = getQualifiedTeams();
  refreshBracketSeeds(qualified);
  renderThirdsView(document.getElementById("phase-thirds"), qualified);
  updateStatusBar();
}

// ─── Exportación de resultados ─────────────────────────────────────────────
function buildExportButton() {
  const wrapper = document.createElement("div");
  wrapper.className = "export-section";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-export";
  btn.textContent = "📋 Exportar Resultados";
  btn.addEventListener("click", exportResults);

  wrapper.appendChild(btn);
  return wrapper;
}

function exportResults() {
  const byMatchday = {};

  for (const group of GROUPS) {
    for (const fix of group.fixtures) {
      const result = state[group.id][fix.id];
      const gh = result && result.home !== "" ? parseInt(result.home, 10) : null;
      const ga = result && result.away !== "" ? parseInt(result.away, 10) : null;
      const hasResult = gh !== null && ga !== null && !isNaN(gh) && !isNaN(ga);

      if (!byMatchday[fix.matchday]) byMatchday[fix.matchday] = [];
      byMatchday[fix.matchday].push({ groupLabel: group.label, fix, gh, ga, hasResult });
    }
  }

  const matchdays = Object.keys(byMatchday).map(Number).sort((a, b) => a - b);

  const lines = [];
  for (const day of matchdays) {
    lines.push(`FECHA ${day}`);
    const matches = byMatchday[day].sort((a, b) =>
      a.groupLabel.localeCompare(b.groupLabel) || a.fix.id - b.fix.id
    );
    for (const { fix, gh, ga, hasResult } of matches) {
      const home = TEAMS[fix.home];
      const away = TEAMS[fix.away];
      if (hasResult) {
        lines.push(`${home.name} ${gh} - ${ga} ${away.name}`);
      } else {
        lines.push(`${home.name} vs ${away.name}`);
      }
    }
    lines.push("");
  }

  showExportModal(lines.join("\n").trimEnd());
}

function showExportModal(text) {
  const existing = document.getElementById("export-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "export-modal";
  overlay.className = "export-modal-overlay";

  overlay.innerHTML = `
    <div class="export-modal">
      <div class="export-modal__header">
        <h3>Resultados exportados</h3>
        <button class="export-modal__close" aria-label="Cerrar">✕</button>
      </div>
      <textarea class="export-modal__text" readonly>${text}</textarea>
      <div class="export-modal__actions">
        <button class="btn-copy">📋 Copiar al portapapeles</button>
      </div>
    </div>
  `;

  overlay.querySelector(".export-modal__close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

  const copyBtn = overlay.querySelector(".btn-copy");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = "✅ Copiado";
      setTimeout(() => { copyBtn.textContent = "📋 Copiar al portapapeles"; }, 2000);
    }).catch(() => {
      const ta = overlay.querySelector(".export-modal__text");
      ta.select();
      document.execCommand("copy");
      copyBtn.textContent = "✅ Copiado";
      setTimeout(() => { copyBtn.textContent = "📋 Copiar al portapapeles"; }, 2000);
    });
  });

  document.body.appendChild(overlay);
}

// ─── Utilidades ────────────────────────────────────────────────────────────
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function fmtOffset(o) { return o >= 0 ? `+${o}` : `${o}`; }

function toArgTime(localTime, utcOffset) {
  const [h, m] = localTime.split(":").map(Number);
  const argH = ((h + (-3 - utcOffset)) % 24 + 24) % 24;
  return `${String(argH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ─── Sincronización con Firebase al inicio ─────────────────────────────────
async function syncFromFirebase() {
  for (const g of GROUPS) {
    const fbResults = await loadResultsFromFirebase(g.id);
    if (fbResults && Object.keys(fbResults).length > 0) {
      state[g.id] = fbResults;
      const article = document.getElementById(`group-${g.id}`);
      if (article) {
        for (const fix of g.fixtures) {
          const saved = fbResults[fix.id] || { home: "", away: "" };
          const hi = article.querySelector(`#h-${fix.id}`);
          const ai = article.querySelector(`#a-${fix.id}`);
          if (hi) hi.value = saved.home;
          if (ai) ai.value = saved.away;
        }
      }
      updateStandingsDOM(g);
    }
  }
  const qualified = getQualifiedTeams();
  refreshBracketSeeds(qualified);
  renderThirdsView(document.getElementById("phase-thirds"), qualified);
  updateStatusBar();
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  init();
  syncFromFirebase().catch(() => {});
});
