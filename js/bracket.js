import { TEAMS } from "./teams.js";
import { saveResults, loadResults } from "./storage.js";
import { BEST_THIRDS_COMBINATIONS } from "./combinations.js";

// ─── Estructura del cuadro final FIFA 2026 ────────────────────────────────
// Cada ronda define pares de partidos que alimentan el siguiente.
// seedHome / seedAway: etiqueta de clasificación (ej. "1A", "2B", "3ABCDF")
// Los ganadores se propagan automáticamente cuando se ingresan resultados.

const ROUNDS = [
  {
    id: "r32",
    label: "Dieciseisavos de final",
    matches: [
      { id: "r32_1",  seedHome: "1E",          seedAway: "3A/B/C/D/F", date: "29 jun", venue: "Boston" },
      { id: "r32_2",  seedHome: "1I",          seedAway: "3C/D/F/G/H", date: "30 jun", venue: "New York/NJ" },
      { id: "r32_3",  seedHome: "2A",          seedAway: "2B",         date: "28 jun", venue: "Los Ángeles" },
      { id: "r32_4",  seedHome: "1F",          seedAway: "2C",         date: "29 jun", venue: "Monterrey" },
      { id: "r32_5",  seedHome: "2K",          seedAway: "2L",         date: "2 jul",  venue: "Toronto" },
      { id: "r32_6",  seedHome: "1H",          seedAway: "2J",         date: "2 jul",  venue: "Los Ángeles" },
      { id: "r32_7",  seedHome: "1D",          seedAway: "3B/E/F/I/J", date: "1 jul",  venue: "San Francisco" },
      { id: "r32_8",  seedHome: "1G",          seedAway: "3A/E/H/I/J", date: "1 jul",  venue: "Seattle" },
      { id: "r32_9",  seedHome: "1C",          seedAway: "2F",         date: "29 jun", venue: "Houston" },
      { id: "r32_10", seedHome: "2E",          seedAway: "2I",         date: "30 jun", venue: "Dallas" },
      { id: "r32_11", seedHome: "1A",          seedAway: "3C/E/F/H/I", date: "30 jun", venue: "Ciudad de México" },
      { id: "r32_12", seedHome: "1L",          seedAway: "3E/H/I/J/K", date: "1 jul",  venue: "Atlanta" },
      { id: "r32_13", seedHome: "1J",          seedAway: "2H",         date: "3 jul",  venue: "Miami" },
      { id: "r32_14", seedHome: "2D",          seedAway: "2G",         date: "3 jul",  venue: "Dallas" },
      { id: "r32_15", seedHome: "1B",          seedAway: "3E/F/G/I/J", date: "2 jul",  venue: "Vancouver" },
      { id: "r32_16", seedHome: "1K",          seedAway: "3D/E/I/J/L", date: "3 jul",  venue: "Kansas City" },
    ]
  },
  {
    id: "r16",
    label: "Octavos de final",
    matches: [
      { id: "r16_1", seedHome: "W r32_1",  seedAway: "W r32_2",  date: "4 jul",  venue: "Filadelfia" },
      { id: "r16_2", seedHome: "W r32_3",  seedAway: "W r32_4",  date: "4 jul",  venue: "Houston" },
      { id: "r16_3", seedHome: "W r32_5",  seedAway: "W r32_6",  date: "6 jul",  venue: "Dallas" },
      { id: "r16_4", seedHome: "W r32_7",  seedAway: "W r32_8",  date: "6 jul",  venue: "Seattle" },
      { id: "r16_5", seedHome: "W r32_9",  seedAway: "W r32_10", date: "5 jul",  venue: "New York/NJ" },
      { id: "r16_6", seedHome: "W r32_11", seedAway: "W r32_12", date: "5 jul",  venue: "Ciudad de México" },
      { id: "r16_7", seedHome: "W r32_13", seedAway: "W r32_14", date: "7 jul",  venue: "Atlanta" },
      { id: "r16_8", seedHome: "W r32_15", seedAway: "W r32_16", date: "7 jul",  venue: "Vancouver" },
    ]
  },
  {
    id: "qf",
    label: "Cuartos de final",
    matches: [
      { id: "qf_1", seedHome: "W r16_1", seedAway: "W r16_2", date: "9 jul",  venue: "Boston" },
      { id: "qf_2", seedHome: "W r16_3", seedAway: "W r16_4", date: "10 jul", venue: "Los Ángeles" },
      { id: "qf_3", seedHome: "W r16_5", seedAway: "W r16_6", date: "11 jul", venue: "Miami" },
      { id: "qf_4", seedHome: "W r16_7", seedAway: "W r16_8", date: "11 jul", venue: "Kansas City" },
    ]
  },
  {
    id: "sf",
    label: "Semifinales",
    matches: [
      { id: "sf_1", seedHome: "W qf_1", seedAway: "W qf_2", date: "14 jul", venue: "Dallas" },
      { id: "sf_2", seedHome: "W qf_3", seedAway: "W qf_4", date: "15 jul", venue: "Atlanta" },
    ]
  },
  {
    id: "final",
    label: "Final",
    matches: [
      { id: "final_1", seedHome: "W sf_1", seedAway: "W sf_2", date: "19 jul", venue: "New York/NJ" },
    ]
  }
];

const THIRD_PLACE = { id: "third_1", seedHome: "P sf_1", seedAway: "P sf_2", date: "18 jul", venue: "Miami" };

// Matches in r32 where the away team is a best-third; key = matchId, value = home seed (e.g. "1E")
const R32_THIRD_MATCHES = {
  r32_1:  "1E",
  r32_2:  "1I",
  r32_7:  "1D",
  r32_8:  "1G",
  r32_11: "1A",
  r32_12: "1L",
  r32_15: "1B",
  r32_16: "1K",
};

// ─── Estado del cuadro ───────────────────────────────────────────────────
// bracketTeams[matchId] = { home: teamCode|null, away: teamCode|null }
// bracketResults[matchId] = { home: "", away: "" }
// resolvedThirdLabels[matchId] = specific third seed label (e.g. "3E") or null
const bracketTeams = {};
const bracketResults = {};
const resolvedThirdLabels = {};

function loadBracketState() {
  const saved = loadResults("bracket");
  if (saved) Object.assign(bracketResults, saved);
}

function saveBracketState() {
  saveResults("bracket", bracketResults);
}

// ─── Mapeo de seed de grupo → equipo clasificado ──────────────────────────
// qualified = { A: [row0, row1, ...], B: [...], ... }  (sorted standings)
function resolveGroupSeed(seed, qualified) {
  if (!qualified) return null;
  // seed like "1A", "2B"
  const posMatch = seed.match(/^(\d)([A-L])$/);
  if (posMatch) {
    const pos = parseInt(posMatch[1]) - 1;
    const grp = posMatch[2];
    const rows = qualified[grp];
    if (!rows || rows.length < pos + 1) return null;
    if (rows[pos].pj === 0) return null; // no games played
    return rows[pos].team;
  }
  return null;
}

// ─── Propagar ganadores a través del cuadro ──────────────────────────────
function propagateWinners() {
  // Build a map matchId -> winner team
  const winners = {};
  const losers = {};

  for (const round of ROUNDS) {
    for (const m of round.matches) {
      const res = bracketResults[m.id];
      if (res && res.home !== "" && res.away !== "") {
        const h = parseInt(res.home);
        const a = parseInt(res.away);
        const hTeam = bracketTeams[m.id]?.home;
        const aTeam = bracketTeams[m.id]?.away;
        if (!isNaN(h) && !isNaN(a) && hTeam && aTeam) {
          winners[m.id] = h >= a ? hTeam : aTeam;
          losers[m.id] = h >= a ? aTeam : hTeam;
        }
      }
    }
  }

  // Fill next-round teams from winners
  for (const round of ROUNDS) {
    for (const m of round.matches) {
      const hSrc = m.seedHome.match(/^W (.+)$/);
      const aSrc = m.seedAway.match(/^W (.+)$/);
      if (!bracketTeams[m.id]) bracketTeams[m.id] = { home: null, away: null };
      if (hSrc) {
        bracketTeams[m.id].home = winners[hSrc[1]] || null;
      }
      if (aSrc) {
        bracketTeams[m.id].away = winners[aSrc[1]] || null;
      }
    }
  }

  // Third place
  if (!bracketTeams[THIRD_PLACE.id]) bracketTeams[THIRD_PLACE.id] = { home: null, away: null };
  const hSrc = THIRD_PLACE.seedHome.match(/^P (.+)$/);
  const aSrc = THIRD_PLACE.seedAway.match(/^P (.+)$/);
  if (hSrc) bracketTeams[THIRD_PLACE.id].home = losers[hSrc[1]] || null;
  if (aSrc) bracketTeams[THIRD_PLACE.id].away = losers[aSrc[1]] || null;
}

// ─── Obtener combinación de cruces según los mejores terceros clasificados ──
function getCurrentCombination() {
  const key = localStorage.getItem("worldcup2026_best_thirds_groups") || "";
  return BEST_THIRDS_COMBINATIONS[key] || null;
}

// ─── Actualizar seeds de grupos en r32 ──────────────────────────────────
export function refreshBracketSeeds(qualified) {
  const combination = getCurrentCombination();

  const r32 = ROUNDS[0];
  for (const m of r32.matches) {
    if (!bracketTeams[m.id]) bracketTeams[m.id] = { home: null, away: null };
    if (!m.seedHome.startsWith("W") && !m.seedHome.startsWith("P")) {
      bracketTeams[m.id].home = resolveGroupSeed(m.seedHome, qualified);
    }
    if (!m.seedAway.startsWith("W") && !m.seedAway.startsWith("P")) {
      const homeSeed = R32_THIRD_MATCHES[m.id];
      if (homeSeed && combination) {
        const thirdSeed = combination[homeSeed];
        resolvedThirdLabels[m.id] = thirdSeed || null;
        bracketTeams[m.id].away = thirdSeed ? resolveGroupSeed(thirdSeed, qualified) : null;
      } else {
        bracketTeams[m.id].away = resolveGroupSeed(m.seedAway, qualified);
      }
    }
  }
  propagateWinners();
  renderBracketTeams();
}

// ─── Construir DOM del cuadro ────────────────────────────────────────────
let bracketRoot = null;

export function buildBracket(container, qualified) {
  bracketRoot = container;
  loadBracketState();

  // Seed initial group teams
  const combination = getCurrentCombination();
  const r32 = ROUNDS[0];
  for (const m of r32.matches) {
    if (!bracketTeams[m.id]) bracketTeams[m.id] = { home: null, away: null };
    bracketTeams[m.id].home = resolveGroupSeed(m.seedHome, qualified);
    const homeSeed = R32_THIRD_MATCHES[m.id];
    if (homeSeed && combination) {
      const thirdSeed = combination[homeSeed];
      resolvedThirdLabels[m.id] = thirdSeed || null;
      bracketTeams[m.id].away = thirdSeed ? resolveGroupSeed(thirdSeed, qualified) : null;
    } else {
      bracketTeams[m.id].away = resolveGroupSeed(m.seedAway, qualified);
    }
  }
  propagateWinners();

  const wrapper = document.createElement("div");
  wrapper.className = "bracket-scroll";

  const inner = document.createElement("div");
  inner.className = "bracket-inner";

  for (let ri = 0; ri < ROUNDS.length; ri++) {
    inner.appendChild(buildRoundColumn(ROUNDS[ri], ri > 0));
  }

  // Third place column alongside final
  const thirdCol = buildThirdPlaceColumn();
  inner.appendChild(thirdCol);

  wrapper.appendChild(inner);
  container.appendChild(wrapper);
}

function buildRoundColumn(round, hasIncoming = false) {
  const col = document.createElement("div");
  col.className = "bracket-round" + (hasIncoming ? " bracket-round--has-incoming" : "");
  col.dataset.round = round.id;

  const label = document.createElement("div");
  label.className = "bracket-round__label";
  label.textContent = round.label;
  col.appendChild(label);

  const matchesWrap = document.createElement("div");
  matchesWrap.className = "bracket-matches";

  // Group matches into pairs for connector lines
  for (let i = 0; i < round.matches.length; i += 2) {
    const pair = document.createElement("div");
    const hasPair = !!round.matches[i + 1];
    pair.className = "bracket-pair" + (hasPair ? "" : " bracket-pair--single");

    pair.appendChild(buildMatchBox(round.matches[i]));
    if (hasPair) {
      pair.appendChild(buildMatchBox(round.matches[i + 1]));
    }

    matchesWrap.appendChild(pair);
  }

  col.appendChild(matchesWrap);
  return col;
}

function buildThirdPlaceColumn() {
  const col = document.createElement("div");
  col.className = "bracket-round bracket-round--side";

  const label = document.createElement("div");
  label.className = "bracket-round__label";
  label.textContent = "3.er puesto";
  col.appendChild(label);

  const wrap = document.createElement("div");
  wrap.className = "bracket-matches";

  const pair = document.createElement("div");
  pair.className = "bracket-pair bracket-pair--single";
  pair.appendChild(buildMatchBox(THIRD_PLACE));
  wrap.appendChild(pair);

  col.appendChild(wrap);
  return col;
}

function buildMatchBox(match) {
  const box = document.createElement("div");
  box.className = "bracket-match";
  box.dataset.matchId = match.id;

  const info = document.createElement("div");
  info.className = "bracket-match__info";
  info.textContent = `${match.date} · ${match.venue}`;
  box.appendChild(info);

  box.appendChild(buildTeamSlot(match.id, "home", match.seedHome));
  box.appendChild(buildTeamSlot(match.id, "away", match.seedAway));

  return box;
}

function buildTeamSlot(matchId, side, seedLabel) {
  const slot = document.createElement("div");
  slot.className = "bracket-team";
  slot.dataset.matchId = matchId;
  slot.dataset.side = side;

  const nameSpan = document.createElement("span");
  nameSpan.className = "bracket-team__name";
  nameSpan.dataset.matchId = matchId;
  nameSpan.dataset.side = side;

  const team = bracketTeams[matchId]?.[side];
  if (team) {
    nameSpan.textContent = `${team.flag} ${team.code}`;
  } else {
    const label = (side === "away" && resolvedThirdLabels[matchId]) ? resolvedThirdLabels[matchId] : seedLabel;
    nameSpan.textContent = label;
    nameSpan.classList.add("bracket-team__name--seed");
  }

  const scoreInput = document.createElement("input");
  scoreInput.type = "number";
  scoreInput.min = "0";
  scoreInput.step = "1";
  scoreInput.className = "bracket-score";
  scoreInput.dataset.matchId = matchId;
  scoreInput.dataset.side = side;
  scoreInput.placeholder = "–";
  scoreInput.value = bracketResults[matchId]?.[side] ?? "";

  scoreInput.addEventListener("input", () => handleBracketScore(matchId, side, scoreInput));

  slot.appendChild(nameSpan);
  slot.appendChild(scoreInput);
  return slot;
}

// ─── Actualizar texto de equipos en DOM existente ────────────────────────
function renderBracketTeams() {
  if (!bracketRoot) return;

  bracketRoot.querySelectorAll(".bracket-team__name").forEach(span => {
    const matchId = span.dataset.matchId;
    const side = span.dataset.side;
    const match = findMatch(matchId);
    const team = bracketTeams[matchId]?.[side];

    if (team) {
      span.textContent = `${team.flag} ${team.code}`;
      span.classList.remove("bracket-team__name--seed");
    } else {
      let label = match ? (side === "home" ? match.seedHome : match.seedAway) : "–";
      if (side === "away" && resolvedThirdLabels[matchId]) {
        label = resolvedThirdLabels[matchId];
      }
      span.textContent = label;
      span.classList.add("bracket-team__name--seed");
    }
  });
}

function findMatch(id) {
  for (const round of ROUNDS) {
    const m = round.matches.find(x => x.id === id);
    if (m) return m;
  }
  if (THIRD_PLACE.id === id) return THIRD_PLACE;
  return null;
}

// ─── Manejo de scores en el cuadro ──────────────────────────────────────
function handleBracketScore(matchId, side, input) {
  if (input.value !== "" && parseInt(input.value) < 0) input.value = "0";
  if (!bracketResults[matchId]) bracketResults[matchId] = { home: "", away: "" };
  bracketResults[matchId][side] = input.value;
  saveBracketState();
  propagateWinners();
  renderBracketTeams();
  // Sync score inputs for propagated teams
  syncBracketScoreInputs();
}

function syncBracketScoreInputs() {
  if (!bracketRoot) return;
  bracketRoot.querySelectorAll(".bracket-score").forEach(input => {
    const mid = input.dataset.matchId;
    const side = input.dataset.side;
    const saved = bracketResults[mid]?.[side] ?? "";
    if (input.value !== saved) input.value = saved;
  });
}
