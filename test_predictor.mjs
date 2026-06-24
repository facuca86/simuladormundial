// test_predictor.mjs — Prueba headless del motor Monte Carlo en Node.js
// Uso: node test_predictor.mjs

import { runMonteCarlo } from "./js/predictor.js";
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

// Estado vacío: todos los partidos pendientes
const state = {};
for (const g of GROUPS) state[g.id] = {};

console.log("Iniciando simulación Monte Carlo (2000 iteraciones)...");
const t0 = performance.now();
const probs = runMonteCarlo(GROUPS, state, 2000);
const elapsed = (performance.now() - t0).toFixed(0);
console.log(`Tiempo total: ${elapsed} ms`);

// Validar suma de campeón
const champSum = Object.values(probs).reduce((s, p) => s + p.champion, 0);
console.log(`Suma prob campeón: ${champSum.toFixed(4)} (debe ser ~1.0)`);
console.assert(Math.abs(champSum - 1.0) < 0.02, "FALLO: suma campeón fuera de rango");

// Top 10 por probabilidad de campeón
const sorted = Object.entries(probs).sort((a, b) => b[1].champion - a[1].champion);
console.log("\nTop 10 favoritos:");
sorted.slice(0, 10).forEach(([code, p], i) => {
  console.log(
    `  ${i + 1}. ${code.padEnd(4)} | clasifica: ${(p.group * 100).toFixed(1).padStart(5)}%` +
    ` | cuartos: ${(p.qf * 100).toFixed(1).padStart(5)}%` +
    ` | semi: ${(p.sf * 100).toFixed(1).padStart(5)}%` +
    ` | final: ${(p.final * 100).toFixed(1).padStart(5)}%` +
    ` | campeón: ${(p.champion * 100).toFixed(1).padStart(5)}%`
  );
});

// Validar consistencia: campeón ≤ final ≤ semi ≤ cuartos ≤ clasifica
let ok = true;
for (const [code, p] of Object.entries(probs)) {
  if (p.champion > p.final + 0.001 || p.final > p.sf + 0.001 ||
      p.sf > p.qf + 0.001 || p.qf > p.group + 0.001) {
    console.error(`INCONSISTENCIA para ${code}:`, p);
    ok = false;
  }
}
if (ok) console.log("\nValidación monotónica: OK (campeón ≤ final ≤ semi ≤ cuartos ≤ clasifica)");
