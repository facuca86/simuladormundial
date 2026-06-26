// audit_arg_rivals.mjs — Rivales de Argentina por ronda (100 corridas × 2000 its)
// node audit_arg_rivals.mjs

import {
  simulateMatch, recalibrateStrengths, STRENGTH, STADIUM_COUNTRY,
} from "./js/predictor.js";
import { computeStandings, computeBestThirds } from "./js/standings.js";
import { BEST_THIRDS_COMBINATIONS }            from "./js/combinations.js";
import {
  GROUP_A_FIXTURES, GROUP_B_FIXTURES, GROUP_C_FIXTURES,
  GROUP_D_FIXTURES, GROUP_E_FIXTURES, GROUP_F_FIXTURES,
  GROUP_G_FIXTURES, GROUP_H_FIXTURES, GROUP_I_FIXTURES,
  GROUP_J_FIXTURES, GROUP_K_FIXTURES, GROUP_L_FIXTURES,
} from "./js/fixtures.js";

const GROUPS = [
  { id:"groupA", label:"A", teams:["MEX","RSA","KOR","CZE"], fixtures:GROUP_A_FIXTURES },
  { id:"groupB", label:"B", teams:["CAN","BIH","QAT","SUI"], fixtures:GROUP_B_FIXTURES },
  { id:"groupC", label:"C", teams:["BRA","MAR","HAI","SCO"], fixtures:GROUP_C_FIXTURES },
  { id:"groupD", label:"D", teams:["USA","PAR","AUS","TUR"], fixtures:GROUP_D_FIXTURES },
  { id:"groupE", label:"E", teams:["GER","CUW","CIV","ECU"], fixtures:GROUP_E_FIXTURES },
  { id:"groupF", label:"F", teams:["NED","JPN","SWE","TUN"], fixtures:GROUP_F_FIXTURES },
  { id:"groupG", label:"G", teams:["BEL","EGY","IRN","NZL"], fixtures:GROUP_G_FIXTURES },
  { id:"groupH", label:"H", teams:["ESP","CPV","KSA","URU"], fixtures:GROUP_H_FIXTURES },
  { id:"groupI", label:"I", teams:["FRA","SEN","IRQ","NOR"], fixtures:GROUP_I_FIXTURES },
  { id:"groupJ", label:"J", teams:["ARG","ALG","AUT","JOR"], fixtures:GROUP_J_FIXTURES },
  { id:"groupK", label:"K", teams:["POR","COD","UZB","COL"], fixtures:GROUP_K_FIXTURES },
  { id:"groupL", label:"L", teams:["ENG","CRO","GHA","PAN"], fixtures:GROUP_L_FIXTURES },
];

const state = {
  groupA: { 1:{home:"2",away:"0"},2:{home:"2",away:"1"},25:{home:"1",away:"1"},28:{home:"1",away:"0"},53:{home:"0",away:"3"},54:{home:"1",away:"0"} },
  groupB: { 3:{home:"1",away:"1"},8:{home:"1",away:"1"},26:{home:"4",away:"1"},27:{home:"6",away:"0"},51:{home:"2",away:"1"},52:{home:"3",away:"1"} },
  groupC: { 7:{home:"1",away:"1"},5:{home:"0",away:"1"},29:{home:"3",away:"0"},30:{home:"0",away:"1"},49:{home:"0",away:"3"},50:{home:"4",away:"2"} },
  groupD: { 4:{home:"4",away:"1"},6:{home:"2",away:"0"},31:{home:"0",away:"1"},32:{home:"2",away:"0"},59:{home:"3",away:"2"},60:{home:"0",away:"0"} },
  groupE: { 9:{home:"7",away:"1"},10:{home:"1",away:"0"},33:{home:"2",away:"1"},34:{home:"0",away:"0"},55:{home:"0",away:"2"},56:{home:"2",away:"1"} },
  groupF: { 11:{home:"2",away:"2"},12:{home:"5",away:"1"},35:{home:"5",away:"1"},36:{home:"0",away:"4"},57:{home:"1",away:"1"},58:{home:"1",away:"3"} },
  groupG: { 16:{home:"1",away:"1"},15:{home:"2",away:"2"},39:{home:"0",away:"0"},40:{home:"1",away:"3"} },
  groupH: { 14:{home:"0",away:"0"},13:{home:"1",away:"1"},38:{home:"4",away:"0"},37:{home:"2",away:"2"} },
  groupI: { 17:{home:"3",away:"1"},18:{home:"1",away:"4"},42:{home:"3",away:"0"},41:{home:"3",away:"2"},61:{home:"1",away:"4"},62:{home:"5",away:"0"} },
  groupJ: { 19:{home:"3",away:"0"},20:{home:"3",away:"1"},43:{home:"2",away:"0"},44:{home:"1",away:"2"} },
  groupK: { 23:{home:"1",away:"1"},24:{home:"1",away:"3"},47:{home:"5",away:"0"},48:{home:"1",away:"0"} },
  groupL: { 22:{home:"4",away:"2"},21:{home:"1",away:"0"},45:{home:"0",away:"0"},46:{home:"0",away:"1"} },
};

const R32_SEEDS = [
  {home:"1E",away:null,thirdSlot:"1E"},{home:"1I",away:null,thirdSlot:"1I"},
  {home:"2A",away:"2B",thirdSlot:null},{home:"1F",away:"2C",thirdSlot:null},
  {home:"2K",away:"2L",thirdSlot:null},{home:"1H",away:"2J",thirdSlot:null},
  {home:"1D",away:null,thirdSlot:"1D"},{home:"1G",away:null,thirdSlot:"1G"},
  {home:"1C",away:"2F",thirdSlot:null},{home:"2E",away:"2I",thirdSlot:null},
  {home:"1A",away:null,thirdSlot:"1A"},{home:"1L",away:null,thirdSlot:"1L"},
  {home:"1J",away:"2H",thirdSlot:null},{home:"2D",away:"2G",thirdSlot:null},
  {home:"1B",away:null,thirdSlot:"1B"},{home:"1K",away:null,thirdSlot:"1K"},
];
const R16_PAIRS = [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13],[14,15]];
const QF_PAIRS  = [[0,1],[2,3],[4,5],[6,7]];
const SF_PAIRS  = [[0,1],[2,3]];

function resolveSeed(seed, qualified) {
  const m = seed.match(/^(\d)([A-L])$/);
  if (!m) return null;
  const pos = parseInt(m[1],10)-1;
  const rows = qualified[m[2]];
  return rows && rows.length>pos ? rows[pos].team.code : null;
}
function ko(h, a, st) {
  const {home:hG,away:aG} = simulateMatch(h,a,null,st);
  if (hG!==aG) return hG>aG?h:a;
  const sH=st[h]??65, sA=st[a]??65;
  return Math.random()<sH/(sH+sA)?h:a;
}
function playRound(pairs, prev, st) {
  return pairs.map(([i,j])=>{
    const h=prev[i],a=prev[j];
    if (!h||!a) return h||a||null;
    return ko(h,a,st);
  });
}

// ─── Pre-procesamiento ────────────────────────────────────────────────────────
const STRENGTH_ADJ = recalibrateStrengths(GROUPS, state, STRENGTH);

const fixedResults={}, pendingByGroup={};
for (const g of GROUPS) {
  const gs=state[g.id]||{};
  fixedResults[g.id]={}; pendingByGroup[g.id]=[];
  for (const fix of g.fixtures) {
    const r=gs[fix.id];
    if (r&&r.home!==""&&r.away!==""&&!isNaN(parseInt(r.home))&&!isNaN(parseInt(r.away)))
      fixedResults[g.id][fix.id]=r;
    else pendingByGroup[g.id].push(fix);
  }
}
const fullyFixed={};
for (const g of GROUPS)
  if (!pendingByGroup[g.id].length)
    fullyFixed[g.label]=computeStandings(g.teams,g.fixtures,fixedResults[g.id]);

const simBuf={}, pendBuf={};
for (const g of GROUPS) {
  simBuf[g.id]={...fixedResults[g.id]}; pendBuf[g.id]={};
  for (const fix of pendingByGroup[g.id]) {
    const slot={home:"0",away:"0"};
    simBuf[g.id][fix.id]=slot; pendBuf[g.id][fix.id]=slot;
  }
}

// ─── Acumuladores por ronda ───────────────────────────────────────────────────
// rivals[ronda][rival] = { apariciones, victorias_ARG }
const rounds = ["R32","Octavos","Cuartos","Semis","Final"];
const rivals = {};
for (const r of rounds) rivals[r] = {};

function bump(round, rival, argWon) {
  if (!rivals[round][rival]) rivals[round][rival] = {n:0, wins:0};
  rivals[round][rival].n++;
  if (argWon) rivals[round][rival].wins++;
}

// Cuántas veces ARG llegó a cada ronda (para calcular % de clasificación)
const argReached = {R32:0,Octavos:0,Cuartos:0,Semis:0,Final:0};
let totalIters = 0;

// ─── 100 corridas × 2000 iteraciones ─────────────────────────────────────────
const RUNS=100, ITERS=2000;
process.stderr.write(`Corriendo ${RUNS}×${ITERS} iteraciones...\n`);

for (let run=1; run<=RUNS; run++) {
  process.stderr.write(`  corrida ${run}/${RUNS}\r`);
  for (let i=1; i<=ITERS; i++) {
    totalIters++;

    // Simular pendientes
    for (const g of GROUPS)
      for (const fix of pendingByGroup[g.id]) {
        const venue=STADIUM_COUNTRY[fix.stadium]??"USA";
        const {home,away}=simulateMatch(fix.home,fix.away,venue,STRENGTH_ADJ);
        const slot=pendBuf[g.id][fix.id];
        slot.home=String(home); slot.away=String(away);
      }

    // Clasificados
    const qualified={};
    for (const g of GROUPS)
      qualified[g.label]=(g.label in fullyFixed)
        ?fullyFixed[g.label]
        :computeStandings(g.teams,g.fixtures,simBuf[g.id]);

    // Terceros
    const bestThirds=computeBestThirds(GROUPS,simBuf);
    const comboKey=bestThirds.slice(0,8).map(t=>t.groupLabel).sort().join("");
    const combo=BEST_THIRDS_COMBINATIONS[comboKey]||null;

    // R32
    const r32teams=R32_SEEDS.map(s=>{
      const hCode=resolveSeed(s.home,qualified);
      let aCode;
      if (s.thirdSlot!==null&&combo){const ts=combo[s.thirdSlot]; aCode=ts?resolveSeed(ts,qualified):null;}
      else aCode=resolveSeed(s.away,qualified);
      return {h:hCode,a:aCode};
    });

    // Jugar R32 y detectar rival de ARG
    const r32W = r32teams.map(({h,a})=>{
      if (!h&&!a) return null;
      if (!h) return a;
      if (!a) return h;
      // ¿ARG en este cruce?
      if (h==="ARG"||a==="ARG") {
        argReached.R32++;
        const rival=h==="ARG"?a:h;
        const winner=ko(h,a,STRENGTH_ADJ);
        bump("R32",rival,winner==="ARG");
        return winner;
      }
      return ko(h,a,STRENGTH_ADJ);
    });

    // R16
    const r16W = R16_PAIRS.map(([i,j])=>{
      const h=r32W[i],a=r32W[j];
      if (!h&&!a) return null;
      if (!h) return a;
      if (!a) return h;
      if (h==="ARG"||a==="ARG") {
        argReached.Octavos++;
        const rival=h==="ARG"?a:h;
        const winner=ko(h,a,STRENGTH_ADJ);
        bump("Octavos",rival,winner==="ARG");
        return winner;
      }
      return ko(h,a,STRENGTH_ADJ);
    });

    // QF
    const qfW = QF_PAIRS.map(([i,j])=>{
      const h=r16W[i],a=r16W[j];
      if (!h&&!a) return null;
      if (!h) return a;
      if (!a) return h;
      if (h==="ARG"||a==="ARG") {
        argReached.Cuartos++;
        const rival=h==="ARG"?a:h;
        const winner=ko(h,a,STRENGTH_ADJ);
        bump("Cuartos",rival,winner==="ARG");
        return winner;
      }
      return ko(h,a,STRENGTH_ADJ);
    });

    // SF
    const sfW = SF_PAIRS.map(([i,j])=>{
      const h=qfW[i],a=qfW[j];
      if (!h&&!a) return null;
      if (!h) return a;
      if (!a) return h;
      if (h==="ARG"||a==="ARG") {
        argReached.Semis++;
        const rival=h==="ARG"?a:h;
        const winner=ko(h,a,STRENGTH_ADJ);
        bump("Semis",rival,winner==="ARG");
        return winner;
      }
      return ko(h,a,STRENGTH_ADJ);
    });

    // Final
    const [f1,f2]=sfW;
    if (f1&&f2&&(f1==="ARG"||f2==="ARG")) {
      argReached.Final++;
      const rival=f1==="ARG"?f2:f1;
      const winner=ko(f1,f2,STRENGTH_ADJ);
      bump("Final",rival,winner==="ARG");
    } else if (f1&&f2) {
      ko(f1,f2,STRENGTH_ADJ); // consumir el RNG
    }
  }
}
process.stderr.write("\n");

// ─── OUTPUT ───────────────────────────────────────────────────────────────────
console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(` RIVALES DE ARGENTINA POR RONDA — ${RUNS}×${ITERS} = ${totalIters} iteraciones`);
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(` ARG clasifica a cada ronda en promedio:`);
for (const r of rounds) {
  const pct=((argReached[r]/totalIters)*100).toFixed(1);
  console.log(`   ${r.padEnd(8)}: ${String(argReached[r]).padStart(6)} veces  (${pct}%)`);
}

for (const round of rounds) {
  const reached = argReached[round];
  if (reached===0) { console.log(`\n  ${round}: ARG no llegó en ninguna iteración.`); continue; }

  const sorted = Object.entries(rivals[round])
    .sort((a,b)=>b[1].n-a[1].n);

  console.log(`\n${"─".repeat(71)}`);
  console.log(` ${round.toUpperCase()} — ARG llegó ${reached} veces (${((reached/totalIters)*100).toFixed(1)}% de las iteraciones)`);
  console.log(`${"─".repeat(71)}`);
  console.log(`  RIVAL     APARIC.    % sobre llegadas   ARG ganó   % win`);
  console.log(`  ${"─".repeat(65)}`);
  for (const [rival,{n,wins}] of sorted) {
    const pctN  = ((n/reached)*100).toFixed(1).padStart(5);
    const pctW  = ((wins/n)*100).toFixed(0).padStart(3);
    const str   = STRENGTH[rival]??65;
    const bar   = "█".repeat(Math.round(n/reached*20));
    console.log(`  ${rival.padEnd(6)}   ${String(n).padStart(6)}      ${pctN}%            ${String(wins).padStart(5)}    ${pctW}%   ${bar}`);
  }
}

console.log(`
─────────────────────────────────────────────────────────────────────────────
NOTA: "% sobre llegadas" = frecuencia del rival CUANDO ARG llega a esa ronda.
"% win" = cuántas veces ARG ganó ESE cruce específico.
─────────────────────────────────────────────────────────────────────────────
`);
