// audit_champion_path.mjs — Auditoría caminos del campeón (100 iteraciones)
// Ejecutar: node audit_champion_path.mjs
// SIN modificar el motor. Solo importa funciones públicas.

import {
  simulateMatch, matchProbabilities,
  recalibrateStrengths, STRENGTH, STADIUM_COUNTRY,
} from "./js/predictor.js";
import { computeStandings, computeBestThirds } from "./js/standings.js";
import { BEST_THIRDS_COMBINATIONS }            from "./js/combinations.js";
import {
  GROUP_A_FIXTURES, GROUP_B_FIXTURES, GROUP_C_FIXTURES,
  GROUP_D_FIXTURES, GROUP_E_FIXTURES, GROUP_F_FIXTURES,
  GROUP_G_FIXTURES, GROUP_H_FIXTURES, GROUP_I_FIXTURES,
  GROUP_J_FIXTURES, GROUP_K_FIXTURES, GROUP_L_FIXTURES,
} from "./js/fixtures.js";

// ─── Grupos ───────────────────────────────────────────────────────────────────
const GROUPS = [
  { id: "groupA", label: "A", teams: ["MEX","RSA","KOR","CZE"], fixtures: GROUP_A_FIXTURES },
  { id: "groupB", label: "B", teams: ["CAN","BIH","QAT","SUI"], fixtures: GROUP_B_FIXTURES },
  { id: "groupC", label: "C", teams: ["BRA","MAR","HAI","SCO"], fixtures: GROUP_C_FIXTURES },
  { id: "groupD", label: "D", teams: ["USA","PAR","AUS","TUR"], fixtures: GROUP_D_FIXTURES },
  { id: "groupE", label: "E", teams: ["GER","CUW","CIV","ECU"], fixtures: GROUP_E_FIXTURES },
  { id: "groupF", label: "F", teams: ["NED","JPN","SWE","TUN"], fixtures: GROUP_F_FIXTURES },
  { id: "groupG", label: "G", teams: ["BEL","EGY","IRN","NZL"], fixtures: GROUP_G_FIXTURES },
  { id: "groupH", label: "H", teams: ["ESP","CPV","KSA","URU"], fixtures: GROUP_H_FIXTURES },
  { id: "groupI", label: "I", teams: ["FRA","SEN","IRQ","NOR"], fixtures: GROUP_I_FIXTURES },
  { id: "groupJ", label: "J", teams: ["ARG","ALG","AUT","JOR"], fixtures: GROUP_J_FIXTURES },
  { id: "groupK", label: "K", teams: ["POR","COD","UZB","COL"], fixtures: GROUP_K_FIXTURES },
  { id: "groupL", label: "L", teams: ["ENG","CRO","GHA","PAN"], fixtures: GROUP_L_FIXTURES },
];

// ─── STATE REAL al 26/06/2026 21:00 ──────────────────────────────────────────
// Completos: A B C D E F I
// MD3 pendiente: G H J K L
const state = {
  // GRUPO A — completo
  groupA: {
    1:  { home:"2", away:"0" }, // MEX 2-0 RSA   MD1
    2:  { home:"2", away:"1" }, // KOR 2-1 CZE   MD1  ← real (antes era KOR 0-3 CZE)
    25: { home:"1", away:"1" }, // CZE 1-1 RSA   MD2  ← real
    28: { home:"1", away:"0" }, // MEX 1-0 KOR   MD2  ← real
    53: { home:"0", away:"3" }, // CZE 0-3 MEX   MD3
    54: { home:"1", away:"0" }, // RSA 1-0 KOR   MD3
  },
  // GRUPO B — completo
  groupB: {
    3:  { home:"1", away:"1" }, // CAN 1-1 BIH   MD1  ← real
    8:  { home:"1", away:"1" }, // QAT 1-1 SUI   MD1  ← real
    26: { home:"4", away:"1" }, // SUI 4-1 BIH   MD2  ← real
    27: { home:"6", away:"0" }, // CAN 6-0 QAT   MD2  ← real
    51: { home:"2", away:"1" }, // SUI 2-1 CAN   MD3
    52: { home:"3", away:"1" }, // BIH 3-1 QAT   MD3
  },
  // GRUPO C — completo
  groupC: {
    7:  { home:"1", away:"1" }, // BRA 1-1 MAR   MD1  ← real
    5:  { home:"0", away:"1" }, // HAI 0-1 SCO   MD1
    29: { home:"3", away:"0" }, // BRA 3-0 HAI   MD2
    30: { home:"0", away:"1" }, // SCO 0-1 MAR   MD2  ← real
    49: { home:"0", away:"3" }, // SCO 0-3 BRA   MD3
    50: { home:"4", away:"2" }, // MAR 4-2 HAI   MD3
  },
  // GRUPO D — completo
  groupD: {
    4:  { home:"4", away:"1" }, // USA 4-1 PAR   MD1  ← real
    6:  { home:"2", away:"0" }, // AUS 2-0 TUR   MD1  ← real
    31: { home:"0", away:"1" }, // TUR 0-1 PAR   MD2  ← real
    32: { home:"2", away:"0" }, // USA 2-0 AUS   MD2
    59: { home:"3", away:"2" }, // TUR 3-2 USA   MD3
    60: { home:"0", away:"0" }, // PAR 0-0 AUS   MD3
  },
  // GRUPO E — completo
  groupE: {
    9:  { home:"7", away:"1" }, // GER 7-1 CUW   MD1  ← real
    10: { home:"1", away:"0" }, // CIV 1-0 ECU   MD1  ← real
    33: { home:"2", away:"1" }, // GER 2-1 CIV   MD2
    34: { home:"0", away:"0" }, // ECU 0-0 CUW   MD2  ← real
    55: { home:"0", away:"2" }, // CUW 0-2 CIV   MD3
    56: { home:"2", away:"1" }, // ECU 2-1 GER   MD3
  },
  // GRUPO F — completo
  groupF: {
    11: { home:"2", away:"2" }, // NED 2-2 JPN   MD1  ← real
    12: { home:"5", away:"1" }, // SWE 5-1 TUN   MD1  ← real
    35: { home:"5", away:"1" }, // NED 5-1 SWE   MD2  ← real
    36: { home:"0", away:"4" }, // TUN 0-4 JPN   MD2  ← real
    57: { home:"1", away:"1" }, // JPN 1-1 SWE   MD3
    58: { home:"1", away:"3" }, // TUN 1-3 NED   MD3
  },
  // GRUPO G — MD3 PENDIENTE
  groupG: {
    16: { home:"1", away:"1" }, // BEL 1-1 EGY   MD1  ← real
    15: { home:"2", away:"2" }, // IRN 2-2 NZL   MD1  ← real
    39: { home:"0", away:"0" }, // BEL 0-0 IRN   MD2  ← real
    40: { home:"1", away:"3" }, // NZL 1-3 EGY   MD2  ← real
    // fix 63 EGY-IRN, fix 64 NZL-BEL → pendientes
  },
  // GRUPO H — MD3 PENDIENTE
  groupH: {
    14: { home:"0", away:"0" }, // ESP 0-0 CPV   MD1  ← real
    13: { home:"1", away:"1" }, // KSA 1-1 URU   MD1  ← real
    38: { home:"4", away:"0" }, // ESP 4-0 KSA   MD2  ← real
    37: { home:"2", away:"2" }, // URU 2-2 CPV   MD2  ← real
    // fix 66 URU-ESP, fix 65 CPV-KSA → pendientes
  },
  // GRUPO I — completo
  groupI: {
    17: { home:"3", away:"1" }, // FRA 3-1 SEN   MD1  ← real
    18: { home:"1", away:"4" }, // IRQ 1-4 NOR   MD1  ← real
    42: { home:"3", away:"0" }, // FRA 3-0 IRQ   MD2
    41: { home:"3", away:"2" }, // NOR 3-2 SEN   MD2  ← real
    61: { home:"1", away:"4" }, // NOR 1-4 FRA   MD3
    62: { home:"5", away:"0" }, // SEN 5-0 IRQ   MD3
  },
  // GRUPO J — MD3 PENDIENTE
  groupJ: {
    19: { home:"3", away:"0" }, // ARG 3-0 ALG   MD1
    20: { home:"3", away:"1" }, // AUT 3-1 JOR   MD1  ← real
    43: { home:"2", away:"0" }, // ARG 2-0 AUT   MD2
    44: { home:"1", away:"2" }, // JOR 1-2 ALG   MD2
    // fix 70 JOR-ARG, fix 69 ALG-AUT → pendientes
  },
  // GRUPO K — MD3 PENDIENTE
  groupK: {
    23: { home:"1", away:"1" }, // POR 1-1 COD   MD1  ← real
    24: { home:"1", away:"3" }, // UZB 1-3 COL   MD1  ← real
    47: { home:"5", away:"0" }, // POR 5-0 UZB   MD2
    48: { home:"1", away:"0" }, // COL 1-0 COD   MD2
    // fix 71 COL-POR, fix 72 COD-UZB → pendientes
  },
  // GRUPO L — MD3 PENDIENTE
  groupL: {
    22: { home:"4", away:"2" }, // ENG 4-2 CRO   MD1  ← real
    21: { home:"1", away:"0" }, // GHA 1-0 PAN   MD1
    45: { home:"0", away:"0" }, // ENG 0-0 GHA   MD2  ← real
    46: { home:"0", away:"1" }, // PAN 0-1 CRO   MD2
    // fix 67 PAN-ENG, fix 68 CRO-GHA → pendientes
  },
};

// ─── Bracket R32 (idéntico a predictor.js) ────────────────────────────────────
const R32_SEEDS = [
  { home:"1E", away:null,  thirdSlot:"1E" },
  { home:"1I", away:null,  thirdSlot:"1I" },
  { home:"2A", away:"2B",  thirdSlot:null  },
  { home:"1F", away:"2C",  thirdSlot:null  },
  { home:"2K", away:"2L",  thirdSlot:null  },
  { home:"1H", away:"2J",  thirdSlot:null  },
  { home:"1D", away:null,  thirdSlot:"1D"  },
  { home:"1G", away:null,  thirdSlot:"1G"  },
  { home:"1C", away:"2F",  thirdSlot:null  },
  { home:"2E", away:"2I",  thirdSlot:null  },
  { home:"1A", away:null,  thirdSlot:"1A"  },
  { home:"1L", away:null,  thirdSlot:"1L"  },
  { home:"1J", away:"2H",  thirdSlot:null  },
  { home:"2D", away:"2G",  thirdSlot:null  },
  { home:"1B", away:null,  thirdSlot:"1B"  },
  { home:"1K", away:null,  thirdSlot:"1K"  },
];
const R16_PAIRS = [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13],[14,15]];
const QF_PAIRS  = [[0,1],[2,3],[4,5],[6,7]];
const SF_PAIRS  = [[0,1],[2,3]];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveSeed(seed, qualified) {
  const m = seed.match(/^(\d)([A-L])$/);
  if (!m) return null;
  const pos  = parseInt(m[1], 10) - 1;
  const rows = qualified[m[2]];
  if (!rows || rows.length <= pos) return null;
  return rows[pos].team.code;
}

// Replica knockoutWinner del motor, capturando el marcador
function knockoutWithScore(h, a, st) {
  const { home: hG, away: aG } = simulateMatch(h, a, null, st);
  if (hG !== aG) return { winner: hG > aG ? h : a, hGoals: hG, aGoals: aG, penalties: false };
  const sH = st[h] ?? 65, sA = st[a] ?? 65;
  const winner = Math.random() < sH / (sH + sA) ? h : a;
  return { winner, hGoals: hG, aGoals: aG, penalties: true };
}

function playRound(pairs, prevWinners, st) {
  return pairs.map(([i, j]) => {
    const h = prevWinners[i], a = prevWinners[j];
    if (!h && !a) return { h:null, a:null, winner:null, hGoals:0, aGoals:0, penalties:false };
    if (!h) return { h:null, a, winner:a, hGoals:0, aGoals:0, penalties:false };
    if (!a) return { h, a:null, winner:h, hGoals:0, aGoals:0, penalties:false };
    return { h, a, ...knockoutWithScore(h, a, st) };
  });
}

function pct(p) { return `${(p * 100).toFixed(0)}%`; }

function formatMatch(round, champ, h, a, hG, aG, penalties, st) {
  const { p1, px, p2 } = matchProbabilities(h, a, st);
  const pChamp = champ === h ? p1 : p2;
  const pRival = champ === h ? p2 : p1;
  const rival  = champ === h ? a : h;
  const [cG, rG] = champ === h ? [hG, aG] : [aG, hG];
  const penTag   = penalties ? " (pen)" : "";
  const surprise = pChamp < 0.35 ? " ⚡SORPRESA" : "";
  return (
    `  ${round.padEnd(8)}: ${champ} ${cG}-${rG} ${rival}${penTag}` +
    `   (${champ} ${pct(pChamp)} / X ${pct(px)} / ${rival} ${pct(pRival)})${surprise}`
  );
}

function printPath(iter, champ, path, groupPos) {
  console.log(`\n═══ ITERACIÓN ${iter} — CAMPEÓN: ${champ} (salió ${groupPos}) ${"═".repeat(Math.max(0, 37 - String(iter).length - champ.length))}`);
  for (const { round, match } of path) {
    const { h, a, hGoals, aGoals, penalties } = match;
    if (h && a) console.log(formatMatch(round, champ, h, a, hGoals, aGoals, penalties, STRENGTH_ADJ));
  }
}

// ─── Pre-procesamiento ────────────────────────────────────────────────────────
const STRENGTH_ADJ = recalibrateStrengths(GROUPS, state, STRENGTH);

const fixedResults   = {};
const pendingByGroup = {};
for (const group of GROUPS) {
  const gs = state[group.id] || {};
  fixedResults[group.id]   = {};
  pendingByGroup[group.id] = [];
  for (const fix of group.fixtures) {
    const r = gs[fix.id];
    if (r && r.home !== "" && r.away !== "" &&
        !isNaN(parseInt(r.home,10)) && !isNaN(parseInt(r.away,10))) {
      fixedResults[group.id][fix.id] = r;
    } else {
      pendingByGroup[group.id].push(fix);
    }
  }
}
const fullyFixedQualified = {};
for (const group of GROUPS) {
  if (pendingByGroup[group.id].length === 0) {
    fullyFixedQualified[group.label] = computeStandings(
      group.teams, group.fixtures, fixedResults[group.id]
    );
  }
}
const simBuf  = {};
const pendBuf = {};
for (const group of GROUPS) {
  simBuf[group.id]  = { ...fixedResults[group.id] };
  pendBuf[group.id] = {};
  for (const fix of pendingByGroup[group.id]) {
    const slot = { home:"0", away:"0" };
    simBuf[group.id][fix.id]  = slot;
    pendBuf[group.id][fix.id] = slot;
  }
}

// ─── Loop 100 iteraciones ─────────────────────────────────────────────────────
const N = 100;
const champCount = {};
// Almacenar paths por equipo para mostrar luego
const pathsByChamp = {};  // { code: [{ iter, path, groupPos }, ...] }

for (let iter = 1; iter <= N; iter++) {
  // Simular pendientes
  for (const group of GROUPS) {
    for (const fix of pendingByGroup[group.id]) {
      const venue = STADIUM_COUNTRY[fix.stadium] ?? "USA";
      const { home, away } = simulateMatch(fix.home, fix.away, venue, STRENGTH_ADJ);
      const slot = pendBuf[group.id][fix.id];
      slot.home = String(home);
      slot.away = String(away);
    }
  }

  // Clasificados
  const qualified = {};
  for (const group of GROUPS) {
    qualified[group.label] = (group.label in fullyFixedQualified)
      ? fullyFixedQualified[group.label]
      : computeStandings(group.teams, group.fixtures, simBuf[group.id]);
  }

  // Mejores terceros
  const bestThirds = computeBestThirds(GROUPS, simBuf);
  const top8     = bestThirds.slice(0, 8);
  const comboKey = top8.map(t => t.groupLabel).sort().join("");
  const combo    = BEST_THIRDS_COMBINATIONS[comboKey] || null;

  // R32
  const r32 = R32_SEEDS.map(s => {
    const hCode = resolveSeed(s.home, qualified);
    let aCode;
    if (s.thirdSlot !== null && combo) {
      const ts = combo[s.thirdSlot];
      aCode = ts ? resolveSeed(ts, qualified) : null;
    } else {
      aCode = resolveSeed(s.away, qualified);
    }
    return { h: hCode, a: aCode };
  });

  const r32Matches = r32.map(({ h, a }) => {
    if (!h && !a) return { h:null,a:null,winner:null,hGoals:0,aGoals:0,penalties:false };
    if (!h) return { h:null,a,winner:a,hGoals:0,aGoals:0,penalties:false };
    if (!a) return { h,a:null,winner:h,hGoals:0,aGoals:0,penalties:false };
    return { h, a, ...knockoutWithScore(h, a, STRENGTH_ADJ) };
  });
  const r32W = r32Matches.map(m => m.winner);

  const r16Matches = playRound(R16_PAIRS, r32W, STRENGTH_ADJ);
  const r16W       = r16Matches.map(m => m.winner);
  const qfMatches  = playRound(QF_PAIRS,  r16W, STRENGTH_ADJ);
  const qfW        = qfMatches.map(m => m.winner);
  const sfMatches  = playRound(SF_PAIRS,  qfW,  STRENGTH_ADJ);
  const sfW        = sfMatches.map(m => m.winner);

  const [f1, f2] = sfW;
  let finalMatch = { h:null, a:null, winner:null, hGoals:0, aGoals:0, penalties:false };
  if (f1 && f2) finalMatch = { h:f1, a:f2, ...knockoutWithScore(f1, f2, STRENGTH_ADJ) };

  const champion = finalMatch.winner || f1 || f2;
  if (!champion) continue;

  champCount[champion] = (champCount[champion] || 0) + 1;

  // Rastrear camino del campeón
  const rounds = [
    { round:"R32",    matches: r32Matches },
    { round:"Octavos",matches: r16Matches },
    { round:"Cuartos",matches: qfMatches  },
    { round:"Semis",  matches: sfMatches  },
    { round:"Final",  matches: [finalMatch] },
  ];
  const path = [];
  for (const { round, matches } of rounds) {
    const m = matches.find(x => x.winner === champion && x.h && x.a);
    if (m) path.push({ round, match: m });
  }

  // Posición en su grupo
  const champGroup = GROUPS.find(g => g.teams.includes(champion));
  const groupPos = champGroup
    ? `${qualified[champGroup.label].findIndex(r => r.team.code === champion) + 1}° Gr.${champGroup.label}`
    : "?";

  if (!pathsByChamp[champion]) pathsByChamp[champion] = [];
  pathsByChamp[champion].push({ iter, path, groupPos });
}

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(" AUDITORÍA MONTE CARLO — 100 iteraciones | State real al 26/06 21:00");
console.log(" Completos: A B C D E F I  |  MD3 pendiente: G H J K L");
console.log("═══════════════════════════════════════════════════════════════════════\n");

const sorted = Object.entries(champCount).sort((a, b) => b[1] - a[1]);
const total  = sorted.reduce((s, [,n]) => s + n, 0);

console.log("  EQUIPO  TÍTULOS  %      BARRA");
console.log("  ─────────────────────────────────────────────────────");
for (const [code, n] of sorted) {
  const pctStr  = `${((n / total) * 100).toFixed(0)}%`.padStart(4);
  const bar = "█".repeat(n);
  console.log(`  ${code.padEnd(6)} ${String(n).padStart(3)}     ${pctStr}   ${bar}`);
}

const uniqueChamps = sorted.length;
console.log(`\n  Total iteraciones: ${total} | Campeones distintos: ${uniqueChamps}`);

if (total !== N) {
  console.log(`  ⚠️  Solo ${total} de ${N} iteraciones produjeron un campeón válido — revisar BEST_THIRDS_COMBINATIONS.`);
}
if (uniqueChamps === 1) {
  console.log(`  ⚠️  El mismo equipo ganó las ${N} iteraciones — resultado sospechoso, revisar motor.`);
}

// ─── Caminos de Argentina ──────────────────────────────────────────────────────
console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
const argPaths = pathsByChamp["ARG"] || [];
if (argPaths.length === 0) {
  console.log(" ARG no ganó ninguna de las 100 iteraciones — sin caminos para mostrar.");
  console.log(" (Con pocos campeones distintos esto puede ocurrir; corré más iteraciones.)");
} else {
  console.log(` CAMINOS DEL CAMPEÓN — ARG (ganó ${argPaths.length}/100 iteraciones)`);
  console.log("═══════════════════════════════════════════════════════════════════════");
  const sample = argPaths.slice(0, 2);
  for (const { iter, path, groupPos } of sample) {
    printPath(iter, "ARG", path, groupPos);
  }
  if (argPaths.length < 2) {
    console.log("\n  (ARG ganó solo 1 vez — se muestra solo 1 camino)");
  }
}

// ─── Caminos del equipo más frecuente (si ≠ ARG) ─────────────────────────────
const topChamp = sorted[0][0];
if (topChamp !== "ARG") {
  const topN     = sorted[0][1];
  const topPaths = pathsByChamp[topChamp] || [];
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════════════");
  console.log(` CAMINOS DEL CAMPEÓN — ${topChamp} (ganó ${topN}/100 iteraciones — más frecuente)`);
  console.log("═══════════════════════════════════════════════════════════════════════");
  for (const { iter, path, groupPos } of topPaths.slice(0, 2)) {
    printPath(iter, topChamp, path, groupPos);
  }
} else if (sorted.length > 1) {
  // ARG es el más frecuente → mostrar el segundo
  const [code2, n2] = sorted[1];
  const paths2 = pathsByChamp[code2] || [];
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════════════");
  console.log(` CAMINOS DEL CAMPEÓN — ${code2} (ganó ${n2}/100 — segundo más frecuente)`);
  console.log("═══════════════════════════════════════════════════════════════════════");
  for (const { iter, path, groupPos } of paths2.slice(0, 2)) {
    printPath(iter, code2, path, groupPos);
  }
}

// ─── Nota interpretativa ─────────────────────────────────────────────────────
console.log(`
─────────────────────────────────────────────────────────────────────────────
NOTA INTERPRETATIVA
─────────────────────────────────────────────────────────────────────────────
El campeón de cada iteración sale del azar ponderado por fuerza (Poisson +
STRENGTH_ADJ calibrado con los resultados reales). El más fuerte gana con más
frecuencia pero no siempre — cada partido es independiente.

⚡ SORPRESA = el campeón ganó ese cruce teniendo <35% de probabilidad previa.
  Partidos reñidos (35–55%) y resultados esperados (>55%) no se marcan.

Las 100 iteraciones usan Math.random() sin seed fija → genuinamente distintas.
─────────────────────────────────────────────────────────────────────────────
`);
