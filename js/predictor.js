// js/predictor.js
// Motor probabilístico Poisson + Monte Carlo para el Simulador Mundial FIFA 2026.
// Lógica pura: sin referencias a document/window — testeable con Node.js.

import { computeStandings, computeBestThirds } from "./standings.js";
import { BEST_THIRDS_COMBINATIONS } from "./combinations.js";

// ─── Fuerza por equipo (0–100) ────────────────────────────────────────────────
// Top FIFA calibrado con ranking junio 2026; medios/débiles estimados.
export const STRENGTH = {
  ARG: 95, FRA: 94, ESP: 93, ENG: 90, BRA: 89, POR: 87, NED: 86,
  GER: 85, BEL: 84, MAR: 82, URU: 81, COL: 80, CRO: 80, NOR: 79,
  SEN: 78, JPN: 77, SUI: 76, AUT: 75, USA: 74, ECU: 74, TUR: 74,
  ALG: 73, SWE: 73, MEX: 73, CIV: 72, IRN: 72, KOR: 71, EGY: 71,
  CZE: 70, CAN: 70, PAR: 69, AUS: 69, TUN: 68, SCO: 68, GHA: 68,
  RSA: 67, BIH: 67, QAT: 66, COD: 66, KSA: 64, UZB: 63, IRQ: 62,
  NZL: 62, JOR: 60, CPV: 58, PAN: 57, HAI: 56, CUW: 55,
};

// Sedes anfitrionas (reciben bono de localía cuando son el equipo local)
const HOSTS = new Set(["MEX", "USA", "CAN"]);

// ─── Distribución de Poisson ──────────────────────────────────────────────────
// Método de Knuth: O(λ) iteraciones promedio, óptimo para λ < 3.
function poissonSample(lambda) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

// ─── Simulación de partido de grupos ─────────────────────────────────────────
export function simulateMatch(homeCode, awayCode) {
  const sH = STRENGTH[homeCode] ?? 65;
  const sA = STRENGTH[awayCode] ?? 65;
  const BASE  = 1.2;
  const ALPHA = 0.5;
  const hostBonus = HOSTS.has(homeCode) ? 1.1 : 1.0;
  const ratio = sH / sA;
  return {
    home: poissonSample(BASE * Math.pow(ratio, ALPHA) * hostBonus),
    away: poissonSample(BASE * Math.pow(1 / ratio, ALPHA)),
  };
}

// Partido eliminatorio: empate → penales ponderados por fuerza relativa.
function knockoutWinner(h, a) {
  const { home, away } = simulateMatch(h, a);
  if (home !== away) return home > away ? h : a;
  const sH = STRENGTH[h] ?? 65, sA = STRENGTH[a] ?? 65;
  return Math.random() < sH / (sH + sA) ? h : a;
}

// ─── Estructura del cuadro (R32 → Final) ─────────────────────────────────────
// Compacta: sólo los seeds necesarios para la simulación.
// thirdSlot: clave para buscar en BEST_THIRDS_COMBINATIONS (null si no hay tercero).
const R32_SEEDS = [
  { home: "1E", away: null,  thirdSlot: "1E" }, // r32_1
  { home: "1I", away: null,  thirdSlot: "1I" }, // r32_2
  { home: "2A", away: "2B",  thirdSlot: null  }, // r32_3
  { home: "1F", away: "2C",  thirdSlot: null  }, // r32_4
  { home: "2K", away: "2L",  thirdSlot: null  }, // r32_5
  { home: "1H", away: "2J",  thirdSlot: null  }, // r32_6
  { home: "1D", away: null,  thirdSlot: "1D"  }, // r32_7
  { home: "1G", away: null,  thirdSlot: "1G"  }, // r32_8
  { home: "1C", away: "2F",  thirdSlot: null  }, // r32_9
  { home: "2E", away: "2I",  thirdSlot: null  }, // r32_10
  { home: "1A", away: null,  thirdSlot: "1A"  }, // r32_11
  { home: "1L", away: null,  thirdSlot: "1L"  }, // r32_12
  { home: "1J", away: "2H",  thirdSlot: null  }, // r32_13
  { home: "2D", away: "2G",  thirdSlot: null  }, // r32_14
  { home: "1B", away: null,  thirdSlot: "1B"  }, // r32_15
  { home: "1K", away: null,  thirdSlot: "1K"  }, // r32_16
];

// Índices en el array de ganadores de la ronda anterior.
const R16_PAIRS = [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13],[14,15]];
const QF_PAIRS  = [[0,1],[2,3],[4,5],[6,7]];
const SF_PAIRS  = [[0,1],[2,3]];

// ─── Resolver seed a código de equipo ─────────────────────────────────────────
function resolveSeed(seed, qualified) {
  const m = seed.match(/^(\d)([A-L])$/);
  if (!m) return null;
  const pos  = parseInt(m[1], 10) - 1;
  const rows = qualified[m[2]];
  if (!rows || rows.length <= pos) return null;
  return rows[pos].team.code;
}

// ─── Simulación de un bracket completo ────────────────────────────────────────
// Acumula contadores por equipo. Devuelve el código del campeón.
function simulateBracket(qualified, bestThirds, counts) {
  // Determinar combinación de terceros
  const top8     = bestThirds.slice(0, 8);
  const comboKey = top8.map(t => t.groupLabel).sort().join("");
  const combo    = BEST_THIRDS_COMBINATIONS[comboKey] || null;

  // Resolver los 32 equipos del R32 y acumular "avanza grupo"
  const r32 = R32_SEEDS.map(s => {
    const hCode = resolveSeed(s.home, qualified);
    let aCode;
    if (s.thirdSlot !== null && combo) {
      const thirdSeed = combo[s.thirdSlot];
      aCode = thirdSeed ? resolveSeed(thirdSeed, qualified) : null;
    } else {
      aCode = resolveSeed(s.away, qualified);
    }
    if (hCode) counts[hCode].group++;
    if (aCode) counts[aCode].group++;
    return { h: hCode, a: aCode };
  });

  // R32 → 16 ganadores
  const r32Out = r32.map(({ h, a }) => {
    if (!h && !a) return null;
    if (!h) return a;
    if (!a) return h;
    return knockoutWinner(h, a);
  });

  // R16 → 8 ganadores (= equipos en cuartos)
  const r16Out = R16_PAIRS.map(([i, j]) => {
    const h = r32Out[i], a = r32Out[j];
    if (!h && !a) return null;
    if (!h) return a;
    if (!a) return h;
    return knockoutWinner(h, a);
  });
  for (const code of r16Out) if (code) counts[code].qf++;

  // QF → 4 ganadores (= equipos en semis)
  const qfOut = QF_PAIRS.map(([i, j]) => {
    const h = r16Out[i], a = r16Out[j];
    if (!h && !a) return null;
    if (!h) return a;
    if (!a) return h;
    return knockoutWinner(h, a);
  });
  for (const code of qfOut) if (code) counts[code].sf++;

  // SF → 2 finalistas
  const sfOut = SF_PAIRS.map(([i, j]) => {
    const h = qfOut[i], a = qfOut[j];
    if (!h && !a) return null;
    if (!h) return a;
    if (!a) return h;
    return knockoutWinner(h, a);
  });
  for (const code of sfOut) if (code) counts[code].final++;

  // Final
  const [f1, f2] = sfOut;
  if (f1 && f2) {
    const champion = knockoutWinner(f1, f2);
    counts[champion].champion++;
    return champion;
  }
  return f1 || f2 || null;
}

// ─── Caché singleton ──────────────────────────────────────────────────────────
export const predCache = {
  result: null,  // objeto de probabilidades { code: { group, qf, sf, final, champion } }
  stale:  true,  // true si los resultados están desactualizados
};

export function markCacheStale() {
  predCache.stale = true;
}

// ─── Motor principal Monte Carlo ──────────────────────────────────────────────
export function runMonteCarlo(GROUPS, state, iterations = 2000) {
  // ── Pre-procesar fixtures ────────────────────────────────────────────────
  const fixedResults   = {};  // groupId → { fixtureId → {home, away} }
  const pendingByGroup = {};  // groupId → [fixture objects]

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

  // ── Pre-calcular grupos totalmente fijos ──────────────────────────────────
  const fullyFixedQualified = {};
  for (const group of GROUPS) {
    if (pendingByGroup[group.id].length === 0) {
      fullyFixedQualified[group.label] = computeStandings(
        group.teams, group.fixtures, fixedResults[group.id]
      );
    }
  }

  // ── Buffer reutilizable para resultados simulados ─────────────────────────
  // Los objetos {home, away} de fixtures pendientes se mutan in-place.
  const simBuf = {};
  const pendBuf = {};  // mutable result objects for pending fixtures
  for (const group of GROUPS) {
    simBuf[group.id]  = { ...fixedResults[group.id] };
    pendBuf[group.id] = {};
    for (const fix of pendingByGroup[group.id]) {
      const slot = { home: "0", away: "0" };
      simBuf[group.id][fix.id]  = slot;
      pendBuf[group.id][fix.id] = slot;
    }
  }

  // ── Contadores ────────────────────────────────────────────────────────────
  const counts = {};
  for (const group of GROUPS) {
    for (const code of group.teams) {
      counts[code] = { group: 0, qf: 0, sf: 0, final: 0, champion: 0 };
    }
  }

  // ── Bucle Monte Carlo ─────────────────────────────────────────────────────
  for (let i = 0; i < iterations; i++) {
    // 1. Simular fixtures pendientes (mutar buffers in-place)
    for (const group of GROUPS) {
      for (const fix of pendingByGroup[group.id]) {
        const { home, away } = simulateMatch(fix.home, fix.away);
        const slot    = pendBuf[group.id][fix.id];
        slot.home = String(home);
        slot.away = String(away);
      }
    }

    // 2. Calcular clasificados de grupo
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

    // 3. Calcular mejores terceros y simular bracket
    const bestThirds = computeBestThirds(GROUPS, simBuf);
    simulateBracket(qualified, bestThirds, counts);
  }

  // ── Convertir contadores a probabilidades ─────────────────────────────────
  const probs = {};
  for (const [code, c] of Object.entries(counts)) {
    probs[code] = {
      group:    c.group    / iterations,
      qf:       c.qf       / iterations,
      sf:       c.sf       / iterations,
      final:    c.final    / iterations,
      champion: c.champion / iterations,
    };
  }

  // Validación: suma de % campeón debe ser ~1.0
  const champSum = Object.values(probs).reduce((s, p) => s + p.champion, 0);
  console.log(`[predictor] champion prob sum: ${champSum.toFixed(4)} (target ~1.0)`);

  // Actualizar caché
  predCache.result = probs;
  predCache.stale  = false;

  return probs;
}
