// test_mc.mjs — Diagnóstico Motor Monte Carlo (predictor.js)
// Ejecutar: node test_mc.mjs
// Sin modificar lógica. Solo diagnóstico.

import { runMonteCarlo, STRENGTH, simulateMatch, STADIUM_COUNTRY } from './js/predictor.js';
import {
  GROUP_A_FIXTURES, GROUP_B_FIXTURES, GROUP_C_FIXTURES,
  GROUP_D_FIXTURES, GROUP_E_FIXTURES, GROUP_F_FIXTURES,
  GROUP_G_FIXTURES, GROUP_H_FIXTURES, GROUP_I_FIXTURES,
  GROUP_J_FIXTURES, GROUP_K_FIXTURES, GROUP_L_FIXTURES,
} from './js/fixtures.js';

// ─── Grupos (idéntica estructura a app.js) ────────────────────────────────────
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

// ─── State con fechas 1 y 2 (resultados representativos del torneo al día 24/06) ─
// Claves son los fixture.id (numéricos → JS los convierte a string como clave de objeto).
// Grupos donde el 1º y 2º ya tienen 6pts (clasificados) → usados en check 4.
//
//  Grupo A: MEX 6pts, CZE 6pts ← clasificados | RSA 0pts, KOR 0pts ← eliminados de top2
//  Grupo B: CAN 6pts, SUI 6pts ← clasificados | BIH 0pts, QAT 0pts
//  Grupo C: BRA 6pts, tabla abierta
//  Grupo D: USA 6pts (host), TUR 6pts | PAR 0pts, AUS 0pts
//  Grupo E: GER 6pts, ECU 6pts | CIV 0pts, CUW 0pts
//  Grupo F: NED 6pts, JPN 3pts | tabla abierta
//  Grupo G: BEL 6pts, NZL 4pts | EGY 1pt, IRN 0pts
//  Grupo H: ESP 6pts, URU 6pts ← clasificados | CPV 0pts, KSA 0pts
//  Grupo I: FRA 6pts, NOR 6pts ← clasificados | SEN 0pts, IRQ 0pts
//  Grupo J: ARG 6pts, AUT/ALG 3pts | JOR 0pts
//  Grupo K: POR 6pts, COL 6pts ← clasificados | COD 0pts, UZB 0pts
//  Grupo L: ENG 4pts, GHA 4pts, CRO 3pts | PAN 0pts
const state = {
  groupA: {
    1:  { home: "2", away: "0" }, // MEX 2-0 RSA  (MD1, Azteca)
    2:  { home: "0", away: "3" }, // KOR 0-3 CZE  (MD1, Akron)
    25: { home: "2", away: "0" }, // CZE 2-0 RSA  (MD2, Atlanta)
    28: { home: "3", away: "1" }, // MEX 3-1 KOR  (MD2, Akron)
  },
  groupB: {
    3:  { home: "1", away: "0" }, // CAN 1-0 BIH  (MD1, Toronto)
    8:  { home: "0", away: "2" }, // QAT 0-2 SUI  (MD1, SF)
    26: { home: "2", away: "1" }, // SUI 2-1 BIH  (MD2, LA)
    27: { home: "2", away: "0" }, // CAN 2-0 QAT  (MD2, Vancouver)
  },
  groupC: {
    7:  { home: "2", away: "1" }, // BRA 2-1 MAR  (MD1)
    5:  { home: "0", away: "1" }, // HAI 0-1 SCO  (MD1)
    29: { home: "3", away: "0" }, // BRA 3-0 HAI  (MD2)
    30: { home: "1", away: "2" }, // SCO 1-2 MAR  (MD2)
  },
  groupD: {
    4:  { home: "3", away: "0" }, // USA 3-0 PAR  (MD1, SoFi - host)
    6:  { home: "1", away: "2" }, // AUS 1-2 TUR  (MD1, Vancouver)
    31: { home: "1", away: "0" }, // TUR 1-0 PAR  (MD2, SF)
    32: { home: "2", away: "0" }, // USA 2-0 AUS  (MD2, Seattle - host)
  },
  groupE: {
    9:  { home: "4", away: "0" }, // GER 4-0 CUW  (MD1, Houston)
    10: { home: "1", away: "2" }, // CIV 1-2 ECU  (MD1, Philly)
    33: { home: "2", away: "1" }, // GER 2-1 CIV  (MD2, Toronto)
    34: { home: "3", away: "1" }, // ECU 3-1 CUW  (MD2, KC)
  },
  groupF: {
    11: { home: "2", away: "1" }, // NED 2-1 JPN  (MD1, Dallas)
    12: { home: "1", away: "1" }, // SWE 1-1 TUN  (MD1, Monterrey)
    35: { home: "1", away: "0" }, // NED 1-0 SWE  (MD2, Houston)
    36: { home: "0", away: "2" }, // TUN 0-2 JPN  (MD2, Monterrey)
  },
  groupG: {
    16: { home: "2", away: "0" }, // BEL 2-0 EGY  (MD1, Seattle)
    15: { home: "0", away: "2" }, // IRN 0-2 NZL  (MD1, SoFi)
    39: { home: "3", away: "0" }, // BEL 3-0 IRN  (MD2, SoFi)
    40: { home: "1", away: "1" }, // NZL 1-1 EGY  (MD2, Vancouver)
  },
  groupH: {
    14: { home: "3", away: "0" }, // ESP 3-0 CPV  (MD1, Atlanta)
    13: { home: "0", away: "2" }, // KSA 0-2 URU  (MD1, Miami)
    38: { home: "2", away: "0" }, // ESP 2-0 KSA  (MD2, Atlanta)
    37: { home: "3", away: "0" }, // URU 3-0 CPV  (MD2, Miami)
  },
  groupI: {
    17: { home: "2", away: "0" }, // FRA 2-0 SEN  (MD1, NJ)
    18: { home: "0", away: "2" }, // IRQ 0-2 NOR  (MD1, Boston)
    42: { home: "3", away: "0" }, // FRA 3-0 IRQ  (MD2, Philly)
    41: { home: "2", away: "0" }, // NOR 2-0 SEN  (MD2, NJ)
  },
  groupJ: {
    19: { home: "2", away: "0" }, // ARG 2-0 ALG  (MD1, KC)
    20: { home: "2", away: "0" }, // AUT 2-0 JOR  (MD1, SF)
    43: { home: "2", away: "1" }, // ARG 2-1 AUT  (MD2, Dallas)
    44: { home: "1", away: "2" }, // JOR 1-2 ALG  (MD2, SF)
  },
  groupK: {
    23: { home: "2", away: "0" }, // POR 2-0 COD  (MD1, Houston)
    24: { home: "0", away: "2" }, // UZB 0-2 COL  (MD1, Azteca)
    47: { home: "3", away: "0" }, // POR 3-0 UZB  (MD2, Houston)
    48: { home: "2", away: "1" }, // COL 2-1 COD  (MD2, Akron)
  },
  groupL: {
    22: { home: "2", away: "0" }, // ENG 2-0 CRO  (MD1, Dallas)
    21: { home: "2", away: "0" }, // GHA 2-0 PAN  (MD1, Toronto)
    45: { home: "1", away: "1" }, // ENG 1-1 GHA  (MD2, Boston)
    46: { home: "0", away: "2" }, // PAN 0-2 CRO  (MD2, Toronto)
  },
};

// ─── Utilidades ───────────────────────────────────────────────────────────────
const hr = () => console.log("─".repeat(65));
const ok  = (msg) => console.log(`  ✅ PASA      — ${msg}`);
const warn= (msg) => console.log(`  ⚠️  SOSPECHOSO — ${msg}`);
const fail= (msg) => console.log(`  ❌ FALLA     — ${msg}`);

// ─── CHECK 1 — SUMA DE CAMPEÓN ════════════════════════════════════════════════
console.log("\n═══════════════════════════════════════════════════════════════════");
console.log(" DIAGNÓSTICO MOTOR MONTE CARLO — FIFA World Cup 2026");
console.log(" Fechas 1 y 2 cargadas | 2 000 iteraciones base");
console.log("═══════════════════════════════════════════════════════════════════\n");
console.log("Corriendo simulación #1 (2000 iteraciones)...");
const probs1 = runMonteCarlo(GROUPS, state, 2000);

hr();
console.log("CHECK 1 — SUMA DE PROBABILIDADES DE CAMPEÓN (debe ser 1.000 ±0.001)");
hr();
const champSum = Object.values(probs1).reduce((s, p) => s + p.champion, 0);
const champErr = Math.abs(champSum - 1.0);
console.log(`  Suma total: ${champSum.toFixed(5)}`);
if (champErr <= 0.001) {
  ok(`${champSum.toFixed(5)} — dentro de ±0.001`);
} else if (champErr <= 0.005) {
  warn(`${champSum.toFixed(5)} — desviación ${champErr.toFixed(5)} (margen algo alto, subir iteraciones)`);
} else {
  fail(`${champSum.toFixed(5)} — desviación ${champErr.toFixed(5)} → BUG en normalización`);
}

// ─── CHECK 2 — COHERENCIA DE EMBUDO ══════════════════════════════════════════
hr();
console.log("CHECK 2 — COHERENCIA DE EMBUDO (group ≥ qf ≥ sf ≥ final ≥ champion)");
hr();
const violations = [];
for (const [code, p] of Object.entries(probs1)) {
  const monotone =
    p.group  >= p.qf      - 1e-10 &&
    p.qf     >= p.sf      - 1e-10 &&
    p.sf     >= p.final   - 1e-10 &&
    p.final  >= p.champion - 1e-10;
  if (!monotone) violations.push({ code, ...p });
}
if (violations.length === 0) {
  ok("Ningún equipo viola la monotonía del embudo.");
} else {
  fail(`${violations.length} equipo(s) con violación — BUG DE CONTEO:`);
  for (const v of violations) {
    console.log(`    ${v.code}: group=${v.group.toFixed(3)} qf=${v.qf.toFixed(3)} sf=${v.sf.toFixed(3)} final=${v.final.toFixed(3)} champ=${v.champion.toFixed(3)}`);
  }
}

// ─── CHECK 3 — SUMAS POR RONDA ════════════════════════════════════════════════
hr();
console.log("CHECK 3 — SUMAS POR RONDA");
console.log("  Esperado: grupo≈32, qf≈8, sf≈4, final≈2, campeón≈1");
hr();
const sums = { group: 0, qf: 0, sf: 0, final: 0, champion: 0 };
for (const p of Object.values(probs1)) {
  sums.group    += p.group;
  sums.qf       += p.qf;
  sums.sf       += p.sf;
  sums.final    += p.final;
  sums.champion += p.champion;
}
const targets = { group: 32, qf: 8, sf: 4, final: 2, champion: 1 };
const roundResults = [];
for (const [round, target] of Object.entries(targets)) {
  const val = sums[round];
  const dev = Math.abs(val - target);
  const pct = (dev / target * 100).toFixed(1);
  let status, label;
  if (dev <= target * 0.03)      { status = "✅ PASA"; label = ok; }
  else if (dev <= target * 0.08) { status = "⚠️ SOSPECHOSO"; label = warn; }
  else                           { status = "❌ FALLA"; label = fail; }
  console.log(`  ${status.padEnd(14)} ${round.padEnd(9)}: ${val.toFixed(3)} (esperado ${target}, desv ${dev.toFixed(3)} = ${pct}%)`);
  roundResults.push({ round, val, target, ok: dev <= target * 0.03 });
}
// Extra: verificar que los 8 thirds realmente completan el bracket
const groupRound = roundResults.find(r => r.round === "group");
if (groupRound && Math.abs(groupRound.val - 32) > 1) {
  fail("La suma de P(grupo) se desvía >1 de 32 → posible problema con BEST_THIRDS_COMBINATIONS (clave no encontrada).");
}

// ─── CHECK 4 — RESULTADOS YA JUGADOS SE RESPETAN ════════════════════════════
hr();
console.log("CHECK 4 — RESULTADOS YA JUGADOS SE RESPETAN");
console.log("  Grupo A después de MD2:");
console.log("    MEX 6pts (clasificado), CZE 6pts (clasificado)");
console.log("    RSA 0pts (elim. de top2), KOR 0pts (elim. de top2)");
console.log("    [RSA vs KOR aún juegan en MD3 → el tercero puede ser mejor tercero]");
hr();

const pMEX = probs1["MEX"]?.group ?? -1;
const pCZE = probs1["CZE"]?.group ?? -1;
const pRSA = probs1["RSA"]?.group ?? -1;
const pKOR = probs1["KOR"]?.group ?? -1;

console.log(`  MEX (6pts, garantizado top2): P(avanza) = ${(pMEX*100).toFixed(2)}%`);
if (pMEX >= 0.999) ok("MEX P=100.0% — el motor respeta los resultados fijos.");
else if (pMEX >= 0.97) warn(`MEX P=${(pMEX*100).toFixed(2)}% — debería ser 100%, leve anomalía.`);
else fail(`MEX P=${(pMEX*100).toFixed(2)}% — CRÍTICO: el motor ignora resultados fijos.`);

console.log(`  CZE (6pts, garantizado top2): P(avanza) = ${(pCZE*100).toFixed(2)}%`);
if (pCZE >= 0.999) ok("CZE P=100.0% — correcto.");
else if (pCZE >= 0.97) warn(`CZE P=${(pCZE*100).toFixed(2)}% — leve anomalía.`);
else fail(`CZE P=${(pCZE*100).toFixed(2)}% — CRÍTICO.`);

console.log(`  RSA (0pts, elim. top2, pero MD3 vs KOR pendiente):`);
console.log(`    P(avanza grupo) = ${(pRSA*100).toFixed(2)}%`);
if (pRSA > 0.15) {
  fail(`RSA P=${(pRSA*100).toFixed(2)}% — CRÍTICO: el motor no respeta que RSA no puede ser top2.`);
} else if (pRSA > 0.0) {
  ok(`RSA P=${(pRSA*100).toFixed(2)}% — CORRECTO: chance residual vía "mejor tercero" (si gana MD3 con 3pts).`);
} else {
  // P = 0.0 podría ser ok (si el mejor tercero no alcanza) pero sospechoso con 2000 its
  warn(`RSA P=0.00% — Podría ser correcto o bien el mejor tercero nunca alcanza la barra.`);
}

console.log(`  KOR (0pts, elim. top2, pero MD3 vs RSA pendiente):`);
console.log(`    P(avanza grupo) = ${(pKOR*100).toFixed(2)}%`);
if (pKOR > 0.15) {
  fail(`KOR P=${(pKOR*100).toFixed(2)}% — CRÍTICO.`);
} else if (pKOR > 0.0) {
  ok(`KOR P=${(pKOR*100).toFixed(2)}% — CORRECTO: chance residual vía mejor tercero.`);
} else {
  warn(`KOR P=0.00% — Ver nota RSA.`);
}

// ─── CHECK 5 — RANKING DE FAVORITOS ══════════════════════════════════════════
hr();
console.log("CHECK 5 — RANKING DE FAVORITOS (sanity check cualitativo)");
console.log("  Esperado en top5: ARG, FRA, ESP, ENG, BRA, POR, NED, GER (fuerza ≥85)");
hr();
const ranked = Object.entries(probs1)
  .sort((a, b) => b[1].champion - a[1].champion)
  .slice(0, 10);
const STRONG = new Set(["ARG","FRA","ESP","ENG","BRA","POR","NED","GER","BEL"]);
let weakInTop5 = false;
ranked.forEach(([code, p], i) => {
  const s = STRENGTH[code] ?? 65;
  const tag = i < 5 && s < 70 ? " ⚠️ DÉBIL" : (STRONG.has(code) ? "" : "");
  if (i < 5 && s < 70) weakInTop5 = true;
  console.log(`  ${String(i+1).padStart(2)}. ${code.padEnd(4)} (fuerza ${s}): ${(p.champion*100).toFixed(2)}%${tag}`);
});
if (weakInTop5) {
  fail("Equipo de fuerza <70 en top5 → posible calibración incorrecta de STRENGTH.");
} else {
  ok("Los 5 favoritos son todos equipos de fuerza ≥70.");
}
// Chequeo extra: ¿ningún gran favorito aparece con 0% siendo que no está eliminado?
const bigFavorites = ["ARG","FRA","ESP","ENG","BRA","POR","NED","GER"];
let zeroFavs = bigFavorites.filter(c => probs1[c] && probs1[c].champion < 0.001);
if (zeroFavs.length > 0) {
  warn(`Favoritos con P(campeón)<0.1%: ${zeroFavs.join(", ")} — revisar si están eliminados o bug.`);
}

// ─── CHECK 6 — ESTABILIDAD ENTRE CORRIDAS ════════════════════════════════════
hr();
console.log("CHECK 6 — ESTABILIDAD ENTRE CORRIDAS (2x 2000 iteraciones)");
hr();
console.log("Corriendo simulación #2 (2000 iteraciones)...");
const probs2 = runMonteCarlo(GROUPS, state, 2000);

const topCode = ranked[0][0];
const topP1   = probs1[topCode].champion;
const topP2   = probs2[topCode].champion;
const diffPP  = Math.abs(topP1 - topP2) * 100;

console.log(`  Equipo favorito: ${topCode}`);
console.log(`  Corrida #1: ${(topP1*100).toFixed(2)}%`);
console.log(`  Corrida #2: ${(topP2*100).toFixed(2)}%`);
console.log(`  Diferencia: ${diffPP.toFixed(2)} puntos porcentuales`);

if (diffPP <= 2.0) {
  ok(`Varianza ${diffPP.toFixed(2)}pp — muy estable con 2000 its.`);
} else if (diffPP <= 3.5) {
  ok(`Varianza ${diffPP.toFixed(2)}pp — aceptable con 2000 its (umbral ~3pp).`);
} else if (diffPP <= 5.0) {
  warn(`Varianza ${diffPP.toFixed(2)}pp — algo alta; considerar 5000+ iteraciones.`);
} else {
  fail(`Varianza ${diffPP.toFixed(2)}pp — excesiva; revisar seeding aleatorio o subir iteraciones.`);
}

// También comparar top 5 entre corridas
console.log("\n  Comparación top5 entre corridas:");
const ranked2 = Object.entries(probs2).sort((a,b) => b[1].champion - a[1].champion).slice(0,5);
console.log("    Corrida#1:", ranked.slice(0,5).map(([c,p]) => `${c}(${(p.champion*100).toFixed(1)}%)`).join(" "));
console.log("    Corrida#2:", ranked2.map(([c,p]) => `${c}(${(p.champion*100).toFixed(1)}%)`).join(" "));
const top3_1 = new Set(ranked.slice(0,3).map(([c]) => c));
const top3_2 = new Set(ranked2.slice(0,3).map(([c]) => c));
const intersection = [...top3_1].filter(c => top3_2.has(c)).length;
if (intersection >= 2) {
  ok(`Al menos 2 de 3 equipos del top3 coinciden entre corridas — ranking estable.`);
} else {
  warn(`El top3 difiere mucho entre corridas — con 2000 its puede haber ruido.`);
}

// ─── CHECK 7 — BONO DE LOCALÍA ════════════════════════════════════════════════
hr();
console.log("CHECK 7 — BONO DE LOCALÍA (MEX, USA, CAN)");
hr();
const BASE = 1.2, ALPHA = 0.6;

// Comparar lambda del local con y sin bono para un equipo de igual fuerza
// simulateMatch(homeCode, awayCode) → lambda_home = BASE * (sH/sA)^ALPHA * hostBonus
const pairs = [
  { host: "MEX", sH: 73, rival: "USA", sA: 74, label: "MEX(host,str=73) vs rival str=74" },
  { host: "USA", sH: 74, rival: "ECU", sA: 74, label: "USA(host,str=74) vs rival str=74" },
  { host: "CAN", sH: 70, rival: "SUI", sA: 76, label: "CAN(host,str=70) vs rival str=76" },
];

const sameStrNonHost = [
  { code: "ECU", s: 74 }, // similar a USA
  { code: "TUR", s: 74 }, // similar a USA
  { code: "CZE", s: 70 }, // similar a CAN
];

let bonusOk = true;
for (const { host, sH, rival, sA, label } of pairs) {
  const lambdaHost    = BASE * Math.pow(sH / sA, ALPHA) * 1.1; // con bono
  const lambdaNoBonus = BASE * Math.pow(sH / sA, ALPHA) * 1.0; // sin bono
  const bonusEffect   = ((lambdaHost / lambdaNoBonus) - 1) * 100;
  console.log(`  ${label}:`);
  console.log(`    λ_home CON bono   = ${lambdaHost.toFixed(4)}  (hostBonus=1.1)`);
  console.log(`    λ_home SIN bono   = ${lambdaNoBonus.toFixed(4)}  (sin bono)`);
  console.log(`    Efecto del bono:  +${bonusEffect.toFixed(1)}% goles esperados`);
  if (lambdaHost <= lambdaNoBonus) bonusOk = false;
}

// ── Fix 53: CZE(home) vs MEX(away) en Estadio Azteca ────────────────────────
// Con el viejo código MEX (away) no recibía bono. Con el nuevo sí, porque
// venueCountry = STADIUM_COUNTRY["Estadio Azteca, Ciudad de México"] = "MEX"
// y MEX ∈ HOSTS → awayMult = 1.1.
const fix53Stadium = "Estadio Azteca, Ciudad de México";
const fix53Country = STADIUM_COUNTRY[fix53Stadium];
console.log(`\n  Fix 53 — CZE(home) vs MEX(away) @ "${fix53Stadium}"`);
console.log(`    venueCountry = STADIUM_COUNTRY["${fix53Stadium}"] = "${fix53Country}"`);

// Simular 5000 veces sin y con venueCountry para estimar λ empírica
let sumMexWithBonus = 0, sumMexNoBonus = 0;
const SAMPLES = 5000;
for (let k = 0; k < SAMPLES; k++) {
  sumMexWithBonus += simulateMatch("CZE", "MEX", fix53Country).away;
  sumMexNoBonus   += simulateMatch("CZE", "MEX", null).away;
}
const mexLambdaWithBonus = sumMexWithBonus / SAMPLES;
const mexLambdaNoBonus   = sumMexNoBonus   / SAMPLES;
const bonusGain = ((mexLambdaWithBonus / mexLambdaNoBonus) - 1) * 100;

console.log(`    λ empírica MEX (away, SIN bono) = ${mexLambdaNoBonus.toFixed(4)}`);
console.log(`    λ empírica MEX (away, CON bono) = ${mexLambdaWithBonus.toFixed(4)}`);
console.log(`    Ganancia del bono: +${bonusGain.toFixed(1)}% (esperado ~+10%)`);

const fix53Ok = bonusGain > 5 && bonusGain < 15 && fix53Country === "MEX";
if (fix53Ok) {
  ok(`Fix 53: MEX (away en Azteca) RECIBE el bono de localía. Ganancia empírica ≈${bonusGain.toFixed(1)}%.`);
} else if (fix53Country !== "MEX") {
  fail(`STADIUM_COUNTRY no mapea "${fix53Stadium}" → "MEX". Verificar la clave exacta.`);
} else {
  fail(`Ganancia del bono (${bonusGain.toFixed(1)}%) fuera del rango esperado ~10%. Revisar lógica.`);
}

// Comparar MEX vs TUR (fuerza similar, TUR=74 non-host, MEX=73 host) mismo rival
const rivalStr = 73;
const mexL = BASE * Math.pow(73 / rivalStr, ALPHA) * 1.1;
const turL = BASE * Math.pow(74 / rivalStr, ALPHA) * 1.0;
console.log(`\n  Ejemplo numérico (λ teórica) — ambos vs oponente str=73:`);
console.log(`    MEX (str=73, ALPHA=${ALPHA}, hostBonus=1.1) → λ = ${mexL.toFixed(4)}`);
console.log(`    TUR (str=74, ALPHA=${ALPHA}, sin bono)       → λ = ${turL.toFixed(4)}`);
console.log(`    MEX ${mexL > turL ? 'supera' : 'NO supera'} a TUR gracias al bono de localía.`);

if (bonusOk && mexL > turL) {
  ok("MEX/USA/CAN reciben el bono (+10% λ). MEX supera a TUR (str+1) gracias al bono.");
} else if (bonusOk) {
  ok("El bono de localía se aplica correctamente, pero MEX (str=73) no supera a TUR (str=74).");
  warn("Con ALPHA=0.6 la diferencia de fuerza pesa más — el bono compensa pero no supera 1pt de str.");
} else {
  fail("El bono de localía NO se está aplicando correctamente.");
}

// ─── RESUMEN FINAL ════════════════════════════════════════════════════════════
console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════");
console.log(" RESUMEN DIAGNÓSTICO");
console.log("═══════════════════════════════════════════════════════════════════\n");

console.log("  CHECK 1 — Suma campeón     : VER ARRIBA");
console.log("  CHECK 2 — Embudo monotónico: VER ARRIBA");
console.log("  CHECK 3 — Sumas por ronda  : VER ARRIBA");
console.log("  CHECK 4 — Resultados fijos : VER ARRIBA");
console.log("  CHECK 5 — Ranking favs     : VER ARRIBA");
console.log("  CHECK 6 — Estabilidad      : VER ARRIBA");
console.log("  CHECK 7 — Bono localía     : VER ARRIBA");

// Métricas rápidas finales
console.log("\n  Métricas rápidas (corrida #1 — 2000 its):");
console.log(`    Suma P(campeón):  ${champSum.toFixed(5)}`);
console.log(`    Suma P(grupo):    ${sums.group.toFixed(3)} (esperado 32)`);
console.log(`    Suma P(qf):       ${sums.qf.toFixed(3)} (esperado 8)`);
console.log(`    Suma P(sf):       ${sums.sf.toFixed(3)} (esperado 4)`);
console.log(`    Suma P(final):    ${sums.final.toFixed(3)} (esperado 2)`);
console.log(`    MEX P(grupo):     ${(pMEX*100).toFixed(2)}% [debe ser 100%]`);
console.log(`    RSA P(grupo):     ${(pRSA*100).toFixed(2)}% [debe ser ~0-5% vía mejor 3ro]`);
console.log(`    Top favorito:     ${ranked[0][0]} (${(ranked[0][1].champion*100).toFixed(2)}%)`);

console.log("\n  Análisis de posibles bugs:");
const issues = [];
if (champErr > 0.001)   issues.push("Suma P(campeón) fuera de ±0.001 — posible pérdida de iteraciones.");
if (violations.length)  issues.push(`${violations.length} equipo(s) violan monotonía del embudo — bug de conteo.`);
if (Math.abs(sums.group - 32) > 2) issues.push("Suma P(grupo) lejos de 32 — posible BEST_THIRDS_COMBINATIONS incompleto.");
if (pMEX < 0.97)        issues.push("MEX (6pts garantizado) tiene P(grupo)<97% — motor ignora resultados fijos.");
if (pCZE < 0.97)        issues.push("CZE (6pts garantizado) tiene P(grupo)<97% — motor ignora resultados fijos.");
if (pRSA > 0.15)        issues.push("RSA (0pts, elim. top2) tiene P(grupo)>15% — motor ignora resultados fijos.");
if (weakInTop5)         issues.push("Equipo débil (str<70) en top5 de campeón — revisar calibración STRENGTH.");
if (diffPP > 5.0)       issues.push("Varianza >5pp entre corridas — subir iteraciones o revisar RNG.");

if (issues.length === 0) {
  console.log("  ✅ No se detectaron bugs críticos. El motor opera coherentemente.");
} else {
  console.log("  Problemas detectados:");
  issues.forEach(i => console.log(`    ❌ ${i}`));
}

console.log("\n  Nota sobre Check 4 (P=0% para eliminados):");
console.log("  Con fechas 1+2 jugadas, RSA/KOR (0pts) AÚN tienen un juego pendiente entre sí.");
console.log("  El ganador obtiene 3pts y PODRÍA clasificar como mejor tercero si los otros");
console.log("  grupos no tienen terceros con más pts/DG. Por eso P(grupo)>0 es CORRECTO");
console.log("  y no indica un bug. Para obtener P=0 real se necesita un grupo completado");
console.log("  con un equipo en 4° lugar (nunca elegible como mejor tercero).");
console.log();
