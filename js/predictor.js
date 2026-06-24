// js/predictor.js
// Motor probabilístico Poisson + Monte Carlo para el Simulador Mundial FIFA 2026.
// Lógica pura: sin referencias a document/window — testeable con Node.js.

import { computeStandings, computeBestThirds } from "./standings.js";
import { BEST_THIRDS_COMBINATIONS } from "./combinations.js";

// ─── Fuerza BASE por equipo (0–100) ──────────────────────────────────────────
// Top FIFA calibrado con ranking junio 2026; medios/débiles estimados.
// NO mutar: es el ancla para recalibrateStrengths (el ajuste bayesiano).
export const STRENGTH = {
  ARG: 95, FRA: 94, ESP: 93, ENG: 90, BRA: 89, POR: 87, NED: 86,
  GER: 85, BEL: 84, MAR: 82, URU: 81, COL: 80, CRO: 80, NOR: 79,
  SEN: 78, JPN: 77, SUI: 76, AUT: 75, USA: 74, ECU: 74, TUR: 74,
  ALG: 73, SWE: 73, MEX: 73, CIV: 72, IRN: 72, KOR: 71, EGY: 71,
  CZE: 70, CAN: 70, PAR: 69, AUS: 69, TUN: 68, SCO: 68, GHA: 68,
  RSA: 67, BIH: 67, QAT: 66, COD: 66, KSA: 64, UZB: 63, IRQ: 62,
  NZL: 62, JOR: 60, CPV: 58, PAN: 57, HAI: 56, CUW: 55,
};

// ─── Parámetros del ajuste bayesiano (fáciles de tunear) ─────────────────────
//
// LEARNING_RATE: puntos de fuerza por gol de "sorpresa" antes del blend.
//   Sube → ajuste más agresivo. Con 2.0, rango típico ≈ ±2–8 pts con 2 partidos.
// BLEND: peso de la fuerza ajustada en la mezcla final con la base.
//   0.0 = ignorar resultados (solo base), 1.0 = solo resultados.
//   0.55 → moderado: los resultados importan pero el ranking previo pesa ~45%.
export const LEARNING_RATE     = 2.0;
export const BLEND             = 0.55;
const        STRENGTH_CLAMP_MIN = 40;
const        STRENGTH_CLAMP_MAX = 99;

// ─── Equipos anfitriones ──────────────────────────────────────────────────────
// Reciben bono +10% cuando juegan en su propio país.
const HOSTS = new Set(["MEX", "USA", "CAN"]);

// País sede de cada estadio del grupo.
// Sedes mexicanas → "MEX" | canadienses → "CAN" | el resto → "USA".
// Cubren las 16 sedes de la fase de grupos del fixture.
export const STADIUM_COUNTRY = {
  "Estadio Azteca, Ciudad de México":    "MEX",
  "Estadio Akron, Guadalajara":          "MEX",
  "Estadio BBVA, Monterrey":             "MEX",
  "BMO Field, Toronto":                  "CAN",
  "Estadio BC Place, Vancouver":         "CAN",
  "MetLife Stadium, Nueva Jersey":       "USA",
  "Gillette Stadium, Boston":            "USA",
  "Lincoln Financial Field, Filadelfia": "USA",
  "Hard Rock Stadium, Miami":            "USA",
  "Mercedes-Benz Stadium, Atlanta":      "USA",
  "SoFi Stadium, Los Ángeles":           "USA",
  "Levi's Stadium, San Francisco":       "USA",
  "NRG Stadium, Houston":                "USA",
  "Arrowhead Stadium, Kansas City":      "USA",
  "AT&T Stadium, Dallas":                "USA",
  "Lumen Field, Seattle":                "USA",
};

// ─── Ajuste bayesiano de fuerzas ─────────────────────────────────────────────
/**
 * Recalibra las fuerzas de los equipos según los partidos YA jugados en state.
 * Cada partido contribuye con una "sorpresa" (goles reales − esperados) que
 * ajusta iterativamente las fuerzas; al final se mezclan con la base (BLEND)
 * para que el ranking previo siga pesando.
 *
 * Llamar UNA VEZ antes del loop Monte Carlo — los partidos jugados no cambian
 * entre iteraciones, así que recalcular dentro del loop sería incorrecto y caro.
 *
 * @param {Object[]} GROUPS        - Array de grupos { id, teams, fixtures }
 * @param {Object}   state         - { groupId: { fixtureId: { home, away } } }
 * @param {Object}   STRENGTH_BASE - Fuerzas base; NO se mutan (son el ancla)
 * @returns {Object} STRENGTH_ADJ  - Fuerzas ajustadas por código de equipo
 */
export function recalibrateStrengths(GROUPS, state, STRENGTH_BASE) {
  // Copia mutable: se actualiza iterativamente partido a partido.
  // Usar fuerzas "actuales" (no la base) para calcular los goles esperados de
  // cada partido → las actualizaciones de partidos anteriores influyen en los siguientes.
  const adj = { ...STRENGTH_BASE };

  const BASE = 1.2, ALPHA = 0.6;

  for (const group of GROUPS) {
    const gs = state[group.id] || {};
    for (const fix of group.fixtures) {
      const r = gs[fix.id];
      if (!r || r.home === "" || r.away === "") continue;
      const actualH = parseInt(r.home, 10);
      const actualA = parseInt(r.away, 10);
      if (isNaN(actualH) || isNaN(actualA)) continue;

      // Goles esperados con las fuerzas ACTUALES del momento del partido
      const sH = adj[fix.home] ?? 65;
      const sA = adj[fix.away] ?? 65;
      const venue    = STADIUM_COUNTRY[fix.stadium] ?? "USA";
      const homeMult = (HOSTS.has(fix.home) && venue === fix.home) ? 1.1 : 1.0;
      const awayMult = (HOSTS.has(fix.away) && venue === fix.away) ? 1.1 : 1.0;
      const ratio    = sH / sA;
      const lambdaH  = BASE * Math.pow(ratio,     ALPHA) * homeMult;
      const lambdaA  = BASE * Math.pow(1 / ratio, ALPHA) * awayMult;

      // Sorpresa simétrica: positiva → rindió mejor de lo esperado en goles
      const surpriseH = actualH - lambdaH;
      const surpriseA = actualA - lambdaA;

      // Peso por contundencia: un 4-0 mueve más que un 1-0
      const margin = Math.abs(actualH - actualA);
      const weight = 1 + margin * 0.2;

      adj[fix.home] += LEARNING_RATE * surpriseH * weight;
      adj[fix.away] += LEARNING_RATE * surpriseA * weight;
    }
  }

  // Anclaje: mezclar con la base y recortar al rango permitido
  const STRENGTH_ADJ = {};
  for (const code of Object.keys(STRENGTH_BASE)) {
    const blended = BLEND * adj[code] + (1 - BLEND) * STRENGTH_BASE[code];
    STRENGTH_ADJ[code] = Math.min(STRENGTH_CLAMP_MAX,
                          Math.max(STRENGTH_CLAMP_MIN, blended));
  }
  return STRENGTH_ADJ;
}

// ─── Distribución de Poisson ──────────────────────────────────────────────────
// Método de Knuth: O(λ) iteraciones promedio, óptimo para λ < 3.
function poissonSample(lambda) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

// ─── Simulación de partido ────────────────────────────────────────────────────
// venueCountry: país de la sede ("MEX"/"USA"/"CAN") para fase de grupos.
//   - Si se provee: el bono +10% se aplica a CUALQUIER anfitrión (home o away)
//     que esté jugando EN SU PROPIO PAÍS (venueCountry === teamCode).
//   - Si es null (fase K.O., sede desconocida): comportamiento anterior —
//     solo el equipo listado como home recibe el bono si es anfitrión.
// strengthTable: tabla de fuerzas a usar (default = STRENGTH base).
//   El Monte Carlo pasa STRENGTH_ADJ (fuerzas ajustadas) para simular pendientes.
export function simulateMatch(homeCode, awayCode, venueCountry = null, strengthTable = STRENGTH) {
  const sH = strengthTable[homeCode] ?? 65;
  const sA = strengthTable[awayCode] ?? 65;
  const BASE  = 1.2;
  const ALPHA = 0.6;
  const ratio = sH / sA;
  let homeMult, awayMult;
  if (venueCountry !== null) {
    homeMult = (HOSTS.has(homeCode) && venueCountry === homeCode) ? 1.1 : 1.0;
    awayMult = (HOSTS.has(awayCode) && venueCountry === awayCode) ? 1.1 : 1.0;
  } else {
    homeMult = HOSTS.has(homeCode) ? 1.1 : 1.0;
    awayMult = 1.0;
  }
  return {
    home: poissonSample(BASE * Math.pow(ratio, ALPHA) * homeMult),
    away: poissonSample(BASE * Math.pow(1 / ratio, ALPHA) * awayMult),
  };
}

// Partido eliminatorio: empate → penales ponderados por fuerza relativa.
function knockoutWinner(h, a, strengthTable = STRENGTH) {
  const { home, away } = simulateMatch(h, a, null, strengthTable);
  if (home !== away) return home > away ? h : a;
  const sH = strengthTable[h] ?? 65, sA = strengthTable[a] ?? 65;
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
function simulateBracket(qualified, bestThirds, counts, strengthTable = STRENGTH) {
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
    return knockoutWinner(h, a, strengthTable);
  });

  // R16 → 8 ganadores (= equipos en cuartos)
  const r16Out = R16_PAIRS.map(([i, j]) => {
    const h = r32Out[i], a = r32Out[j];
    if (!h && !a) return null;
    if (!h) return a;
    if (!a) return h;
    return knockoutWinner(h, a, strengthTable);
  });
  for (const code of r16Out) if (code) counts[code].qf++;

  // QF → 4 ganadores (= equipos en semis)
  const qfOut = QF_PAIRS.map(([i, j]) => {
    const h = r16Out[i], a = r16Out[j];
    if (!h && !a) return null;
    if (!h) return a;
    if (!a) return h;
    return knockoutWinner(h, a, strengthTable);
  });
  for (const code of qfOut) if (code) counts[code].sf++;

  // SF → 2 finalistas
  const sfOut = SF_PAIRS.map(([i, j]) => {
    const h = qfOut[i], a = qfOut[j];
    if (!h && !a) return null;
    if (!h) return a;
    if (!a) return h;
    return knockoutWinner(h, a, strengthTable);
  });
  for (const code of sfOut) if (code) counts[code].final++;

  // Final
  const [f1, f2] = sfOut;
  if (f1 && f2) {
    const champion = knockoutWinner(f1, f2, strengthTable);
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
  // ── Ajuste bayesiano de fuerzas (UNA vez, fuera del loop) ────────────────
  // Depende solo de los partidos jugados (que no cambian entre iteraciones).
  // Los pendientes se simulan con estas fuerzas ya recalibradas.
  const STRENGTH_ADJ = recalibrateStrengths(GROUPS, state, STRENGTH);

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
    // 1. Simular fixtures pendientes con fuerzas ajustadas (mutar buffers in-place)
    for (const group of GROUPS) {
      for (const fix of pendingByGroup[group.id]) {
        const venue = STADIUM_COUNTRY[fix.stadium] ?? "USA";
        const { home, away } = simulateMatch(fix.home, fix.away, venue, STRENGTH_ADJ);
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

    // 3. Calcular mejores terceros y simular bracket con fuerzas ajustadas
    const bestThirds = computeBestThirds(GROUPS, simBuf);
    simulateBracket(qualified, bestThirds, counts, STRENGTH_ADJ);
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
