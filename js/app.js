import { TEAMS } from "./teams.js";
import {
  GROUP_A_FIXTURES, GROUP_B_FIXTURES, GROUP_C_FIXTURES,
  GROUP_D_FIXTURES, GROUP_E_FIXTURES, GROUP_F_FIXTURES,
  GROUP_G_FIXTURES, GROUP_H_FIXTURES, GROUP_I_FIXTURES,
  GROUP_J_FIXTURES, GROUP_K_FIXTURES, GROUP_L_FIXTURES
} from "./fixtures.js";
import { computeStandings } from "./standings.js";
import { saveResults, loadResults, clearResults } from "./storage.js";
import { buildBracket, refreshBracketSeeds, scaleBracketToFit } from "./bracket.js";
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

// ─── Inicialización ────────────────────────────────────────────────────────
function init() {
  const grid = document.getElementById("groups-grid");
  for (const group of GROUPS) {
    grid.appendChild(buildGroupArticle(group));
  }
  buildBracket(document.getElementById("bracket-root"), getQualifiedTeams());
  renderThirdsView(document.getElementById("phase-thirds"), getQualifiedTeams());
  initTabs();
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

  card.innerHTML = `
    <div class="match-stadium">${fix.stadium}</div>
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

function updateStandingsDOM(group, container) {
  // Puede recibir el wrapper recién creado o buscarlo en el DOM
  const tbody = (container || document).querySelector(`#standings-body-${group.id}`);
  const qualifiedList = (container || document).querySelector(`#qualified-${group.id}`);
  if (!tbody || !qualifiedList) return;

  const rows = computeStandings(group.teams, group.fixtures, state[group.id]);

  tbody.innerHTML = rows.map((row, idx) => `
    <tr class="${idx < 2 ? "qualified" : ""}">
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
  `).join("");

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
}

// ─── Utilidades ────────────────────────────────────────────────────────────
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
