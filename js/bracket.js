import { TEAMS } from "./teams.js";
import { saveResults, loadResults } from "./storage.js";
import { BEST_THIRDS_COMBINATIONS } from "./combinations.js";
import { matchProbabilities, predCache } from "./predictor.js";

// ─── Zona horaria por ciudad sede (verano / DST) ──────────────────────────
const VENUE_UTC = {
  "Boston":           -4,
  "New York/NJ":      -4,
  "Los Ángeles":      -7,
  "Monterrey":        -6,
  "Toronto":          -4,
  "San Francisco":    -7,
  "Seattle":          -7,
  "Houston":          -5,
  "Dallas":           -5,
  "Ciudad de México": -6,
  "Atlanta":          -4,
  "Miami":            -4,
  "Kansas City":      -5,
  "Vancouver":        -7,
  "Filadelfia":       -4,
};

function _fmtOffset(o) { return o >= 0 ? `+${o}` : `${o}`; }

function _toArgTime(localTime, utcOffset) {
  const [h, m] = localTime.split(":").map(Number);
  const argH = ((h + (-3 - utcOffset)) % 24 + 24) % 24;
  return `${String(argH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ─── Estructura del cuadro final FIFA 2026 ────────────────────────────────
const ROUNDS = [
  {
    id: "r32",
    label: "Dieciseisavos de final",
    matches: [
      { id: "r32_1",  seedHome: "1E",          seedAway: "3A/B/C/D/F", date: "29 jun", venue: "Boston",          time: "16:30" },
      { id: "r32_2",  seedHome: "1I",          seedAway: "3C/D/F/G/H", date: "30 jun", venue: "New York/NJ",     time: "17:00" },
      { id: "r32_3",  seedHome: "2A",          seedAway: "2B",         date: "28 jun", venue: "Los Ángeles",     time: "12:00" },
      { id: "r32_4",  seedHome: "1F",          seedAway: "2C",         date: "29 jun", venue: "Monterrey",       time: "19:00" },
      { id: "r32_5",  seedHome: "2K",          seedAway: "2L",         date: "2 jul",  venue: "Toronto",         time: "19:00" },
      { id: "r32_6",  seedHome: "1H",          seedAway: "2J",         date: "2 jul",  venue: "Los Ángeles",     time: "12:00" },
      { id: "r32_7",  seedHome: "1D",          seedAway: "3B/E/F/I/J", date: "1 jul",  venue: "San Francisco",   time: "17:00" },
      { id: "r32_8",  seedHome: "1G",          seedAway: "3A/E/H/I/J", date: "1 jul",  venue: "Seattle",         time: "13:00" },
      { id: "r32_9",  seedHome: "1C",          seedAway: "2F",         date: "29 jun", venue: "Houston",         time: "12:00" },
      { id: "r32_10", seedHome: "2E",          seedAway: "2I",         date: "30 jun", venue: "Dallas",          time: "12:00" },
      { id: "r32_11", seedHome: "1A",          seedAway: "3C/E/F/H/I", date: "30 jun", venue: "Ciudad de México",time: "19:00" },
      { id: "r32_12", seedHome: "1L",          seedAway: "3E/H/I/J/K", date: "1 jul",  venue: "Atlanta",         time: "12:00" },
      { id: "r32_13", seedHome: "1J",          seedAway: "2H",         date: "3 jul",  venue: "Miami",           time: "18:00" },
      { id: "r32_14", seedHome: "2D",          seedAway: "2G",         date: "3 jul",  venue: "Dallas",          time: "13:00" },
      { id: "r32_15", seedHome: "1B",          seedAway: "3E/F/G/I/J", date: "2 jul",  venue: "Vancouver",       time: "20:00" },
      { id: "r32_16", seedHome: "1K",          seedAway: "3D/E/I/J/L", date: "3 jul",  venue: "Kansas City",     time: "20:30" },
    ]
  },
  {
    id: "r16",
    label: "Octavos de final",
    matches: [
      { id: "r16_1", seedHome: "W r32_1",  seedAway: "W r32_2",  date: "4 jul",  venue: "Filadelfia",       time: "17:00" },
      { id: "r16_2", seedHome: "W r32_3",  seedAway: "W r32_4",  date: "4 jul",  venue: "Houston",          time: "12:00" },
      { id: "r16_3", seedHome: "W r32_5",  seedAway: "W r32_6",  date: "6 jul",  venue: "Dallas",           time: "14:00" },
      { id: "r16_4", seedHome: "W r32_7",  seedAway: "W r32_8",  date: "6 jul",  venue: "Seattle",          time: "17:00" },
      { id: "r16_5", seedHome: "W r32_9",  seedAway: "W r32_10", date: "5 jul",  venue: "New York/NJ",      time: "16:00" },
      { id: "r16_6", seedHome: "W r32_11", seedAway: "W r32_12", date: "5 jul",  venue: "Ciudad de México", time: "18:00" },
      { id: "r16_7", seedHome: "W r32_13", seedAway: "W r32_14", date: "7 jul",  venue: "Atlanta",          time: "12:00" },
      { id: "r16_8", seedHome: "W r32_15", seedAway: "W r32_16", date: "7 jul",  venue: "Vancouver",        time: "13:00" },
    ]
  },
  {
    id: "qf",
    label: "Cuartos de final",
    matches: [
      { id: "qf_1", seedHome: "W r16_1", seedAway: "W r16_2", date: "9 jul",  venue: "Boston",       time: "16:00" },
      { id: "qf_2", seedHome: "W r16_3", seedAway: "W r16_4", date: "10 jul", venue: "Los Ángeles",  time: "12:00" },
      { id: "qf_3", seedHome: "W r16_5", seedAway: "W r16_6", date: "11 jul", venue: "Miami",        time: "17:00" },
      { id: "qf_4", seedHome: "W r16_7", seedAway: "W r16_8", date: "11 jul", venue: "Kansas City",  time: "20:00" },
    ]
  },
  {
    id: "sf",
    label: "Semifinales",
    matches: [
      { id: "sf_1", seedHome: "W qf_1", seedAway: "W qf_2", date: "14 jul", venue: "Dallas",  time: "14:00" },
      { id: "sf_2", seedHome: "W qf_3", seedAway: "W qf_4", date: "15 jul", venue: "Atlanta", time: "15:00" },
    ]
  },
  {
    id: "final",
    label: "Final",
    matches: [
      { id: "final_1", seedHome: "W sf_1", seedAway: "W sf_2", date: "19 jul", venue: "New York/NJ", time: "15:00" },
    ]
  }
];

const THIRD_PLACE = { id: "third_1", seedHome: "P sf_1", seedAway: "P sf_2", date: "18 jul", venue: "Miami", time: "17:00" };

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
const bracketTeams = {};
const bracketResults = {};
const resolvedThirdLabels = {};
let lastChampionCode = null;
let isUserAction = false;

function loadBracketState() {
  const saved = loadResults("bracket");
  if (saved) Object.assign(bracketResults, saved);
}

function saveBracketState() {
  saveResults("bracket", bracketResults);
}

function resolveGroupSeed(seed, qualified) {
  if (!qualified) return null;
  const posMatch = seed.match(/^(\d)([A-L])$/);
  if (posMatch) {
    const pos = parseInt(posMatch[1]) - 1;
    const grp = posMatch[2];
    const rows = qualified[grp];
    if (!rows || rows.length < pos + 1) return null;
    if (rows[pos].pj === 0) return null;
    return rows[pos].team;
  }
  return null;
}

// ─── Propagar ganadores a través del cuadro ──────────────────────────────
// Processes rounds in order so each round's teams are resolved from the
// previous round's winners before computing that round's winners.
// This ensures saved bracket state is fully restored on page load.
function propagateWinners() {
  const winners = {};
  const losers = {};

  for (const round of ROUNDS) {
    // Step 1: populate this round's bracketTeams from already-computed winners
    for (const m of round.matches) {
      if (!bracketTeams[m.id]) bracketTeams[m.id] = { home: null, away: null };
      const hSrc = m.seedHome.match(/^W (.+)$/);
      const aSrc = m.seedAway.match(/^W (.+)$/);
      if (hSrc) bracketTeams[m.id].home = winners[hSrc[1]] ?? null;
      if (aSrc) bracketTeams[m.id].away = winners[aSrc[1]] ?? null;
    }
    // Step 2: compute winners for this round using the now-populated teams
    for (const m of round.matches) {
      const res = bracketResults[m.id];
      if (res && res.winner) {
        const hTeam = bracketTeams[m.id]?.home;
        const aTeam = bracketTeams[m.id]?.away;
        if (hTeam && aTeam) {
          winners[m.id] = res.winner === "home" ? hTeam : aTeam;
          losers[m.id] = res.winner === "home" ? aTeam : hTeam;
        }
      }
    }
  }

  if (!bracketTeams[THIRD_PLACE.id]) bracketTeams[THIRD_PLACE.id] = { home: null, away: null };
  const hSrc = THIRD_PLACE.seedHome.match(/^P (.+)$/);
  const aSrc = THIRD_PLACE.seedAway.match(/^P (.+)$/);
  if (hSrc) bracketTeams[THIRD_PLACE.id].home = losers[hSrc[1]] ?? null;
  if (aSrc) bracketTeams[THIRD_PLACE.id].away = losers[aSrc[1]] ?? null;
}

function getCurrentCombination() {
  const key = localStorage.getItem("worldcup2026_best_thirds_groups") || "";
  return BEST_THIRDS_COMBINATIONS[key] || null;
}

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
  updateChampion();
}

// ─── Construir DOM del cuadro ────────────────────────────────────────────
let bracketRoot = null;

export function buildBracket(container, qualified) {
  bracketRoot = container;
  loadBracketState();

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

  // Scrollable outer wrapper
  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "bracket-scroll";

  // Main bracket wrapper: left | center | right
  const wrapper = document.createElement("div");
  wrapper.className = "bracket-wrapper";

  // ── LEFT SIDE: R32[0-7], R16[0-3], QF[0-1], SF[0] ───────────────────
  const leftSide = document.createElement("div");
  leftSide.className = "bracket-side bracket-side--left";
  leftSide.appendChild(buildHalfColumn(ROUNDS[0], 0, 8, false, "left"));
  leftSide.appendChild(buildHalfColumn(ROUNDS[1], 0, 4, true,  "left"));
  leftSide.appendChild(buildHalfColumn(ROUNDS[2], 0, 2, true,  "left"));
  leftSide.appendChild(buildHalfColumn(ROUNDS[3], 0, 1, true,  "left"));

  // ── CENTER: Trophy + Final ───────────────────────────────────────────
  const centerCol = buildCenterColumn();

  // ── RIGHT SIDE: SF[1], QF[2-3], R16[4-7], R32[8-15] ─────────────────
  // Columns ordered closest-to-center first (SF → QF → R16 → R32)
  const rightSide = document.createElement("div");
  rightSide.className = "bracket-side bracket-side--right";
  rightSide.appendChild(buildHalfColumn(ROUNDS[3], 1, 2, true,  "right"));
  rightSide.appendChild(buildHalfColumn(ROUNDS[2], 2, 4, true,  "right"));
  rightSide.appendChild(buildHalfColumn(ROUNDS[1], 4, 8, true,  "right"));
  rightSide.appendChild(buildHalfColumn(ROUNDS[0], 8, 16, false, "right"));

  wrapper.appendChild(leftSide);
  wrapper.appendChild(centerCol);
  wrapper.appendChild(rightSide);

  scrollWrapper.appendChild(wrapper);

  // Botón de restablecer fase final
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "btn-reset bracket-reset-btn";
  resetBtn.textContent = "🔄 Restablecer Fase Final";
  resetBtn.addEventListener("click", () => {
    if (!confirm("¿Seguro que deseas restablecer todos los resultados de la Fase Final?")) return;
    resetBracket();
  });
  container.appendChild(resetBtn);

  // ── Radial toggle (desktop + mobile via CSS) ──
  const radialToggle = document.createElement("button");
  radialToggle.type = "button";
  radialToggle.className = "btn-radial-toggle";
  radialToggle.innerHTML =
    '<span class="btn-radial-toggle__mobile">VER LLAVES</span>' +
    '<span class="btn-radial-toggle__desktop">VISTA RADIAL</span>';
  container.appendChild(radialToggle);

  container.appendChild(scrollWrapper);
  container.appendChild(buildMobileView());

  _radialContainerEl = document.createElement("div");
  _radialContainerEl.className = "bracket-radial";
  container.appendChild(_radialContainerEl);

  radialToggle.addEventListener("click", () => {
    _radialActive = !_radialActive;
    if (_radialActive) {
      _rebuildRadialSVG();
      bracketRoot.classList.add("bracket--radial-active");
      radialToggle.textContent = "Vista normal";
      radialToggle.classList.add("btn-radial-toggle--active");
    } else {
      bracketRoot.classList.remove("bracket--radial-active");
      radialToggle.innerHTML =
        '<span class="btn-radial-toggle__mobile">VER LLAVES</span>' +
        '<span class="btn-radial-toggle__desktop">VISTA RADIAL</span>';
      radialToggle.classList.remove("btn-radial-toggle--active");
    }
  });

  // Champion banner (fixed at page bottom, created once, hidden outside bracket tab)
  if (!document.getElementById("champion-banner")) {
    const banner = document.createElement("div");
    banner.id = "champion-banner";
    banner.className = "champion-banner champion-banner--tab-hidden";
    document.body.appendChild(banner);
  }

  updateChampion();
  _setupSlotDelegation();

  window.addEventListener("resize", scaleBracketToFit);
}

// Aplica resultados del bracket cargados desde Firestore al estado en memoria y
// re-renderiza el bracket completo (equipos, radios y campeón).
export function applyBracketResultsFromFirebase(results) {
  if (!results || Object.keys(results).length === 0) return;
  Object.keys(bracketResults).forEach(k => delete bracketResults[k]);
  Object.assign(bracketResults, results);
  propagateWinners();
  renderBracketTeams();
  syncBracketRadios();
  updateChampion();
  document.dispatchEvent(new CustomEvent("bracketUpdated"));
}

export function resetBracket() {
  Object.keys(bracketResults).forEach(k => delete bracketResults[k]);
  saveBracketState();
  propagateWinners();
  renderBracketTeams();
  syncBracketRadios();
  updateChampion();
  document.dispatchEvent(new CustomEvent("bracketUpdated"));
}

export function scaleBracketToFit() {
  if (_radialActive) return;
  const scroll = bracketRoot?.querySelector(".bracket-scroll");
  const wrapper = bracketRoot?.querySelector(".bracket-wrapper");
  if (!scroll || !wrapper) return;

  wrapper.style.zoom = "";
  // En mobile se usa la vista alternativa por rondas, no el árbol con zoom
  if (window.innerWidth <= 768) return;

  const naturalW = wrapper.scrollWidth;
  const availableW = scroll.clientWidth;
  if (naturalW > availableW) {
    wrapper.style.zoom = String(availableW / naturalW);
  }
}

// ─── Vista mobile del bracket (rondas apiladas con tabs) ─────────────────
const MOBILE_ROUND_LABELS = {
  r32:   "R32",
  r16:   "Octavos",
  qf:    "Cuartos",
  sf:    "Semis",
  final: "Final",
  third: "3.°",
};

function buildMobileView() {
  const mobile = document.createElement("div");
  mobile.className = "bracket-mobile";

  const tabBar = document.createElement("div");
  tabBar.className = "bracket-mobile__tabs";

  const contentArea = document.createElement("div");
  contentArea.className = "bracket-mobile__content";

  const allRounds = [
    ...ROUNDS,
    { id: "third", label: "3.° Puesto", matches: [THIRD_PLACE] },
  ];

  allRounds.forEach((round, idx) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "bracket-mobile__tab" + (idx === 0 ? " bracket-mobile__tab--active" : "");
    tab.dataset.round = round.id;
    tab.textContent = MOBILE_ROUND_LABELS[round.id] || round.label;
    tab.addEventListener("click", () => {
      tabBar.querySelectorAll(".bracket-mobile__tab").forEach(t =>
        t.classList.toggle("bracket-mobile__tab--active", t === tab)
      );
      contentArea.querySelectorAll(".bracket-mobile__round").forEach(r =>
        r.classList.toggle("hidden", r.dataset.round !== round.id)
      );
    });
    tabBar.appendChild(tab);

    const roundDiv = document.createElement("div");
    roundDiv.className = "bracket-mobile__round" + (idx > 0 ? " hidden" : "");
    roundDiv.dataset.round = round.id;

    const roundLabel = document.createElement("div");
    roundLabel.className = "bracket-round__label";
    roundLabel.textContent = round.label;
    roundDiv.appendChild(roundLabel);

    // Trophy image in the Final sub-tab
    if (round.id === "final") {
      const trophyWrap = document.createElement("div");
      trophyWrap.className = "mobile-final__trophy";
      const trophyImg = document.createElement("img");
      trophyImg.src = "trophy.png";
      trophyImg.alt = "Trofeo Mundial";
      trophyImg.className = "mobile-final__trophy-img";
      trophyWrap.appendChild(trophyImg);
      roundDiv.appendChild(trophyWrap);
    }

    for (const match of round.matches) {
      roundDiv.appendChild(buildMatchBox(match));
    }

    contentArea.appendChild(roundDiv);
  });

  mobile.appendChild(tabBar);
  mobile.appendChild(contentArea);
  return mobile;
}

// Build a round column using only matches[startIdx..endIdx)
function buildHalfColumn(round, startIdx, endIdx, hasIncoming, side) {
  const col = document.createElement("div");
  col.className = "bracket-round" + (hasIncoming ? " bracket-round--has-incoming" : "");
  if (side === "right") col.classList.add("bracket-round--right");
  col.dataset.round = round.id;

  const label = document.createElement("div");
  label.className = "bracket-round__label";
  label.textContent = round.label;
  col.appendChild(label);

  const matchesWrap = document.createElement("div");
  matchesWrap.className = "bracket-matches";

  const matches = round.matches.slice(startIdx, endIdx);
  for (let i = 0; i < matches.length; i += 2) {
    const pair = document.createElement("div");
    const hasPair = !!matches[i + 1];
    pair.className = "bracket-pair" + (hasPair ? "" : " bracket-pair--single");
    if (side === "right") pair.classList.add("bracket-pair--right");

    pair.appendChild(buildMatchBox(matches[i]));
    if (hasPair) pair.appendChild(buildMatchBox(matches[i + 1]));

    matchesWrap.appendChild(pair);
  }

  col.appendChild(matchesWrap);
  return col;
}

function buildCenterColumn() {
  const col = document.createElement("div");
  col.className = "bracket-center";

  const trophyDiv = document.createElement("div");
  trophyDiv.className = "bracket-center__trophy";
  const img = document.createElement("img");
  img.src = "trophy.png";
  img.alt = "Trofeo Mundial";
  trophyDiv.appendChild(img);
  col.appendChild(trophyDiv);

  const finalWrap = document.createElement("div");
  finalWrap.className = "bracket-center__final";
  const finalLabel = document.createElement("div");
  finalLabel.className = "bracket-round__label";
  finalLabel.textContent = "Final";
  finalWrap.appendChild(finalLabel);
  finalWrap.appendChild(buildMatchBox(ROUNDS[4].matches[0]));
  col.appendChild(finalWrap);

  const champDiv = document.createElement("div");
  champDiv.id = "champion-display";
  champDiv.className = "bracket-center__champion";
  col.appendChild(champDiv);

  const thirdWrap = document.createElement("div");
  thirdWrap.className = "bracket-center__third";
  const thirdLabel = document.createElement("div");
  thirdLabel.className = "bracket-round__label";
  thirdLabel.textContent = "3.º Puesto";
  thirdWrap.appendChild(thirdLabel);
  thirdWrap.appendChild(buildMatchBox(THIRD_PLACE));
  col.appendChild(thirdWrap);

  return col;
}

function buildMatchBox(match) {
  const box = document.createElement("div");
  box.className = "bracket-match";
  box.dataset.matchId = match.id;

  const utcOffset = VENUE_UTC[match.venue] ?? -5;
  const argTime = _toArgTime(match.time, utcOffset);

  const info = document.createElement("div");
  info.className = "bracket-match__info";
  info.innerHTML =
    `${match.date} · ${match.venue}<br>` +
    `<span class="bracket-match__time">${match.time}&nbsp;(GMT${_fmtOffset(utcOffset)})&ensp;${argTime}&nbsp;(GMT-3)</span>`;
  box.appendChild(info);

  box.appendChild(buildTeamSlot(match.id, "home", match.seedHome));
  box.appendChild(buildTeamSlot(match.id, "away", match.seedAway));

  const probBar = document.createElement("div");
  probBar.className = "bracket-prob-bar";
  probBar.dataset.matchId = match.id;
  box.appendChild(probBar);

  if (match.id.startsWith("r32_")) {
    const labelsDiv = document.createElement("div");
    labelsDiv.className = "r32-labels";

    const homeLabel = document.createElement("div");
    homeLabel.className = "r32-label";
    homeLabel.textContent = formatSeedLabel(match.seedHome);

    const awayLabel = document.createElement("div");
    awayLabel.className = "r32-label";
    awayLabel.textContent = formatSeedLabel(match.seedAway);

    labelsDiv.appendChild(homeLabel);
    labelsDiv.appendChild(awayLabel);
    box.appendChild(labelsDiv);
  }

  return box;
}

function _buildBracketProbBarHTML(p1, px, p2, played, stale) {
  const segCls = [
    "prob-bar-segments",
    played ? "prob-bar-segments--played" : "",
    (stale && !played) ? "prob-bar-segments--stale" : "",
  ].filter(Boolean).join(" ");
  return `
    <div class="${segCls}">
      <div class="prob-bar-seg prob-bar-seg--win"  style="width:${(p1 * 100).toFixed(2)}%"></div>
      <div class="prob-bar-seg prob-bar-seg--draw" style="width:${(px * 100).toFixed(2)}%"></div>
      <div class="prob-bar-seg prob-bar-seg--loss" style="width:${(p2 * 100).toFixed(2)}%"></div>
    </div>
    <div class="prob-bar-labels">
      <span class="prob-bar-label--win">${Math.round(p1 * 100)}%</span>
      <span class="prob-bar-label--draw">${Math.round(px * 100)}%</span>
      <span class="prob-bar-label--loss">${Math.round(p2 * 100)}%</span>
    </div>`;
}

export function updateBracketProbBars() {
  if (!bracketRoot) return;
  bracketRoot.querySelectorAll(".bracket-prob-bar").forEach(bar => {
    const matchId = bar.dataset.matchId;
    const home    = bracketTeams[matchId]?.home;
    const away    = bracketTeams[matchId]?.away;
    if (!home || !away) { bar.innerHTML = ""; return; }
    const st      = predCache.strengthAdj ?? undefined;
    const played  = !!bracketResults[matchId]?.winner;
    const { p1, px, p2 } = matchProbabilities(home.code, away.code, st, null);
    bar.innerHTML = _buildBracketProbBarHTML(p1, px, p2, played, predCache.stale);
  });
}

function buildTeamSlot(matchId, side, seedLabel) {
  const slot = document.createElement("div");
  slot.className = "bracket-team";
  slot.dataset.matchId = matchId;
  slot.dataset.side = side;

  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = `match-${matchId}`;
  radio.value = side;
  radio.className = "bracket-radio";
  radio.dataset.matchId = matchId;
  radio.dataset.side = side;
  radio.checked = bracketResults[matchId]?.winner === side;
  radio.addEventListener("change", () => handleRadioSelection(matchId, side));

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

  slot.appendChild(nameSpan);

  if (matchId.startsWith("r32_")) {
    const inlineLabel = document.createElement("span");
    inlineLabel.className = "r32-label-inline";
    inlineLabel.textContent = formatSeedLabel(seedLabel);
    slot.appendChild(inlineLabel);

    // Indicator span (candidatos / confirmado)
    const indicator = document.createElement("span");
    indicator.className = "slot-indicator";
    indicator.dataset.matchId = matchId;
    indicator.dataset.side = side;
    slot.appendChild(indicator);
  }

  slot.appendChild(radio);
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
      if (side === "away" && resolvedThirdLabels[matchId]) label = resolvedThirdLabels[matchId];
      span.textContent = label;
      span.classList.add("bracket-team__name--seed");
    }
  });

  updateBracketProbBars();
  _updateRadialIfVisible();
}

function findMatch(id) {
  for (const round of ROUNDS) {
    const m = round.matches.find(x => x.id === id);
    if (m) return m;
  }
  if (THIRD_PLACE.id === id) return THIRD_PLACE;
  return null;
}

// ─── Manejo de selección radio ───────────────────────────────────────────
function handleRadioSelection(matchId, side) {
  if (!bracketResults[matchId]) bracketResults[matchId] = {};
  bracketResults[matchId].winner = side;
  saveBracketState();
  isUserAction = true;
  propagateWinners();
  renderBracketTeams();
  syncBracketRadios();
  updateChampion();
  isUserAction = false;
  document.dispatchEvent(new CustomEvent("bracketUpdated"));
}

function syncBracketRadios() {
  if (!bracketRoot) return;
  bracketRoot.querySelectorAll(".bracket-radio").forEach(radio => {
    const mid = radio.dataset.matchId;
    const side = radio.dataset.side;
    radio.checked = bracketResults[mid]?.winner === side;
  });
}

// ─── Campeón ─────────────────────────────────────────────────────────────
function updateChampion() {
  const finalMatch = ROUNDS[4].matches[0];
  const res = bracketResults[finalMatch.id];
  let champion = null;

  if (res && res.winner) {
    const hTeam = bracketTeams[finalMatch.id]?.home;
    const aTeam = bracketTeams[finalMatch.id]?.away;
    if (hTeam && aTeam) {
      champion = res.winner === "home" ? hTeam : aTeam;
    }
  }

  const banner = document.getElementById("champion-banner");
  const champDisplay = document.getElementById("champion-display");

  if (champion) {
    const teamName = champion.name || champion.code;

    if (banner) {
      banner.innerHTML =
        `<span class="champion-banner__trophy">🏆</span>` +
        `<span class="champion-banner__text">${champion.flag} ${teamName.toUpperCase()} CAMPEÓN!</span>` +
        `<span class="champion-banner__trophy">🏆</span>`;
      banner.classList.add("champion-banner--visible");
    }

    if (champDisplay) {
      champDisplay.innerHTML =
        `<div class="champion-center__flag">${champion.flag}</div>` +
        `<div class="champion-center__name">${teamName.toUpperCase()}</div>` +
        `<div class="champion-center__label">CAMPEÓN</div>`;
      champDisplay.classList.add("champion-display--visible");
    }

    if (lastChampionCode !== champion.code) {
      lastChampionCode = champion.code;
      if (isUserAction) launchConfetti();
    }
  } else {
    if (banner) banner.classList.remove("champion-banner--visible");
    if (champDisplay) champDisplay.classList.remove("champion-display--visible");
    lastChampionCode = null;
  }
}

// ─── Estadísticas del cuadro para el contador del header ─────────────────
export function getBracketStats() {
  const eliminatedCodes = new Set();
  let champion = null;
  let runnerUp = null;
  let thirdPlace = null;

  for (const round of ROUNDS) {
    for (const m of round.matches) {
      const res = bracketResults[m.id];
      if (res && res.winner) {
        const hTeam = bracketTeams[m.id]?.home;
        const aTeam = bracketTeams[m.id]?.away;
        if (hTeam && aTeam) {
          const winner = res.winner === "home" ? hTeam : aTeam;
          const loser  = res.winner === "home" ? aTeam : hTeam;
          if (m.id === "final_1") {
            champion = winner;
            runnerUp = loser;
          } else {
            eliminatedCodes.add(loser.code);
          }
        }
      }
    }
  }

  const thirdRes = bracketResults[THIRD_PLACE.id];
  if (thirdRes && thirdRes.winner) {
    const hTeam = bracketTeams[THIRD_PLACE.id]?.home;
    const aTeam = bracketTeams[THIRD_PLACE.id]?.away;
    if (hTeam && aTeam) {
      thirdPlace = thirdRes.winner === "home" ? hTeam : aTeam;
    }
  }

  return { eliminatedCodes, champion, runnerUp, thirdPlace };
}

// ─── Confeti ─────────────────────────────────────────────────────────────
function launchConfetti() {
  const existing = document.getElementById("confetti-canvas");
  if (existing) existing.remove();

  const canvas = document.createElement("canvas");
  canvas.id = "confetti-canvas";
  document.body.appendChild(canvas);

  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  const COLORS = ["#FFD700","#FFC200","#FF6B6B","#FF4757","#2ED573","#1E90FF","#FF6348","#ECCC68","#A29BFE","#FD79A8","#FFFFFF"];
  const TOTAL = 280;

  const particles = Array.from({ length: TOTAL }, () => ({
    x: Math.random() * W,
    y: Math.random() * H - H,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: Math.random() * 12 + 6,
    h: Math.random() * 7 + 4,
    speedY: Math.random() * 4 + 2,
    speedX: (Math.random() - 0.5) * 3,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 10,
    opacity: 1,
  }));

  let frame = 0;
  const MAX_FRAMES = 400;

  function animate() {
    ctx.clearRect(0, 0, W, H);
    const progress = frame / MAX_FRAMES;

    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;
      p.opacity = Math.max(0, 1 - Math.pow(progress * 1.3, 2));

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    frame++;
    if (frame < MAX_FRAMES) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
}

// ─── Vista Radial (llaves circulares, mobile only) ───────────────────────────
let _radialActive = false;
let _radialContainerEl = null;
let _radialInfoOverlay = null;
let _radialInfoModal = null;

const _RBK = {
  CX: 180, CY: 180,
  R:  { team: 150, r32w: 118, r16w: 88, qfw: 60, sfw: 36 },
  NR: { team: 11,  r32w: 7.5, r16w: 6,  qfw: 5,  sfw: 4.5 },
};

function _rbkAngle(slot) {
  return -Math.PI / 2 + slot * (2 * Math.PI / 32);
}

function _rbkPt(r, a) {
  return [_RBK.CX + r * Math.cos(a), _RBK.CY + r * Math.sin(a)];
}

function _svgNS(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function _buildRadialSVG() {
  const { eliminatedCodes } = getBracketStats();
  const R32 = ROUNDS[0].matches;
  const R16 = ROUNDS[1].matches;
  const QF  = ROUNDS[2].matches;
  const SF  = ROUNDS[3].matches;
  const FIN = ROUNDS[4].matches[0];

  const svg = _svgNS("svg", { viewBox: "0 0 360 360", xmlns: "http://www.w3.org/2000/svg" });
  svg.style.cssText = "width:100%;max-width:580px;display:block;margin:0 auto;touch-action:manipulation;overflow:hidden";

  /* ── defs ── */
  const defs = _svgNS("defs");
  // Grayscale filter for eliminated teams
  const gf = _svgNS("filter", { id: "rbk-gray" });
  gf.appendChild(_svgNS("feColorMatrix", { type: "saturate", values: "0" }));
  defs.appendChild(gf);
  // Background radial glow gradient
  const gr = _svgNS("radialGradient", { id: "rbk-glow", cx: "50%", cy: "50%", r: "38%", fx: "50%", fy: "50%" });
  const gs1 = _svgNS("stop", { offset: "0%",   "stop-color": "#FFD700", "stop-opacity": "0.18" });
  const gs2 = _svgNS("stop", { offset: "100%", "stop-color": "#FFD700", "stop-opacity": "0"    });
  gr.appendChild(gs1); gr.appendChild(gs2);
  defs.appendChild(gr);
  // Golden drop-shadow for trophy image (larger region to accommodate bigger trophy)
  const tgf = _svgNS("filter", { id: "rbk-trophy-glow", x: "-80%", y: "-80%", width: "260%", height: "260%" });
  const tds = _svgNS("feDropShadow", { dx: "0", dy: "0", stdDeviation: "8", "flood-color": "#FFD700", "flood-opacity": "0.95" });
  tgf.appendChild(tds);
  defs.appendChild(tgf);
  svg.appendChild(defs);

  /* ── background ── */
  svg.appendChild(_svgNS("rect", { width: 360, height: 360, fill: "#0a0e1a" }));
  svg.appendChild(_svgNS("circle", { cx: 180, cy: 180, r: 180, fill: "url(#rbk-glow)" }));

  /* ── node positions ── */
  const outerPts = Array.from({ length: 32 }, (_, s) => _rbkPt(_RBK.R.team, _rbkAngle(s)));
  const r32wPts  = Array.from({ length: 16 }, (_, k) => _rbkPt(_RBK.R.r32w, _rbkAngle(2*k + 0.5)));
  const r16wPts  = Array.from({ length: 8  }, (_, k) => _rbkPt(_RBK.R.r16w, _rbkAngle(4*k + 1.5)));
  const qfwPts   = Array.from({ length: 4  }, (_, k) => _rbkPt(_RBK.R.qfw,  _rbkAngle(8*k + 3.5)));
  const sfwPts   = Array.from({ length: 2  }, (_, k) => _rbkPt(_RBK.R.sfw,  _rbkAngle(16*k + 7.5)));

  /* ── lit-edge keys ── */
  const lit = new Set();
  const _checkLit = (m, k, prefix) => {
    const res = bracketResults[m.id];
    const ht  = bracketTeams[m.id]?.home;
    const at  = bracketTeams[m.id]?.away;
    if (res?.winner && ht && at) lit.add(`${prefix}_${k}_${res.winner === "home" ? "h" : "a"}`);
  };
  R32.forEach((m, k) => _checkLit(m, k, "r32"));
  R16.forEach((m, k) => _checkLit(m, k, "r16"));
  QF.forEach( (m, k) => _checkLit(m, k, "qf"));
  SF.forEach( (m, k) => _checkLit(m, k, "sf"));
  {
    const res = bracketResults[FIN.id];
    const ht  = bracketTeams[FIN.id]?.home;
    const at  = bracketTeams[FIN.id]?.away;
    if (res?.winner && ht && at) lit.add(res.winner === "home" ? "fin_h" : "fin_a");
  }

  /* ── lines ── */
  const lineG = _svgNS("g");
  const ln = (x1, y1, x2, y2, key) => {
    const on = lit.has(key);
    lineG.appendChild(_svgNS("line", {
      x1: x1.toFixed(2), y1: y1.toFixed(2),
      x2: x2.toFixed(2), y2: y2.toFixed(2),
      stroke: on ? "#FFD700" : "#2a3558",
      "stroke-width": on ? "1.5" : "0.8",
      opacity: on ? "1" : "0.5",
      "stroke-linecap": "round",
    }));
  };
  // outer → r32w
  R32.forEach((_, k) => {
    const [hx, hy] = outerPts[2*k];
    const [ax, ay] = outerPts[2*k+1];
    const [wx, wy] = r32wPts[k];
    ln(hx, hy, wx, wy, `r32_${k}_h`);
    ln(ax, ay, wx, wy, `r32_${k}_a`);
  });
  // r32w → r16w
  R16.forEach((_, k) => {
    const [hx, hy] = r32wPts[2*k];
    const [ax, ay] = r32wPts[2*k+1];
    const [wx, wy] = r16wPts[k];
    ln(hx, hy, wx, wy, `r16_${k}_h`);
    ln(ax, ay, wx, wy, `r16_${k}_a`);
  });
  // r16w → qfw
  QF.forEach((_, k) => {
    const [hx, hy] = r16wPts[2*k];
    const [ax, ay] = r16wPts[2*k+1];
    const [wx, wy] = qfwPts[k];
    ln(hx, hy, wx, wy, `qf_${k}_h`);
    ln(ax, ay, wx, wy, `qf_${k}_a`);
  });
  // qfw → sfw
  SF.forEach((_, k) => {
    const [hx, hy] = qfwPts[2*k];
    const [ax, ay] = qfwPts[2*k+1];
    const [wx, wy] = sfwPts[k];
    ln(hx, hy, wx, wy, `sf_${k}_h`);
    ln(ax, ay, wx, wy, `sf_${k}_a`);
  });
  // sfw → center
  sfwPts.forEach(([x, y], k) => ln(x, y, _RBK.CX, _RBK.CY, k === 0 ? "fin_h" : "fin_a"));
  svg.appendChild(lineG);

  /* ── inner winner nodes ── */
  const addInner = (pts, nrKey, matches) => {
    pts.forEach(([x, y], k) => {
      const m   = matches[k];
      const res = m ? bracketResults[m.id] : null;
      const team = (res?.winner && bracketTeams[m.id]?.[res.winner]) || null;
      const nr  = _RBK.NR[nrKey];
      const g   = _svgNS("g", { transform: `translate(${x.toFixed(2)},${y.toFixed(2)})` });
      g.appendChild(_svgNS("circle", {
        r: nr, fill: "#131929",
        stroke: team ? "#FFD70055" : "#1c2540",
        "stroke-width": "0.8",
      }));
      if (team) {
        const t = _svgNS("text", {
          "font-size": Math.round(nr * 1.4),
          "text-anchor": "middle",
          "dominant-baseline": "central",
          y: "0.5",
          "font-family": "system-ui, sans-serif",
        });
        t.textContent = team.flag;
        g.appendChild(t);
      }
      svg.appendChild(g);
    });
  };
  addInner(r32wPts, "r32w", R32);
  addInner(r16wPts, "r16w", R16);
  addInner(qfwPts,  "qfw",  QF);
  addInner(sfwPts,  "sfw",  SF);

  /* ── center trophy ── */
  {
    const finRes = bracketResults[FIN.id];
    const champ  = (finRes?.winner && bracketTeams[FIN.id]?.[finRes.winner]) || null;
    const cg = _svgNS("g", { transform: `translate(${_RBK.CX},${_RBK.CY})` });
    // Trophy image — free-standing (no backing circle), sized relative to innermost ring radius (sfw=36)
    // Use ~70% of sfw radius so it stays clear of inner nodes on small screens
    const tSize = Math.round(_RBK.R.sfw * 1.4); // ≈50 units (viewBox 360)
    const timg = _svgNS("image", {
      href: "trophy.png",
      x: -tSize / 2, y: -tSize / 2,
      width: tSize,
      height: tSize,
      preserveAspectRatio: "xMidYMid meet",
      filter: "url(#rbk-trophy-glow)",
    });
    cg.appendChild(timg);
    // Champion flag badge slightly below the trophy
    if (champ) {
      const cf = _svgNS("text", {
        "font-size": "13",
        "text-anchor": "middle",
        "dominant-baseline": "auto",
        y: String(tSize / 2 + 13),
        "font-family": "system-ui, sans-serif",
      });
      cf.textContent = champ.flag;
      cg.appendChild(cf);
    }
    svg.appendChild(cg);
  }

  /* ── outer ring team nodes (top layer) ── */
  R32.forEach((m, k) => {
    for (const [off, side] of [[0, "home"], [1, "away"]]) {
      const [x, y] = outerPts[2*k + off];
      const team   = bracketTeams[m.id]?.[side] ?? null;
      const isElim = team && eliminatedCodes.has(team.code);
      const nr     = _RBK.NR.team;
      const g = _svgNS("g", {
        transform: `translate(${x.toFixed(2)},${y.toFixed(2)})`,
        "data-match-id": m.id,
        "data-side": side,
      });
      g.style.cursor = "pointer";
      if (isElim) { g.setAttribute("filter", "url(#rbk-gray)"); g.setAttribute("opacity", "0.4"); }
      g.appendChild(_svgNS("circle", {
        r: nr, fill: "#131929",
        stroke: isElim ? "#1c2540" : "#3a4a6a",
        "stroke-width": "1",
      }));
      if (team) {
        const t = _svgNS("text", {
          "font-size": "13",
          "text-anchor": "middle",
          "dominant-baseline": "central",
          y: "0.5",
          "font-family": "system-ui, sans-serif",
        });
        t.textContent = team.flag;
        g.appendChild(t);
      } else {
        g.appendChild(_svgNS("circle", { r: "3.5", fill: "#2a3558" }));
      }
      svg.appendChild(g);
    }
  });

  return svg;
}

function _ensureRadialModal() {
  if (_radialInfoOverlay) return;
  _radialInfoOverlay = document.createElement("div");
  _radialInfoOverlay.className = "sct-modal-overlay";
  _radialInfoModal = document.createElement("div");
  _radialInfoModal.className = "sct-modal";
  _radialInfoModal.setAttribute("role", "dialog");
  _radialInfoModal.setAttribute("aria-modal", "true");
  _radialInfoOverlay.appendChild(_radialInfoModal);
  document.body.appendChild(_radialInfoOverlay);
  _radialInfoOverlay.addEventListener("click", e => {
    if (e.target === _radialInfoOverlay) _closeRadialModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") _closeRadialModal();
  });
}

function _closeRadialModal() {
  _radialInfoOverlay?.classList.remove("sct-modal-overlay--visible");
  document.body.style.overflow = "";
}

function _openRadialModal(matchId, side) {
  _ensureRadialModal();
  const m    = findMatch(matchId);
  if (!m) return;
  const team = bracketTeams[matchId]?.[side];
  const res  = bracketResults[matchId];
  const seed = side === "home" ? m.seedHome : m.seedAway;

  const teamLine = team
    ? `<div class="sct-item"><span class="sct-flag">${team.flag}</span><span class="sct-name">${team.name} (${team.code})</span></div>`
    : `<div class="sct-item"><span class="sct-name" style="color:var(--text-muted)">${seed}</span></div>`;

  let resultLine = "";
  if (res?.winner) {
    const winner = bracketTeams[matchId]?.[res.winner];
    const loser  = bracketTeams[matchId]?.[res.winner === "home" ? "away" : "home"];
    if (winner && loser) {
      resultLine = `<div class="sct-stale" style="margin-top:.5rem;font-size:.8rem;color:var(--text-muted)">
        ✓ ${winner.flag} ${winner.name} venció a ${loser.flag} ${loser.name}
      </div>`;
    }
  }

  _radialInfoModal.innerHTML = `
    <div class="sct-modal__header">
      <div>
        <div class="sct-modal__title">${matchId.toUpperCase().replace("_", " ")}</div>
        <div class="sct-modal__subtitle">${m.date} · ${m.venue}</div>
      </div>
      <button class="sct-modal__close" aria-label="Cerrar">✕</button>
    </div>
    <div class="sct-modal__body">${teamLine}${resultLine}</div>`;

  _radialInfoModal.querySelector(".sct-modal__close").addEventListener("click", _closeRadialModal);
  _radialInfoOverlay.classList.add("sct-modal-overlay--visible");
  document.body.style.overflow = "hidden";
}

function _updateRadialIfVisible() {
  if (!_radialActive || !_radialContainerEl) return;
  _rebuildRadialSVG();
}

function _rebuildRadialSVG() {
  if (!_radialContainerEl) return;
  const newSvg = _buildRadialSVG();
  const old = _radialContainerEl.querySelector("svg");
  if (old) old.replaceWith(newSvg);
  else _radialContainerEl.appendChild(newSvg);
  newSvg.addEventListener("click", e => {
    const g = e.target.closest?.("g[data-match-id]");
    if (!g) return;
    _openRadialModal(g.dataset.matchId, g.dataset.side);
  });
}

// ─── FEATURE: Candidatos por slot R32 ────────────────────────────────────────

let _tooltipEl = null;
let _modalOverlayEl = null;
let _modalEl = null;
let _delegationReady = false;
let _currentHoveredSlot = null;

function _ensureTooltip() {
  if (_tooltipEl) return _tooltipEl;
  _tooltipEl = document.createElement("div");
  _tooltipEl.className = "slot-candidates-tooltip";
  _tooltipEl.setAttribute("role", "tooltip");
  _tooltipEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(_tooltipEl);
  return _tooltipEl;
}

function _ensureModal() {
  if (_modalOverlayEl) return;
  _modalOverlayEl = document.createElement("div");
  _modalOverlayEl.className = "sct-modal-overlay";
  _modalEl = document.createElement("div");
  _modalEl.className = "sct-modal";
  _modalEl.setAttribute("role", "dialog");
  _modalEl.setAttribute("aria-modal", "true");
  _modalOverlayEl.appendChild(_modalEl);
  document.body.appendChild(_modalOverlayEl);
  _modalOverlayEl.addEventListener("click", (e) => {
    if (e.target === _modalOverlayEl) _closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") _closeModal();
  });
}

function _closeModal() {
  if (!_modalOverlayEl) return;
  _modalOverlayEl.classList.remove("sct-modal-overlay--visible");
  document.body.style.overflow = "";
}

function _formatSlotLabel(seed) {
  const m1 = seed.match(/^([12])([A-L])$/);
  if (m1) return `${m1[1]}° Grupo ${m1[2]}`;
  const m3 = seed.match(/^3([A-L/]+)$/);
  if (m3) return `3° Mejor Tercero (${m3[1]})`;
  return seed;
}

function formatSeedLabel(seed) {
  const m1 = seed.match(/^([12])([A-L])$/);
  if (m1) return `${m1[1]}° GRUPO ${m1[2]}`;
  const m3 = seed.match(/^3([A-L/]+)$/);
  if (m3) return `3° MEJOR TERCERO ${m3[1]}`;
  return seed;
}

function _getSlotCandidates(matchId, side) {
  if (!predCache.slotDist || predCache.stale) return null;
  const dist = predCache.slotDist[matchId]?.[side];
  if (!dist) return null;
  return Object.entries(dist)
    .filter(([, p]) => p >= 0.005)
    .map(([code, prob]) => ({ team: TEAMS[code], prob }))
    .filter(({ team }) => !!team)
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 8);
}

function _buildCandidatesHTML(candidates) {
  return candidates.map(({ team, prob }) => {
    const pct = Math.round(prob * 100);
    const w = (prob * 100).toFixed(1);
    return `<div class="sct-item">
      <span class="sct-flag">${team.flag}</span>
      <span class="sct-name">${team.code}</span>
      <div class="sct-bar-wrap"><div class="sct-bar" style="width:${w}%"></div></div>
      <span class="sct-pct">${pct}%</span>
    </div>`;
  }).join("");
}

function _buildSlotContent(slotLabel, candidates, stale) {
  const labelHTML = `<div class="sct-slot-label">${slotLabel}</div>`;
  if (stale || !candidates || candidates.length === 0) {
    return labelHTML + `<div class="sct-stale">Simulá para ver candidatos</div>`;
  }
  return labelHTML + _buildCandidatesHTML(candidates);
}

function _showTooltip(slotEl, matchId, side) {
  const tt = _ensureTooltip();
  const m = findMatch(matchId);
  if (!m) return;
  const seed = side === "home" ? m.seedHome : m.seedAway;
  const slotLabel = _formatSlotLabel(seed);
  const candidates = _getSlotCandidates(matchId, side);
  const stale = predCache.stale || !predCache.slotDist;

  tt.innerHTML = _buildSlotContent(slotLabel, candidates, stale);

  const rect = slotEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ttW = 240;
  const ttH = tt.offsetHeight || 160;

  let left = rect.right + 8;
  if (left + ttW > vw - 8) left = rect.left - ttW - 8;
  left = Math.max(8, Math.min(vw - ttW - 8, left));

  let top = rect.top;
  if (top + ttH > vh - 8) top = Math.max(8, vh - ttH - 8);

  tt.style.left = `${left}px`;
  tt.style.top = `${top}px`;
  tt.classList.add("slot-candidates-tooltip--visible");
}

function _hideTooltip() {
  _tooltipEl?.classList.remove("slot-candidates-tooltip--visible");
}

function _openModal(matchId, side) {
  _ensureModal();
  const m = findMatch(matchId);
  if (!m) return;
  const seed = side === "home" ? m.seedHome : m.seedAway;
  const slotLabel = _formatSlotLabel(seed);
  const candidates = _getSlotCandidates(matchId, side);
  const stale = predCache.stale || !predCache.slotDist;

  _modalEl.innerHTML = `
    <div class="sct-modal__header">
      <div>
        <div class="sct-modal__title">Candidatos al slot</div>
        <div class="sct-modal__subtitle">${slotLabel}</div>
      </div>
      <button class="sct-modal__close" aria-label="Cerrar">✕</button>
    </div>
    <div class="sct-modal__body">
      ${stale || !candidates || candidates.length === 0
        ? `<div class="sct-stale">Simulá para ver candidatos</div>`
        : _buildCandidatesHTML(candidates)
      }
    </div>`;

  _modalEl.querySelector(".sct-modal__close").addEventListener("click", _closeModal);
  _modalOverlayEl.classList.add("sct-modal-overlay--visible");
  document.body.style.overflow = "hidden";
}

function _setupSlotDelegation() {
  if (_delegationReady) return;
  _delegationReady = true;

  _ensureTooltip();
  _ensureModal();

  // Desktop hover — usa mouseover/mouseout (burbujean) con guard de slot
  document.addEventListener("mouseover", (e) => {
    const slot = e.target.closest?.(".bracket-team[data-r32-provisional]");
    if (slot === _currentHoveredSlot) return;
    if (_currentHoveredSlot) _hideTooltip();
    _currentHoveredSlot = slot || null;
    if (!slot) return;
    _showTooltip(slot, slot.dataset.matchId, slot.dataset.side);
  });

  document.addEventListener("mouseout", (e) => {
    if (!_currentHoveredSlot) return;
    const toEl = e.relatedTarget;
    const toSlot = toEl?.closest?.(".bracket-team[data-r32-provisional]");
    if (toSlot !== _currentHoveredSlot) {
      _hideTooltip();
      _currentHoveredSlot = null;
    }
  });

  // Mobile tap — click en el nombre dentro de slot provisional
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 768) return;
    const nameSpan = e.target.closest?.(
      ".bracket-team[data-r32-provisional] .bracket-team__name"
    );
    if (!nameSpan) return;
    const bt = nameSpan.closest(".bracket-team");
    e.stopPropagation();
    _openModal(bt.dataset.matchId, bt.dataset.side);
  });
}

function _isGroupComplete(groupLabel, groups, state) {
  const group = groups.find(g => g.label === groupLabel);
  if (!group) return false;
  const gs = state[group.id] || {};
  return group.fixtures.every(fix => {
    const r = gs[fix.id];
    return r && r.home !== "" && r.away !== "" &&
           !isNaN(parseInt(r.home, 10)) && !isNaN(parseInt(r.away, 10));
  });
}

function _isSlotConfirmed(matchId, side, team, match, groups, state) {
  if (!team) return false;

  // Con datos MC frescos: confirmar si la probabilidad del equipo actual es ≥ 99.9%
  if (predCache.slotDist && !predCache.stale) {
    const prob = predCache.slotDist[matchId]?.[side]?.[team.code] ?? 0;
    return prob >= 0.999;
  }

  // Sin MC: confirmar si el grupo del seed está completo
  const seed = side === "home" ? match.seedHome : match.seedAway;
  const regularMatch = seed.match(/^[12]([A-L])$/);
  if (regularMatch) return _isGroupComplete(regularMatch[1], groups, state);

  // Slot de mejor tercero: provisional salvo confirmación MC
  return false;
}

export function updateR32SlotIndicators(groups, state) {
  if (!bracketRoot) return;

  for (const match of ROUNDS[0].matches) {
    for (const side of ["home", "away"]) {
      const team = bracketTeams[match.id]?.[side];
      const confirmed = _isSlotConfirmed(match.id, side, team, match, groups, state);

      // Actualizar todos los indicadores de este slot (desktop + mobile)
      bracketRoot.querySelectorAll(
        `.slot-indicator[data-match-id="${match.id}"][data-side="${side}"]`
      ).forEach(ind => {
        if (!team) {
          ind.className = "slot-indicator";
          ind.textContent = "";
          ind.removeAttribute("title");
        } else if (confirmed) {
          ind.className = "slot-indicator slot-indicator--confirmed";
          ind.textContent = "✓";
          ind.title = "Clasificación confirmada";
        } else {
          ind.className = "slot-indicator slot-indicator--provisional";
          ind.textContent = "*";
          ind.removeAttribute("title");
        }
      });

      // Marcar el .bracket-team para event delegation
      bracketRoot.querySelectorAll(
        `.bracket-team[data-match-id="${match.id}"][data-side="${side}"]`
      ).forEach(bt => {
        if (!team || confirmed) {
          delete bt.dataset.r32Provisional;
        } else {
          bt.dataset.r32Provisional = "true";
        }
      });
    }
  }
}
