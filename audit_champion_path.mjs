// audit_champion_path.mjs — Auditoría de caminos del campeón (Monte Carlo)
// Ejecutar: node audit_champion_path.mjs
//
// SIN modificar el motor. Solo importa funciones públicas y replica
// la lógica del bracket para capturar marcadores partido a partido.

import {
  simulateMatch,
  matchProbabilities,
  recalibrateStrengths,
  STRENGTH,
  STADIUM_COUNTRY,
} from "./js/predictor.js";

import { computeStandings, computeBestThirds } from "./js/standings.js";
import { BEST_THIRDS_COMBINATIONS }            from "./js/combinations.js";

import {
  GROUP_A_FIXTURES, GROUP_B_FIXTURES, GROUP_C_FIXTURES,
  GROUP_D_FIXTURES, GROUP_E_FIXTURES, GROUP_F_FIXTURES,
  GROUP_G_FIXTURES, GROUP_H_FIXTURES, GROUP_I_FIXTURES,
  GROUP_J_FIXTURES, GROUP_K_FIXTURES, GROUP_L_FIXTURES,
} from "./js/fixtures.js";

// ─── Definición de grupos (igual que app.js) ─────────────────────────────────
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

// ─── STATE REAL del usuario ───────────────────────────────────────────────────
// Grupos A, B, C: COMPLETOS (MD1 + MD2 + MD3 jugados)
// Grupos D–L:     MD1 + MD2 jugados; MD3 PENDIENTE (lo simula el motor)

const state = {
  // ── GRUPO A — completo ─────────────────────────────────────────────────────
  groupA: {
    1:  { home: "2", away: "0" }, // MEX 2-0 RSA   (MD1)
    2:  { home: "0", away: "3" }, // KOR 0-3 CZE   (MD1)
    25: { home: "2", away: "0" }, // CZE 2-0 RSA   (MD2)
    28: { home: "3", away: "1" }, // MEX 3-1 KOR   (MD2)
    53: { home: "0", away: "3" }, // CZE 0-3 MEX   (MD3) ← real
    54: { home: "1", away: "0" }, // RSA 1-0 KOR   (MD3) ← real
  },
  // ── GRUPO B — completo ─────────────────────────────────────────────────────
  groupB: {
    3:  { home: "1", away: "0" }, // CAN 1-0 BIH   (MD1)
    8:  { home: "0", away: "2" }, // QAT 0-2 SUI   (MD1)
    26: { home: "2", away: "1" }, // SUI 2-1 BIH   (MD2)
    27: { home: "2", away: "0" }, // CAN 2-0 QAT   (MD2)
    51: { home: "2", away: "1" }, // SUI 2-1 CAN   (MD3) ← real
    52: { home: "3", away: "1" }, // BIH 3-1 QAT   (MD3) ← real
  },
  // ── GRUPO C — completo ─────────────────────────────────────────────────────
  groupC: {
    7:  { home: "2", away: "1" }, // BRA 2-1 MAR   (MD1)
    5:  { home: "0", away: "1" }, // HAI 0-1 SCO   (MD1)
    29: { home: "3", away: "0" }, // BRA 3-0 HAI   (MD2)
    30: { home: "1", away: "2" }, // SCO 1-2 MAR   (MD2)
    49: { home: "0", away: "3" }, // SCO 0-3 BRA   (MD3) ← real
    50: { home: "4", away: "2" }, // MAR 4-2 HAI   (MD3) ← real
  },
  // ── GRUPO D — MD3 pendiente ────────────────────────────────────────────────
  groupD: {
    4:  { home: "3", away: "0" }, // USA 3-0 PAR   (MD1)
    6:  { home: "1", away: "2" }, // AUS 1-2 TUR   (MD1)
    31: { home: "1", away: "0" }, // TUR 1-0 PAR   (MD2)
    32: { home: "2", away: "0" }, // USA 2-0 AUS   (MD2)
    // Fix 59 TUR-USA, Fix 60 PAR-AUS → PENDIENTE
  },
  // ── GRUPO E — MD3 pendiente ────────────────────────────────────────────────
  groupE: {
    9:  { home: "4", away: "0" }, // GER 4-0 CUW   (MD1)
    10: { home: "1", away: "2" }, // CIV 1-2 ECU   (MD1)
    33: { home: "2", away: "1" }, // GER 2-1 CIV   (MD2)
    34: { home: "3", away: "1" }, // ECU 3-1 CUW   (MD2)
    // Fix 55 CUW-CIV, Fix 56 ECU-GER → PENDIENTE
  },
  // ── GRUPO F — MD3 pendiente ────────────────────────────────────────────────
  groupF: {
    11: { home: "2", away: "1" }, // NED 2-1 JPN   (MD1)
    12: { home: "1", away: "1" }, // SWE 1-1 TUN   (MD1)
    35: { home: "1", away: "0" }, // NED 1-0 SWE   (MD2)
    36: { home: "0", away: "2" }, // TUN 0-2 JPN   (MD2)
    // Fix 57 JPN-SWE, Fix 58 TUN-NED → PENDIENTE
  },
  // ── GRUPO G — MD3 pendiente ────────────────────────────────────────────────
  groupG: {
    16: { home: "2", away: "0" }, // BEL 2-0 EGY   (MD1)
    15: { home: "0", away: "2" }, // IRN 0-2 NZL   (MD1)
    39: { home: "3", away: "0" }, // BEL 3-0 IRN   (MD2)
    40: { home: "1", away: "1" }, // NZL 1-1 EGY   (MD2)
    // Fix 64 NZL-BEL, Fix 63 EGY-IRN → PENDIENTE
  },
  // ── GRUPO H — MD3 pendiente ────────────────────────────────────────────────
  groupH: {
    14: { home: "3", away: "0" }, // ESP 3-0 CPV   (MD1)
    13: { home: "0", away: "2" }, // KSA 0-2 URU   (MD1)
    38: { home: "2", away: "0" }, // ESP 2-0 KSA   (MD2)
    37: { home: "3", away: "0" }, // URU 3-0 CPV   (MD2)
    // Fix 66 URU-ESP, Fix 65 CPV-KSA → PENDIENTE
  },
  // ── GRUPO I — MD3 pendiente ────────────────────────────────────────────────
  groupI: {
    17: { home: "2", away: "0" }, // FRA 2-0 SEN   (MD1)
    18: { home: "0", away: "2" }, // IRQ 0-2 NOR   (MD1)
    42: { home: "3", away: "0" }, // FRA 3-0 IRQ   (MD2)
    41: { home: "2", away: "0" }, // NOR 2-0 SEN   (MD2)
    // Fix 61 NOR-FRA, Fix 62 SEN-IRQ → PENDIENTE
  },
  // ── GRUPO J — MD3 pendiente ────────────────────────────────────────────────
  groupJ: {
    19: { home: "2", away: "0" }, // ARG 2-0 ALG   (MD1)
    20: { home: "2", away: "0" }, // AUT 2-0 JOR   (MD1)
    43: { home: "2", away: "1" }, // ARG 2-1 AUT   (MD2)
    44: { home: "1", away: "2" }, // JOR 1-2 ALG   (MD2)
    // Fix 70 JOR-ARG, Fix 69 ALG-AUT → PENDIENTE
  },
  // ── GRUPO K — MD3 pendiente ────────────────────────────────────────────────
  groupK: {
    23: { home: "2", away: "0" }, // POR 2-0 COD   (MD1)
    24: { home: "0", away: "2" }, // UZB 0-2 COL   (MD1)
    47: { home: "3", away: "0" }, // POR 3-0 UZB   (MD2)
    48: { home: "2", away: "1" }, // COL 2-1 COD   (MD2)
    // Fix 71 COL-POR, Fix 72 COD-UZB → PENDIENTE
  },
  // ── GRUPO L — MD3 pendiente ────────────────────────────────────────────────
  groupL: {
    22: { home: "2", away: "0" }, // ENG 2-0 CRO   (MD1)
    21: { home: "2", away: "0" }, // GHA 2-0 PAN   (MD1)
    45: { home: "1", away: "1" }, // ENG 1-1 GHA   (MD2)
    46: { home: "0", away: "2" }, // PAN 0-2 CRO   (MD2)
    // Fix 67 PAN-ENG, Fix 68 CRO-GHA → PENDIENTE
  },
};

// ─── Estructura del cuadro R32 (idéntica a predictor.js) ─────────────────────
const R32_SEEDS = [
  { home: "1E", away: null, thirdSlot: "1E" },  // r32_1
  { home: "1I", away: null, thirdSlot: "1I" },  // r32_2
  { home: "2A", away: "2B", thirdSlot: null  },  // r32_3
  { home: "1F", away: "2C", thirdSlot: null  },  // r32_4
  { home: "2K", away: "2L", thirdSlot: null  },  // r32_5
  { home: "1H", away: "2J", thirdSlot: null  },  // r32_6
  { home: "1D", away: null, thirdSlot: "1D"  },  // r32_7
  { home: "1G", away: null, thirdSlot: "1G"  },  // r32_8
  { home: "1C", away: "2F", thirdSlot: null  },  // r32_9
  { home: "2E", away: "2I", thirdSlot: null  },  // r32_10
  { home: "1A", away: null, thirdSlot: "1A"  },  // r32_11
  { home: "1L", away: null, thirdSlot: "1L"  },  // r32_12
  { home: "1J", away: "2H", thirdSlot: null  },  // r32_13
  { home: "2D", away: "2G", thirdSlot: null  },  // r32_14
  { home: "1B", away: null, thirdSlot: "1B"  },  // r32_15
  { home: "1K", away: null, thirdSlot: "1K"  },  // r32_16
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

// Versión local de knockoutWinner que devuelve también el marcador y si hubo penales.
// Replica exactamente la lógica del motor sin modificarlo.
function knockoutWithScore(h, a, st) {
  const { home: hG, away: aG } = simulateMatch(h, a, null, st);
  if (hG !== aG) {
    return { winner: hG > aG ? h : a, hGoals: hG, aGoals: aG, penalties: false };
  }
  // Empate → penales ponderados por fuerza (misma lógica que predictor.js)
  const sH = st[h] ?? 65, sA = st[a] ?? 65;
  const winnerPK = Math.random() < sH / (sH + sA) ? h : a;
  return { winner: winnerPK, hGoals: hG, aGoals: aG, penalties: true, penWinner: winnerPK };
}

// Formatea un partido del camino del campeón
function formatMatch(round, champ, h, a, hG, aG, penalties, st) {
  const { p1, px, p2 } = matchProbabilities(h, a, st);
  // P del campeón en ese cruce (como "home" o "away")
  const pChamp = champ === h ? p1 : p2;
  const pDraw  = px;
  const pRival = champ === h ? p2 : p1;
  const rival  = champ === h ? a : h;
  // Marcador desde la perspectiva del campeón
  const [cG, rG] = champ === h ? [hG, aG] : [aG, hG];
  const penTag = penalties ? " (pen)" : "";
  const surprise = pChamp < 0.35 ? " ⚡ SORPRESA" : "";
  return (
    `  ${round.padEnd(8)}: ${champ} ${cG}-${rG} ${rival}${penTag}` +
    `   (1X2 previo: ${champ} ${pct(pChamp)} / empate ${pct(pDraw)} / ${rival} ${pct(pRival)})${surprise}`
  );
}

function pct(p) { return `${(p * 100).toFixed(0)}%`; }

// ─── Pre-procesamiento (igual que runMonteCarlo) ──────────────────────────────
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
        !isNaN(parseInt(r.home, 10)) && !isNaN(parseInt(r.away, 10))) {
      fixedResults[group.id][fix.id] = r;
    } else {
      pendingByGroup[group.id].push(fix);
    }
  }
}

// Grupos totalmente fijos (A, B, C)
const fullyFixedQualified = {};
for (const group of GROUPS) {
  if (pendingByGroup[group.id].length === 0) {
    fullyFixedQualified[group.label] = computeStandings(
      group.teams, group.fixtures, fixedResults[group.id]
    );
  }
}

// Buffer reutilizable para fixtures pendientes
const simBuf  = {};
const pendBuf = {};
for (const group of GROUPS) {
  simBuf[group.id]  = { ...fixedResults[group.id] };
  pendBuf[group.id] = {};
  for (const fix of pendingByGroup[group.id]) {
    const slot = { home: "0", away: "0" };
    simBuf[group.id][fix.id]  = slot;
    pendBuf[group.id][fix.id] = slot;
  }
}

// ─── 10 Iteraciones de auditoría ─────────────────────────────────────────────
const N = 10;
const champCount = {};

console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════════");
console.log(" AUDITORÍA MONTE CARLO — CAMINO DEL CAMPEÓN (10 iteraciones)");
console.log(" Estado real: Grupos A/B/C completos · Grupos D–L con MD3 pendiente");
console.log(" Fuerzas ajustadas (STRENGTH_ADJ) calculadas UNA VEZ antes del loop");
console.log("═══════════════════════════════════════════════════════════════════════════\n");

for (let iter = 1; iter <= N; iter++) {

  // 1. Simular fixtures pendientes (D–L, MD3) con fuerzas ajustadas
  for (const group of GROUPS) {
    for (const fix of pendingByGroup[group.id]) {
      const venue = STADIUM_COUNTRY[fix.stadium] ?? "USA";
      const { home, away } = simulateMatch(fix.home, fix.away, venue, STRENGTH_ADJ);
      const slot = pendBuf[group.id][fix.id];
      slot.home = String(home);
      slot.away = String(away);
    }
  }

  // 2. Calcular clasificados
  const qualified = {};
  for (const group of GROUPS) {
    if (group.label in fullyFixedQualified) {
      qualified[group.label] = fullyFixedQualified[group.label];
    } else {
      qualified[group.label] = computeStandings(
        group.teams, group.fixtures, simBuf[group.id]
      );
    }
  }

  // 3. Mejores terceros
  const bestThirds = computeBestThirds(GROUPS, simBuf);
  const top8     = bestThirds.slice(0, 8);
  const comboKey = top8.map(t => t.groupLabel).sort().join("");
  const combo    = BEST_THIRDS_COMBINATIONS[comboKey] || null;

  // 4. Resolver los 32 equipos del R32
  const r32 = R32_SEEDS.map((s) => {
    const hCode = resolveSeed(s.home, qualified);
    let aCode;
    if (s.thirdSlot !== null && combo) {
      const thirdSeed = combo[s.thirdSlot];
      aCode = thirdSeed ? resolveSeed(thirdSeed, qualified) : null;
    } else {
      aCode = resolveSeed(s.away, qualified);
    }
    return { h: hCode, a: aCode };
  });

  // 5. Simular rondas capturando marcadores
  function playRound(pairs, prevWinners) {
    return pairs.map(([i, j]) => {
      const h = prevWinners[i], a = prevWinners[j];
      if (!h && !a) return { h: null, a: null, winner: null, hGoals: 0, aGoals: 0, penalties: false };
      if (!h) return { h: null, a, winner: a, hGoals: 0, aGoals: 0, penalties: false };
      if (!a) return { h, a: null, winner: h, hGoals: 0, aGoals: 0, penalties: false };
      const res = knockoutWithScore(h, a, STRENGTH_ADJ);
      return { h, a, ...res };
    });
  }

  // R32 → 16 ganadores
  const r32Matches = r32.map(({ h, a }) => {
    if (!h && !a) return { h: null, a: null, winner: null, hGoals: 0, aGoals: 0, penalties: false };
    if (!h) return { h: null, a, winner: a, hGoals: 0, aGoals: 0, penalties: false };
    if (!a) return { h, a: null, winner: h, hGoals: 0, aGoals: 0, penalties: false };
    const res = knockoutWithScore(h, a, STRENGTH_ADJ);
    return { h, a, ...res };
  });
  const r32Winners = r32Matches.map(m => m.winner);

  // R16
  const r16Matches = playRound(R16_PAIRS, r32Winners);
  const r16Winners = r16Matches.map(m => m.winner);

  // QF
  const qfMatches = playRound(QF_PAIRS, r16Winners);
  const qfWinners = qfMatches.map(m => m.winner);

  // SF
  const sfMatches = playRound(SF_PAIRS, qfWinners);
  const sfWinners = sfMatches.map(m => m.winner);

  // Final
  const [f1, f2] = sfWinners;
  let finalMatch = { h: null, a: null, winner: null, hGoals: 0, aGoals: 0, penalties: false };
  if (f1 && f2) {
    const res = knockoutWithScore(f1, f2, STRENGTH_ADJ);
    finalMatch = { h: f1, a: f2, ...res };
  }

  const champion = finalMatch.winner || f1 || f2;
  if (!champion) continue;

  champCount[champion] = (champCount[champion] || 0) + 1;

  // 6. Rastrear el camino del campeón
  const path = [];

  // R32: encontrar el partido donde participó el campeón
  const r32m = r32Matches.find(m => m.winner === champion && (m.h === champion || m.a === champion));
  if (r32m && r32m.h && r32m.a) path.push({ round: "R32", match: r32m });

  // R16
  const r16m = r16Matches.find(m => m.winner === champion && m.h && m.a);
  if (r16m) path.push({ round: "Octavos", match: r16m });

  // QF
  const qfm = qfMatches.find(m => m.winner === champion && m.h && m.a);
  if (qfm) path.push({ round: "Cuartos", match: qfm });

  // SF
  const sfm = sfMatches.find(m => m.winner === champion && m.h && m.a);
  if (sfm) path.push({ round: "Semis", match: sfm });

  // Final
  if (finalMatch.h && finalMatch.a) path.push({ round: "Final", match: finalMatch });

  // 7. Mostrar iteración
  console.log(`═══ ITERACIÓN ${iter} — CAMPEÓN: ${champion} ${"═".repeat(Math.max(0, 47 - champion.length))}`);

  // Tabla de clasificados de los grupos que afectan al campeón (info de contexto)
  const champGroup = GROUPS.find(g => g.teams.includes(champion));
  if (champGroup) {
    const st = qualified[champGroup.label];
    const pos = st.findIndex(r => r.team.code === champion) + 1;
    console.log(`  Salió ${pos}° del Grupo ${champGroup.label}: ${st.map(r => r.team.code).join(" / ")}`);
  }

  for (const { round, match } of path) {
    const { h, a, hGoals, aGoals, penalties, winner } = match;
    console.log(formatMatch(round, champion, h, a, hGoals, aGoals, penalties, STRENGTH_ADJ));
  }
  console.log();
}

// ─── Resumen final ────────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════════════════════");
console.log(" RESUMEN — Campeones en las 10 iteraciones");
console.log("═══════════════════════════════════════════════════════════════════════════");

const sorted = Object.entries(champCount).sort((a, b) => b[1] - a[1]);
sorted.forEach(([code, n]) => {
  const bar = "█".repeat(n * 2);
  console.log(`  ${code.padEnd(4)}: ${String(n).padStart(2)} victoria(s)  ${bar}`);
});

const uniqueChampions = sorted.length;
if (uniqueChampions === 1) {
  console.log("\n  ⚠️  ATENCIÓN: el mismo equipo ganó las 10 iteraciones.");
  console.log("  Con solo 10 muestras esto puede ocurrir si el favorito es dominante,");
  console.log("  pero sería inusual. Corré más iteraciones si querés confirmar.");
} else {
  console.log(`\n  ${uniqueChampions} equipos distintos ganaron en las 10 iteraciones — variedad esperada ✓`);
}

console.log(`
─────────────────────────────────────────────────────────────────────────────
NOTA INTERPRETATIVA
─────────────────────────────────────────────────────────────────────────────
El campeón de cada iteración NO se elige por ningún criterio determinista.
El motor usa distribuciones de Poisson ponderadas por fuerza ajustada
(STRENGTH_ADJ): el equipo más fuerte gana más partidos en promedio, pero
cada marcador individual sale del azar (Poisson). En caso de empate al 90',
los penales se resuelven por probabilidad proporcional a la fuerza relativa.

Para interpretar cada cruce:
  • Si el campeón tenía >55% de probabilidad → resultado esperable.
  • Si tenía 35–55%                           → partido reñido.
  • Si tenía <35% (marcado con ⚡ SORPRESA)   → el campeón venció al favorito
    en esa iteración; posible pero estadísticamente infrecuente.

Las 10 iteraciones usan Math.random() sin seed fija, por lo que son
genuinamente independientes entre sí. El resumen refleja la distribución
empírica de esas 10 muestras, no la probabilidad asintótica del Monte Carlo
(que requeriría miles de iteraciones).
─────────────────────────────────────────────────────────────────────────────
`);
