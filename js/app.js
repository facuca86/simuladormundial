import { TEAMS } from "./teams.js";
import { GROUP_A_FIXTURES } from "./fixtures.js";
import { computeStandings } from "./standings.js";
import { saveResults, loadResults, clearResults } from "./storage.js";

// ─── Estado ────────────────────────────────────────────────────────────────
const GROUP_A_TEAMS = ["MEX", "RSA", "KOR", "CZE"];
let resultsA = loadResults("groupA");

// ─── Entrada ───────────────────────────────────────────────────────────────
function init() {
  renderGroupCard();
  renderFixtures();
  renderStandings();
}

// ─── Tarjeta de grupo ──────────────────────────────────────────────────────
function renderGroupCard() {
  const container = document.getElementById("group-card");
  container.innerHTML = `
    <h2 class="group-title">GRUPO A</h2>
    <ul class="team-list">
      ${GROUP_A_TEAMS.map(code => {
        const t = TEAMS[code];
        return `<li><span class="flag">${t.flag}</span> ${t.name}</li>`;
      }).join("")}
    </ul>
  `;
}

// ─── Fixture ───────────────────────────────────────────────────────────────
function renderFixtures() {
  const container = document.getElementById("fixtures");
  container.innerHTML = "";

  // Agrupar por fecha
  const matchdays = {};
  for (const fix of GROUP_A_FIXTURES) {
    if (!matchdays[fix.matchday]) matchdays[fix.matchday] = [];
    matchdays[fix.matchday].push(fix);
  }

  for (const [day, matches] of Object.entries(matchdays)) {
    const section = document.createElement("section");
    section.classList.add("matchday");

    const dateLabel = formatDate(matches[0].date);
    section.innerHTML = `<h3 class="matchday-title">Fecha ${day} <span class="matchday-date">${dateLabel}</span></h3>`;

    for (const fix of matches) {
      section.appendChild(buildMatchCard(fix));
    }

    container.appendChild(section);
  }
}

function buildMatchCard(fix) {
  const home = TEAMS[fix.home];
  const away = TEAMS[fix.away];
  const saved = resultsA[fix.id] || { home: "", away: "" };

  const card = document.createElement("div");
  card.classList.add("match-card");
  card.dataset.id = fix.id;

  card.innerHTML = `
    <div class="match-stadium">${fix.stadium}</div>
    <div class="match-row">
      <span class="team home-team">
        <span class="flag">${home.flag}</span>
        <span class="team-name">${home.name}</span>
      </span>
      <div class="score-inputs">
        <input
          type="number"
          min="0"
          step="1"
          class="score-input"
          id="home-${fix.id}"
          value="${saved.home}"
          placeholder="–"
          aria-label="Goles ${home.name}"
        />
        <span class="score-sep">:</span>
        <input
          type="number"
          min="0"
          step="1"
          class="score-input"
          id="away-${fix.id}"
          value="${saved.away}"
          placeholder="–"
          aria-label="Goles ${away.name}"
        />
      </div>
      <span class="team away-team">
        <span class="team-name">${away.name}</span>
        <span class="flag">${away.flag}</span>
      </span>
    </div>
  `;

  // Escuchar cambios en ambos inputs
  const homeInput = card.querySelector(`#home-${fix.id}`);
  const awayInput = card.querySelector(`#away-${fix.id}`);
  [homeInput, awayInput].forEach(input => {
    input.addEventListener("input", () => handleScoreChange(fix.id, homeInput, awayInput));
  });

  return card;
}

function handleScoreChange(fixtureId, homeInput, awayInput) {
  // Rechazar valores negativos
  if (homeInput.value !== "" && parseInt(homeInput.value) < 0) homeInput.value = 0;
  if (awayInput.value !== "" && parseInt(awayInput.value) < 0) awayInput.value = 0;

  resultsA[fixtureId] = {
    home: homeInput.value,
    away: awayInput.value
  };

  saveResults("groupA", resultsA);
  renderStandings();
}

// ─── Tabla de posiciones ───────────────────────────────────────────────────
function renderStandings() {
  const tbody = document.getElementById("standings-body");
  const qualifiedList = document.getElementById("qualified-list");

  const rows = computeStandings(GROUP_A_TEAMS, GROUP_A_FIXTURES, resultsA);

  tbody.innerHTML = rows.map((row, idx) => {
    const qualified = idx < 2 ? "qualified" : "";
    return `
      <tr class="${qualified}">
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

  // Actualizar lista de clasificados
  qualifiedList.innerHTML = rows.slice(0, 2).map((row, idx) => `
    <li>
      <span class="qualified-pos">${idx + 1}.</span>
      <span class="flag">${row.team.flag}</span>
      ${row.team.name}
    </li>
  `).join("");
}

// ─── Reinicio ──────────────────────────────────────────────────────────────
function resetGroup() {
  if (!confirm("¿Seguro que deseas reiniciar todos los resultados?")) return;
  clearResults("groupA");
  resultsA = {};
  renderFixtures();
  renderStandings();
}

// ─── Utilidades ────────────────────────────────────────────────────────────
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────
document.getElementById("btn-reset").addEventListener("click", resetGroup);
document.addEventListener("DOMContentLoaded", init);
init();
