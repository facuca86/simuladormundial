// test_bayes.mjs — Validación del ajuste bayesiano de fuerzas (LEARNING_RATE / BLEND)
// Uso: node test_bayes.mjs
//
// Cubre las 5 invariantes:
//   1. Suma P(campeón) ≈ 1.0
//   2. Embudo monotónico (campeón ≤ final ≤ semi ≤ cuartos ≤ clasifica)
//   3. Sumas exactas por ronda: 32 / 8 / 4 / 2 / 1
//   4. MEX y CZE con 100% de clasificar (estado diseñado para garantizarlo)
//   5. Estabilidad < 3pp entre dos corridas con la misma entrada

import {
  runMonteCarlo,
  recalibrateStrengths,
  STRENGTH,
  LEARNING_RATE,
  BLEND,
} from "./js/predictor.js";
import {
  GROUP_A_FIXTURES, GROUP_B_FIXTURES, GROUP_C_FIXTURES,
  GROUP_D_FIXTURES, GROUP_E_FIXTURES, GROUP_F_FIXTURES,
  GROUP_G_FIXTURES, GROUP_H_FIXTURES, GROUP_I_FIXTURES,
  GROUP_J_FIXTURES, GROUP_K_FIXTURES, GROUP_L_FIXTURES,
} from "./js/fixtures.js";

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

// ─── Estado con resultados de Jornada 1 y 2 ───────────────────────────────────
// Narrativa diseñada para probar el ajuste bayesiano con resultados interesantes:
//   • Grupo A: MEX (2W) y CZE (2W) tienen 6pts → clasificados con 100%  [Invariante 4]
//   • Grupo C: BRA pierde 1-2 contra MAR  [gran sorpresa bajista para BRA]
//   • Grupo G: BEL pierde 0-1 contra EGY  [sorpresa; BEL rebota 3-0 vs IRN]
//   • Grupo I: IRQ 0-4 NOR               [NOR sube drásticamente]
//   • Grupo J: ARG 4-0 ALG               [ARG muy dominante]
//   • Grupo E: GER 5-0 CUW               [GER dominante; CUW cae]
const stateWithResults = {
  // Grupo A — fixture IDs: 1(M1 MEX-RSA), 2(M1 KOR-CZE), 25(M2 CZE-RSA), 28(M2 MEX-KOR)
  groupA: {
    1:  { home: "2", away: "0" },  // MEX 2-0 RSA   (esperado, MEX en casa)
    2:  { home: "0", away: "2" },  // KOR 0-2 CZE   (CZE gana fuera — sorpresa leve)
    25: { home: "2", away: "0" },  // CZE 2-0 RSA   (esperado)
    28: { home: "2", away: "0" },  // MEX 2-0 KOR   (esperado, MEX en casa)
  },
  // Grupo B — fixture IDs: 3(M1 CAN-BIH), 8(M1 QAT-SUI), 26(M2 SUI-BIH), 27(M2 CAN-QAT)
  groupB: {
    3:  { home: "2", away: "0" },  // CAN 2-0 BIH
    8:  { home: "0", away: "3" },  // QAT 0-3 SUI   (SUI muy dominante)
    26: { home: "3", away: "0" },  // SUI 3-0 BIH
    27: { home: "2", away: "1" },  // CAN 2-1 QAT
  },
  // Grupo C — fixture IDs: 7(M1 BRA-MAR), 5(M1 HAI-SCO), 29(M2 BRA-HAI), 30(M2 SCO-MAR)
  groupC: {
    7:  { home: "1", away: "2" },  // BRA 1-2 MAR   *** SORPRESA: MAR gana en NJ ***
    5:  { home: "0", away: "3" },  // HAI 0-3 SCO   (SCO supera expectativas)
    29: { home: "4", away: "0" },  // BRA 4-0 HAI   (BRA rebota con autoridad)
    30: { home: "0", away: "1" },  // SCO 0-1 MAR   (MAR consistente)
  },
  // Grupo D — fixture IDs: 4(M1 USA-PAR), 6(M1 AUS-TUR), 31(M2 TUR-PAR), 32(M2 USA-AUS)
  groupD: {
    4:  { home: "2", away: "0" },  // USA 2-0 PAR
    6:  { home: "0", away: "2" },  // AUS 0-2 TUR   (TUR supera)
    31: { home: "2", away: "1" },  // TUR 2-1 PAR
    32: { home: "1", away: "0" },  // USA 1-0 AUS
  },
  // Grupo E — fixture IDs: 9(M1 GER-CUW), 10(M1 CIV-ECU), 33(M2 GER-CIV), 34(M2 ECU-CUW)
  groupE: {
    9:  { home: "5", away: "0" },  // GER 5-0 CUW   *** GER muy dominante ***
    10: { home: "0", away: "2" },  // CIV 0-2 ECU   (ECU sorprende de visitante)
    33: { home: "2", away: "1" },  // GER 2-1 CIV
    34: { home: "4", away: "0" },  // ECU 4-0 CUW
  },
  // Grupo F — fixture IDs: 11(M1 NED-JPN), 12(M1 SWE-TUN), 35(M2 NED-SWE), 36(M2 TUN-JPN)
  groupF: {
    11: { home: "1", away: "0" },  // NED 1-0 JPN
    12: { home: "2", away: "0" },  // SWE 2-0 TUN
    35: { home: "2", away: "0" },  // NED 2-0 SWE
    36: { home: "0", away: "3" },  // TUN 0-3 JPN   *** JPN dominante inesperado ***
  },
  // Grupo G — fixture IDs: 16(M1 BEL-EGY), 15(M1 IRN-NZL), 39(M2 BEL-IRN), 40(M2 NZL-EGY)
  groupG: {
    16: { home: "0", away: "1" },  // BEL 0-1 EGY   *** SORPRESA: EGY gana ***
    15: { home: "2", away: "0" },  // IRN 2-0 NZL
    39: { home: "3", away: "0" },  // BEL 3-0 IRN   (BEL rebota)
    40: { home: "0", away: "2" },  // NZL 0-2 EGY   (EGY consistente)
  },
  // Grupo H — fixture IDs: 14(M1 ESP-CPV), 13(M1 KSA-URU), 38(M2 ESP-KSA), 37(M2 URU-CPV)
  groupH: {
    14: { home: "3", away: "0" },  // ESP 3-0 CPV
    13: { home: "0", away: "2" },  // KSA 0-2 URU
    38: { home: "2", away: "0" },  // ESP 2-0 KSA
    37: { home: "2", away: "0" },  // URU 2-0 CPV
  },
  // Grupo I — fixture IDs: 17(M1 FRA-SEN), 18(M1 IRQ-NOR), 42(M2 FRA-IRQ), 41(M2 NOR-SEN)
  groupI: {
    17: { home: "1", away: "0" },  // FRA 1-0 SEN   (ajustado, FRA esperaba más)
    18: { home: "0", away: "4" },  // IRQ 0-4 NOR   *** SORPRESA MASIVA: NOR ***
    42: { home: "3", away: "0" },  // FRA 3-0 IRQ
    41: { home: "2", away: "1" },  // NOR 2-1 SEN
  },
  // Grupo J — fixture IDs: 19(M1 ARG-ALG), 20(M1 AUT-JOR), 43(M2 ARG-AUT), 44(M2 JOR-ALG)
  groupJ: {
    19: { home: "4", away: "0" },  // ARG 4-0 ALG   *** ARG muy dominante ***
    20: { home: "2", away: "0" },  // AUT 2-0 JOR
    43: { home: "2", away: "0" },  // ARG 2-0 AUT
    44: { home: "0", away: "2" },  // JOR 0-2 ALG
  },
  // Grupo K — fixture IDs: 23(M1 POR-COD), 24(M1 UZB-COL), 47(M2 POR-UZB), 48(M2 COL-COD)
  groupK: {
    23: { home: "2", away: "0" },  // POR 2-0 COD
    24: { home: "0", away: "3" },  // UZB 0-3 COL
    47: { home: "3", away: "0" },  // POR 3-0 UZB
    48: { home: "2", away: "0" },  // COL 2-0 COD
  },
  // Grupo L — fixture IDs: 22(M1 ENG-CRO), 21(M1 GHA-PAN), 45(M2 ENG-GHA), 46(M2 PAN-CRO)
  groupL: {
    22: { home: "3", away: "0" },  // ENG 3-0 CRO   (ENG supera expectativas)
    21: { home: "1", away: "0" },  // GHA 1-0 PAN
    45: { home: "2", away: "0" },  // ENG 2-0 GHA
    46: { home: "0", away: "2" },  // PAN 0-2 CRO
  },
};

// Estado vacío: sin resultados → recalibrateStrengths devuelve STRENGTH sin cambios
const stateEmpty = {};
for (const g of GROUPS) stateEmpty[g.id] = {};

const ITERS = 10_000;

// ─── 1. Tabla de fuerzas ajustadas ───────────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════════════");
console.log(`  Ajuste bayesiano  LEARNING_RATE=${LEARNING_RATE}  BLEND=${BLEND}`);
console.log("═══════════════════════════════════════════════════════════════════\n");

const STRENGTH_ADJ = recalibrateStrengths(GROUPS, stateWithResults, STRENGTH);

const deltas = Object.entries(STRENGTH).map(([code, base]) => ({
  code,
  base,
  adj: STRENGTH_ADJ[code],
  delta: STRENGTH_ADJ[code] - base,
}));
deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

console.log("Tabla de fuerzas ajustadas (ordenada por |delta|):");
console.log("  Código  Base   Ajust  Delta   Narrativa");
console.log("  ──────  ─────  ─────  ──────  ──────────────────────────────");
for (const { code, base, adj, delta } of deltas) {
  if (Math.abs(delta) < 0.05) continue;  // omitir equipos sin partidos jugados
  const arrow   = delta > 0 ? "▲" : "▼";
  const sign    = delta > 0 ? "+" : "";
  console.log(
    `  ${code.padEnd(6)}  ${base.toFixed(0).padStart(5)}  ${adj.toFixed(1).padStart(5)}  ${sign}${delta.toFixed(1).padStart(5)}  ${arrow}`
  );
}

// Verificar que ningún delta sea absurdo (> ±15 con solo 2 partidos)
const maxDelta = Math.max(...deltas.map(d => Math.abs(d.delta)));
console.log(`\nDelta máximo absoluto: ${maxDelta.toFixed(2)} pts`);
const absurdThreshold = 15;
if (maxDelta > absurdThreshold) {
  console.error(`  ADVERTENCIA: delta ${maxDelta.toFixed(1)} supera umbral ${absurdThreshold} — revisar LEARNING_RATE`);
} else {
  console.log(`  OK — ningún equipo se movió más de ${absurdThreshold} puntos (umbral razonable).`);
}

// ─── 2. Corridas Monte Carlo ──────────────────────────────────────────────────
console.log(`\n${"─".repeat(67)}`);
console.log(`Corrida BASE (sin resultados, ${ITERS.toLocaleString()} iters)...`);
const t0 = performance.now();
const probsBase = runMonteCarlo(GROUPS, stateEmpty, ITERS);
console.log(`  Tiempo: ${(performance.now() - t0).toFixed(0)} ms`);

console.log(`\nCorrida CON AJUSTE BAYESIANO (Jornadas 1+2 cargadas, ${ITERS.toLocaleString()} iters)...`);
const t1 = performance.now();
const probsAdj = runMonteCarlo(GROUPS, stateWithResults, ITERS);
console.log(`  Tiempo: ${(performance.now() - t1).toFixed(0)} ms`);

// ─── 3. Invariante 1: suma campeón ≈ 1.0 ─────────────────────────────────────
console.log(`\n${"─".repeat(67)}`);
console.log("INVARIANTE 1: suma P(campeón) ≈ 1.0");
const champSum = Object.values(probsAdj).reduce((s, p) => s + p.champion, 0);
const inv1ok = Math.abs(champSum - 1.0) < 0.01;
console.log(`  Suma: ${champSum.toFixed(5)}  → ${inv1ok ? "OK ✓" : "FALLO ✗"}`);

// ─── 4. Invariante 2: embudo monotónico ──────────────────────────────────────
console.log("\nINVARIANTE 2: embudo monotónico (campeón ≤ final ≤ semi ≤ cuartos ≤ clasifica)");
let inv2ok = true;
for (const [code, p] of Object.entries(probsAdj)) {
  if (p.champion > p.final + 0.001 || p.final > p.sf + 0.001 ||
      p.sf > p.qf + 0.001 || p.qf > p.group + 0.001) {
    console.error(`  INCONSISTENCIA para ${code}:`, p);
    inv2ok = false;
  }
}
console.log(`  ${inv2ok ? "OK ✓ — todos los 48 equipos son monotónicos" : "FALLO ✗"}`);

// ─── 5. Invariante 3: sumas exactas por ronda ────────────────────────────────
console.log("\nINVARIANTE 3: sumas por ronda deben ser exactamente 32/8/4/2/1");
const sumGroup    = Object.values(probsAdj).reduce((s, p) => s + p.group, 0);
const sumQF       = Object.values(probsAdj).reduce((s, p) => s + p.qf, 0);
const sumSF       = Object.values(probsAdj).reduce((s, p) => s + p.sf, 0);
const sumFinal    = Object.values(probsAdj).reduce((s, p) => s + p.final, 0);
const sumChampion = Object.values(probsAdj).reduce((s, p) => s + p.champion, 0);
const tol = 0.01;
const inv3ok = (
  Math.abs(sumGroup - 32) < tol &&
  Math.abs(sumQF    -  8) < tol &&
  Math.abs(sumSF    -  4) < tol &&
  Math.abs(sumFinal -  2) < tol &&
  Math.abs(sumChampion - 1) < tol
);
console.log(`  Clasifica: ${sumGroup.toFixed(3)}  (target 32)  ${Math.abs(sumGroup-32)<tol?"✓":"✗"}`);
console.log(`  Cuartos:   ${sumQF.toFixed(3)}   (target  8)  ${Math.abs(sumQF-8)<tol?"✓":"✗"}`);
console.log(`  Semis:     ${sumSF.toFixed(3)}   (target  4)  ${Math.abs(sumSF-4)<tol?"✓":"✗"}`);
console.log(`  Final:     ${sumFinal.toFixed(3)}   (target  2)  ${Math.abs(sumFinal-2)<tol?"✓":"✗"}`);
console.log(`  Campeón:   ${sumChampion.toFixed(3)}   (target  1)  ${Math.abs(sumChampion-1)<tol?"✓":"✗"}`);
console.log(`  ${inv3ok ? "OK ✓" : "FALLO ✗"}`);

// ─── 6. Invariante 4: MEX y CZE con P(clasifica) = 100% ─────────────────────
console.log("\nINVARIANTE 4: MEX y CZE con 100% de clasificar (ambos 6 pts tras MD2)");
const pMEX = probsAdj["MEX"]?.group ?? 0;
const pCZE = probsAdj["CZE"]?.group ?? 0;
const inv4ok = (pMEX >= 0.999 && pCZE >= 0.999);
console.log(`  MEX clasifica: ${(pMEX * 100).toFixed(1)}%  ${pMEX >= 0.999 ? "✓" : "✗"}`);
console.log(`  CZE clasifica: ${(pCZE * 100).toFixed(1)}%  ${pCZE >= 0.999 ? "✓" : "✗"}`);
console.log(`  ${inv4ok ? "OK ✓" : "FALLO ✗"}`);

// ─── 7. Invariante 5: estabilidad < 3pp ──────────────────────────────────────
console.log("\nINVARIANTE 5: estabilidad < 3pp entre dos corridas independientes");
const t2 = performance.now();
const probsAdj2 = runMonteCarlo(GROUPS, stateWithResults, ITERS);
console.log(`  Segunda corrida: ${(performance.now() - t2).toFixed(0)} ms`);

let maxDiffPP = 0;
let worstTeam = "";
for (const [code, p] of Object.entries(probsAdj)) {
  const p2 = probsAdj2[code];
  if (!p2) continue;
  const diff = Math.abs(p.champion - p2.champion) * 100;
  if (diff > maxDiffPP) { maxDiffPP = diff; worstTeam = code; }
}
const inv5ok = maxDiffPP < 3.0;
console.log(`  Mayor diferencia en campeón: ${maxDiffPP.toFixed(2)}pp (${worstTeam})`);
console.log(`  ${inv5ok ? "OK ✓ — estable (<3pp)" : `FALLO ✗ — diferencia ${maxDiffPP.toFixed(2)}pp supera 3pp`}`);

// ─── 8. Comparativa Top 10: base vs. ajustado ────────────────────────────────
console.log(`\n${"─".repeat(67)}`);
console.log("Top 10 campeón: SIN ajuste bayesiano vs. CON ajuste bayesiano");
console.log("─".repeat(67));
console.log("  Pos  Equipo  BASE%    Pos  Equipo  ADJ%     Δ%");
console.log("  ─────────────────────────────────────────────────────────────");

const sortedBase = Object.entries(probsBase)
  .sort((a, b) => b[1].champion - a[1].champion).slice(0, 10);
const sortedAdj  = Object.entries(probsAdj)
  .sort((a, b) => b[1].champion - a[1].champion).slice(0, 10);

for (let i = 0; i < 10; i++) {
  const [codeB, pB] = sortedBase[i];
  const [codeA, pA] = sortedAdj[i];
  const pAbase  = probsBase[codeA]?.champion ?? 0;
  const pAdelta = (pA.champion - pAbase) * 100;
  const sign    = pAdelta >= 0 ? "+" : "";
  console.log(
    `  ${(i+1).toString().padStart(2)}.  ${codeB.padEnd(6)} ${(pB.champion*100).toFixed(1).padStart(5)}%` +
    `    ${(i+1).toString().padStart(2)}.  ${codeA.padEnd(6)} ${(pA.champion*100).toFixed(1).padStart(5)}%` +
    `  ${sign}${pAdelta.toFixed(1)}pp`
  );
}

// ─── 9. Resumen ───────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(67)}`);
const allOk = inv1ok && inv2ok && inv3ok && inv4ok && inv5ok;
console.log(`RESULTADO: ${allOk ? "TODAS LAS INVARIANTES OK ✓" : "ALGUNA INVARIANTE FALLÓ ✗"}`);
console.log(`  LR=${LEARNING_RATE}  BLEND=${BLEND}  MaxDelta=±${maxDelta.toFixed(1)}pts  MaxDrift=±${maxDiffPP.toFixed(2)}pp`);
console.log("═".repeat(67));
