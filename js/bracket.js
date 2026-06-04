import { TEAMS } from "./teams.js";
import { saveResults, loadResults } from "./storage.js";
import { BEST_THIRDS_COMBINATIONS } from "./combinations.js";

// ─── Estructura del cuadro final FIFA 2026 ────────────────────────────────
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
  container.appendChild(scrollWrapper);

  // Champion banner (fixed at page bottom, created once, hidden outside bracket tab)
  if (!document.getElementById("champion-banner")) {
    const banner = document.createElement("div");
    banner.id = "champion-banner";
    banner.className = "champion-banner champion-banner--tab-hidden";
    document.body.appendChild(banner);
  }

  updateChampion();

  window.addEventListener("resize", scaleBracketToFit);
}

export function scaleBracketToFit() {
  const scroll = bracketRoot?.querySelector(".bracket-scroll");
  const wrapper = bracketRoot?.querySelector(".bracket-wrapper");
  if (!scroll || !wrapper) return;

  wrapper.style.zoom = "";
  const naturalW = wrapper.scrollWidth;
  const availableW = scroll.clientWidth;
  if (naturalW > availableW) {
    wrapper.style.zoom = String(availableW / naturalW);
  }
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

  slot.appendChild(radio);
  slot.appendChild(nameSpan);
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
