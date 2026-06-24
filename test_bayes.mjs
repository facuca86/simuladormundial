// test_bayes.mjs — Validación del ajuste bayesiano HÍBRIDO (goles + resultado)
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
  STADIUM_COUNTRY,
  LEARNING_RATE,
  BLEND,
  W_GOLES,
  W_RESULTADO,
  GOALS_SCALE,
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

// ─── Resultados Jornadas 1 y 2 ────────────────────────────────────────────────
// Narrativa con casos interesantes para el ajuste híbrido.
const stateWithResults = {
  groupA: { 1:{home:"2",away:"0"}, 2:{home:"0",away:"2"}, 25:{home:"2",away:"0"}, 28:{home:"2",away:"0"} },
  groupB: { 3:{home:"2",away:"0"}, 8:{home:"0",away:"3"}, 26:{home:"3",away:"0"}, 27:{home:"2",away:"1"} },
  groupC: { 7:{home:"1",away:"2"}, 5:{home:"0",away:"3"}, 29:{home:"4",away:"0"}, 30:{home:"0",away:"1"} },
  groupD: { 4:{home:"2",away:"0"}, 6:{home:"0",away:"2"}, 31:{home:"2",away:"1"}, 32:{home:"1",away:"0"} },
  groupE: { 9:{home:"5",away:"0"}, 10:{home:"0",away:"2"}, 33:{home:"2",away:"1"}, 34:{home:"4",away:"0"} },
  groupF: { 11:{home:"1",away:"0"}, 12:{home:"2",away:"0"}, 35:{home:"2",away:"0"}, 36:{home:"0",away:"3"} },
  groupG: { 16:{home:"0",away:"1"}, 15:{home:"2",away:"0"}, 39:{home:"3",away:"0"}, 40:{home:"0",away:"2"} },
  groupH: { 14:{home:"3",away:"0"}, 13:{home:"0",away:"2"}, 38:{home:"2",away:"0"}, 37:{home:"2",away:"0"} },
  groupI: { 17:{home:"1",away:"0"}, 18:{home:"0",away:"4"}, 42:{home:"3",away:"0"}, 41:{home:"2",away:"1"} },
  groupJ: { 19:{home:"4",away:"0"}, 20:{home:"2",away:"0"}, 43:{home:"2",away:"0"}, 44:{home:"0",away:"2"} },
  groupK: { 23:{home:"2",away:"0"}, 24:{home:"0",away:"3"}, 47:{home:"3",away:"0"}, 48:{home:"2",away:"0"} },
  groupL: { 22:{home:"3",away:"0"}, 21:{home:"1",away:"0"}, 45:{home:"2",away:"0"}, 46:{home:"0",away:"2"} },
};

const stateEmpty = {};
for (const g of GROUPS) stateEmpty[g.id] = {};

const HOSTS = new Set(["MEX", "USA", "CAN"]);

// ─── Reimplementación local de calibración "solo goles" (para comparar) ───────
// Igual al modelo anterior sin el componente de resultado.
function soloGolesCalibrate(GROUPS, state, STRENGTH_BASE) {
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
      const sH = adj[fix.home] ?? 65;
      const sA = adj[fix.away] ?? 65;
      const venue    = STADIUM_COUNTRY[fix.stadium] ?? "USA";
      const homeMult = (HOSTS.has(fix.home) && venue === fix.home) ? 1.1 : 1.0;
      const awayMult = (HOSTS.has(fix.away) && venue === fix.away) ? 1.1 : 1.0;
      const ratio    = sH / sA;
      const lambdaH  = BASE * Math.pow(ratio,     ALPHA) * homeMult;
      const lambdaA  = BASE * Math.pow(1 / ratio, ALPHA) * awayMult;
      const margin = Math.abs(actualH - actualA);
      const weight = 1 + margin * 0.2;
      adj[fix.home] += LEARNING_RATE * (actualH - lambdaH) * weight;
      adj[fix.away] += LEARNING_RATE * (actualA - lambdaA) * weight;
    }
  }
  const result = {};
  for (const code of Object.keys(STRENGTH_BASE)) {
    const blended = BLEND * adj[code] + (1 - BLEND) * STRENGTH_BASE[code];
    result[code] = Math.min(99, Math.max(40, blended));
  }
  return result;
}

const ITERS = 10_000;

// ─── 1. Calcular fuerzas con ambos modelos ────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════════════");
console.log(`  Ajuste híbrido  LR=${LEARNING_RATE}  BLEND=${BLEND}  W_G=${W_GOLES}  W_R=${W_RESULTADO}  GS=${GOALS_SCALE}`);
console.log("═══════════════════════════════════════════════════════════════════\n");

const adjGoals  = soloGolesCalibrate(GROUPS, stateWithResults, STRENGTH);
const adjHybrid = recalibrateStrengths(GROUPS, stateWithResults, STRENGTH);

// ─── 2. Tabla comparativa para equipos clave ──────────────────────────────────
const KEY_TEAMS = ["MAR","BRA","EGY","BEL","GER","ECU","NOR","ARG","ENG","SUI","JPN","CUW","IRQ"];

console.log("Tabla comparativa: Base | Solo-goles | Híbrido — equipos clave");
console.log("  Eq.    Base   Solo-G  Δ-G    Híbrido  Δ-H    Dif(H−G)");
console.log("  ─────────────────────────────────────────────────────────────");
for (const code of KEY_TEAMS) {
  const base   = STRENGTH[code];
  const sg     = adjGoals[code];
  const hy     = adjHybrid[code];
  const deltaG = sg - base;
  const deltaH = hy - base;
  const diff   = deltaH - deltaG;
  const signG  = deltaG >= 0 ? "+" : "";
  const signH  = deltaH >= 0 ? "+" : "";
  const signD  = diff >= 0 ? "+" : "";
  console.log(
    `  ${code.padEnd(6)} ${base.toFixed(0).padStart(4)}   ${sg.toFixed(1).padStart(6)}` +
    `  ${signG}${deltaG.toFixed(1).padStart(5)}  ${hy.toFixed(1).padStart(6)}` +
    `  ${signH}${deltaH.toFixed(1).padStart(5)}  ${signD}${diff.toFixed(1).padStart(5)}`
  );
}

// ─── 3. Tabla completa ordenada por |delta híbrido| ──────────────────────────
console.log("\nTodos los equipos ordenados por |Δ-híbrido|:");
console.log("  Código  Base   Híbrido  Δ-H");
console.log("  ──────  ─────  ───────  ──────");
const allDeltas = Object.entries(STRENGTH).map(([code, base]) => ({
  code, base, adj: adjHybrid[code], delta: adjHybrid[code] - base
})).sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta));

for (const { code, base, adj, delta } of allDeltas) {
  if (Math.abs(delta) < 0.05) continue;
  const sign = delta >= 0 ? "+" : "";
  const arrow = delta >= 0 ? "▲" : "▼";
  console.log(`  ${code.padEnd(6)}  ${base.toFixed(0).padStart(5)}  ${adj.toFixed(1).padStart(6)}  ${sign}${delta.toFixed(1).padStart(5)}  ${arrow}`);
}

const maxDelta = Math.max(...allDeltas.map(d => Math.abs(d.delta)));
console.log(`\nDelta máximo absoluto (híbrido): ±${maxDelta.toFixed(2)} pts`);
if (maxDelta > 15) {
  console.error("  ADVERTENCIA: delta supera 15 pts — revisar parámetros");
} else {
  console.log("  OK — ningún equipo se movió más de 15 pts.");
}

// ─── 4. Corridas Monte Carlo ──────────────────────────────────────────────────
console.log(`\n${"─".repeat(67)}`);
console.log(`Corrida SOLO-GOLES (${ITERS.toLocaleString()} iters)...`);
const t0 = performance.now();
const probsGoals = runMonteCarlo(GROUPS, stateWithResults, ITERS, adjGoals);
console.log(`  Tiempo: ${(performance.now() - t0).toFixed(0)} ms`);

console.log(`\nCorrida HÍBRIDA (${ITERS.toLocaleString()} iters)...`);
const t1 = performance.now();
const probsHybrid = runMonteCarlo(GROUPS, stateWithResults, ITERS, adjHybrid);
console.log(`  Tiempo: ${(performance.now() - t1).toFixed(0)} ms`);

// ─── 5. Invariante 1: suma campeón ≈ 1.0 ─────────────────────────────────────
console.log(`\n${"─".repeat(67)}`);
console.log("INVARIANTE 1: suma P(campeón) ≈ 1.0");
const champSum = Object.values(probsHybrid).reduce((s, p) => s + p.champion, 0);
const inv1ok = Math.abs(champSum - 1.0) < 0.01;
console.log(`  Suma: ${champSum.toFixed(5)}  → ${inv1ok ? "OK ✓" : "FALLO ✗"}`);

// ─── 6. Invariante 2: embudo monotónico ──────────────────────────────────────
console.log("\nINVARIANTE 2: embudo monotónico");
let inv2ok = true;
for (const [code, p] of Object.entries(probsHybrid)) {
  if (p.champion > p.final + 0.001 || p.final > p.sf + 0.001 ||
      p.sf > p.qf + 0.001 || p.qf > p.group + 0.001) {
    console.error(`  INCONSISTENCIA para ${code}:`, p);
    inv2ok = false;
  }
}
console.log(`  ${inv2ok ? "OK ✓ — todos los 48 equipos son monotónicos" : "FALLO ✗"}`);

// ─── 7. Invariante 3: sumas por ronda ────────────────────────────────────────
console.log("\nINVARIANTE 3: sumas por ronda deben ser exactamente 32/8/4/2/1");
const sumG  = Object.values(probsHybrid).reduce((s,p)=>s+p.group,0);
const sumQF = Object.values(probsHybrid).reduce((s,p)=>s+p.qf,0);
const sumSF = Object.values(probsHybrid).reduce((s,p)=>s+p.sf,0);
const sumF  = Object.values(probsHybrid).reduce((s,p)=>s+p.final,0);
const sumC  = Object.values(probsHybrid).reduce((s,p)=>s+p.champion,0);
const tol   = 0.01;
const inv3ok = Math.abs(sumG-32)<tol && Math.abs(sumQF-8)<tol &&
               Math.abs(sumSF-4)<tol && Math.abs(sumF-2)<tol && Math.abs(sumC-1)<tol;
console.log(`  Clasifica:${sumG.toFixed(3).padStart(7)}  (32) ${Math.abs(sumG-32)<tol?"✓":"✗"}`);
console.log(`  Cuartos:  ${sumQF.toFixed(3).padStart(7)}  ( 8) ${Math.abs(sumQF-8)<tol?"✓":"✗"}`);
console.log(`  Semis:    ${sumSF.toFixed(3).padStart(7)}  ( 4) ${Math.abs(sumSF-4)<tol?"✓":"✗"}`);
console.log(`  Final:    ${sumF.toFixed(3).padStart(7)}  ( 2) ${Math.abs(sumF-2)<tol?"✓":"✗"}`);
console.log(`  Campeón:  ${sumC.toFixed(3).padStart(7)}  ( 1) ${Math.abs(sumC-1)<tol?"✓":"✗"}`);
console.log(`  ${inv3ok ? "OK ✓" : "FALLO ✗"}`);

// ─── 8. Invariante 4: MEX y CZE 100% clasificar ──────────────────────────────
console.log("\nINVARIANTE 4: MEX y CZE = 100% clasifica (ambos 6 pts tras MD2)");
const pMEX = probsHybrid["MEX"]?.group ?? 0;
const pCZE = probsHybrid["CZE"]?.group ?? 0;
const inv4ok = pMEX >= 0.999 && pCZE >= 0.999;
console.log(`  MEX: ${(pMEX*100).toFixed(1)}%  ${pMEX>=0.999?"✓":"✗"}`);
console.log(`  CZE: ${(pCZE*100).toFixed(1)}%  ${pCZE>=0.999?"✓":"✗"}`);
console.log(`  ${inv4ok ? "OK ✓" : "FALLO ✗"}`);

// ─── 9. Invariante 5: estabilidad < 3pp ──────────────────────────────────────
console.log("\nINVARIANTE 5: estabilidad < 3pp entre dos corridas independientes");
const t2 = performance.now();
const probsHybrid2 = runMonteCarlo(GROUPS, stateWithResults, ITERS, adjHybrid);
console.log(`  Segunda corrida: ${(performance.now()-t2).toFixed(0)} ms`);
let maxDriftPP = 0, worstTeam = "";
for (const [code, p] of Object.entries(probsHybrid)) {
  const diff = Math.abs(p.champion - (probsHybrid2[code]?.champion ?? 0)) * 100;
  if (diff > maxDriftPP) { maxDriftPP = diff; worstTeam = code; }
}
const inv5ok = maxDriftPP < 3.0;
console.log(`  Mayor diferencia: ${maxDriftPP.toFixed(2)}pp (${worstTeam})`);
console.log(`  ${inv5ok ? "OK ✓ — estable (<3pp)" : `FALLO ✗ — ${maxDriftPP.toFixed(2)}pp > 3pp`}`);

// ─── 10. Top 10 campeón: solo-goles vs. híbrido ──────────────────────────────
console.log(`\n${"─".repeat(67)}`);
console.log("Top 10 campeón: SOLO-GOLES vs. HÍBRIDO");
console.log("─".repeat(67));
console.log("  Pos  Equipo  SG-%     Pos  Equipo  HY-%     Δ(HY−SG)");
console.log("  ─────────────────────────────────────────────────────────────");

const sortedSG = Object.entries(probsGoals).sort((a,b)=>b[1].champion-a[1].champion).slice(0,10);
const sortedHY = Object.entries(probsHybrid).sort((a,b)=>b[1].champion-a[1].champion).slice(0,10);

for (let i = 0; i < 10; i++) {
  const [codeSG, pSG] = sortedSG[i];
  const [codeHY, pHY] = sortedHY[i];
  const pHYbase = probsGoals[codeHY]?.champion ?? 0;
  const delta   = (pHY.champion - pHYbase) * 100;
  const sign    = delta >= 0 ? "+" : "";
  console.log(
    `  ${(i+1).toString().padStart(2)}.  ${codeSG.padEnd(6)} ${(pSG.champion*100).toFixed(1).padStart(5)}%` +
    `    ${(i+1).toString().padStart(2)}.  ${codeHY.padEnd(6)} ${(pHY.champion*100).toFixed(1).padStart(5)}%` +
    `  ${sign}${delta.toFixed(1)}pp`
  );
}

// ─── 11. Resumen ──────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(67)}`);
const allOk = inv1ok && inv2ok && inv3ok && inv4ok && inv5ok;
console.log(`RESULTADO: ${allOk ? "TODAS LAS INVARIANTES OK ✓" : "ALGUNA INVARIANTE FALLÓ ✗"}`);
console.log(`  LR=${LEARNING_RATE}  BLEND=${BLEND}  W_G=${W_GOLES}  W_R=${W_RESULTADO}  GS=${GOALS_SCALE}  MaxΔ=±${maxDelta.toFixed(1)}pts  Drift=±${maxDriftPP.toFixed(2)}pp`);

// Nota sobre MAR/BRA/BEL/EGY
const marG = adjGoals["MAR"] - STRENGTH["MAR"];
const marH = adjHybrid["MAR"] - STRENGTH["MAR"];
const braG = adjGoals["BRA"] - STRENGTH["BRA"];
const braH = adjHybrid["BRA"] - STRENGTH["BRA"];
const egyG = adjGoals["EGY"] - STRENGTH["EGY"];
const egyH = adjHybrid["EGY"] - STRENGTH["EGY"];
const belG = adjGoals["BEL"] - STRENGTH["BEL"];
const belH = adjHybrid["BEL"] - STRENGTH["BEL"];
console.log("\nVerificación de casos clave:");
console.log(`  MAR (ganó a BRA):  solo-goles Δ${marG>=0?"+":""}${marG.toFixed(2)}  híbrido Δ${marH>=0?"+":""}${marH.toFixed(2)}  → MAR sube ${marH>marG?"MÁS":"IGUAL/MENOS"} con híbrido`);
console.log(`  BRA (perdió a MAR):solo-goles Δ${braG>=0?"+":""}${braG.toFixed(2)}  híbrido Δ${braH>=0?"+":""}${braH.toFixed(2)}  → BRA ${braH<braG?"BAJA como esperado":"SUBE igual"} con híbrido`);
console.log(`  EGY (ganó a BEL):  solo-goles Δ${egyG>=0?"+":""}${egyG.toFixed(2)}  híbrido Δ${egyH>=0?"+":""}${egyH.toFixed(2)}  → EGY sube ${egyH>egyG?"MÁS":"IGUAL/MENOS"} con híbrido`);
console.log(`  BEL (perdió a EGY):solo-goles Δ${belG>=0?"+":""}${belG.toFixed(2)}  híbrido Δ${belH>=0?"+":""}${belH.toFixed(2)}  → BEL ${belH<belG?"BAJA como esperado":"sube igual"} con híbrido`);
console.log("═".repeat(67));
