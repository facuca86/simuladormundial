// audit_champion_path.mjs — 2 corridas × 2000 iteraciones (= app real)
// node audit_champion_path.mjs

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

// State real al 26/06 21:00 — completos: A B C D E F I | pendiente MD3: G H J K L
const state = {
  groupA: {
    1: {home:"2",away:"0"}, 2: {home:"2",away:"1"},
    25:{home:"1",away:"1"}, 28:{home:"1",away:"0"},
    53:{home:"0",away:"3"}, 54:{home:"1",away:"0"},
  },
  groupB: {
    3: {home:"1",away:"1"}, 8: {home:"1",away:"1"},
    26:{home:"4",away:"1"}, 27:{home:"6",away:"0"},
    51:{home:"2",away:"1"}, 52:{home:"3",away:"1"},
  },
  groupC: {
    7: {home:"1",away:"1"}, 5: {home:"0",away:"1"},
    29:{home:"3",away:"0"}, 30:{home:"0",away:"1"},
    49:{home:"0",away:"3"}, 50:{home:"4",away:"2"},
  },
  groupD: {
    4: {home:"4",away:"1"}, 6: {home:"2",away:"0"},
    31:{home:"0",away:"1"}, 32:{home:"2",away:"0"},
    59:{home:"3",away:"2"}, 60:{home:"0",away:"0"},
  },
  groupE: {
    9: {home:"7",away:"1"}, 10:{home:"1",away:"0"},
    33:{home:"2",away:"1"}, 34:{home:"0",away:"0"},
    55:{home:"0",away:"2"}, 56:{home:"2",away:"1"},
  },
  groupF: {
    11:{home:"2",away:"2"}, 12:{home:"5",away:"1"},
    35:{home:"5",away:"1"}, 36:{home:"0",away:"4"},
    57:{home:"1",away:"1"}, 58:{home:"1",away:"3"},
  },
  groupG: { // MD3 pendiente
    16:{home:"1",away:"1"}, 15:{home:"2",away:"2"},
    39:{home:"0",away:"0"}, 40:{home:"1",away:"3"},
  },
  groupH: { // MD3 pendiente
    14:{home:"0",away:"0"}, 13:{home:"1",away:"1"},
    38:{home:"4",away:"0"}, 37:{home:"2",away:"2"},
  },
  groupI: {
    17:{home:"3",away:"1"}, 18:{home:"1",away:"4"},
    42:{home:"3",away:"0"}, 41:{home:"3",away:"2"},
    61:{home:"1",away:"4"}, 62:{home:"5",away:"0"},
  },
  groupJ: { // MD3 pendiente
    19:{home:"3",away:"0"}, 20:{home:"3",away:"1"},
    43:{home:"2",away:"0"}, 44:{home:"1",away:"2"},
  },
  groupK: { // MD3 pendiente
    23:{home:"1",away:"1"}, 24:{home:"1",away:"3"},
    47:{home:"5",away:"0"}, 48:{home:"1",away:"0"},
  },
  groupL: { // MD3 pendiente
    22:{home:"4",away:"2"}, 21:{home:"1",away:"0"},
    45:{home:"0",away:"0"}, 46:{home:"0",away:"1"},
  },
};

// ─── Bracket (idéntico a predictor.js) ───────────────────────────────────────
const R32_SEEDS = [
  {home:"1E",away:null, thirdSlot:"1E"},{home:"1I",away:null, thirdSlot:"1I"},
  {home:"2A",away:"2B", thirdSlot:null},{home:"1F",away:"2C", thirdSlot:null},
  {home:"2K",away:"2L", thirdSlot:null},{home:"1H",away:"2J", thirdSlot:null},
  {home:"1D",away:null, thirdSlot:"1D"},{home:"1G",away:null, thirdSlot:"1G"},
  {home:"1C",away:"2F", thirdSlot:null},{home:"2E",away:"2I", thirdSlot:null},
  {home:"1A",away:null, thirdSlot:"1A"},{home:"1L",away:null, thirdSlot:"1L"},
  {home:"1J",away:"2H", thirdSlot:null},{home:"2D",away:"2G", thirdSlot:null},
  {home:"1B",away:null, thirdSlot:"1B"},{home:"1K",away:null, thirdSlot:"1K"},
];
const R16_PAIRS = [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13],[14,15]];
const QF_PAIRS  = [[0,1],[2,3],[4,5],[6,7]];
const SF_PAIRS  = [[0,1],[2,3]];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveSeed(seed, qualified) {
  const m = seed.match(/^(\d)([A-L])$/);
  if (!m) return null;
  const pos = parseInt(m[1],10) - 1;
  const rows = qualified[m[2]];
  return rows && rows.length > pos ? rows[pos].team.code : null;
}

function knockoutWithScore(h, a, st) {
  const {home:hG, away:aG} = simulateMatch(h, a, null, st);
  if (hG !== aG) return {winner: hG>aG?h:a, hGoals:hG, aGoals:aG, penalties:false};
  const sH = st[h]??65, sA = st[a]??65;
  return {winner: Math.random()<sH/(sH+sA)?h:a, hGoals:hG, aGoals:aG, penalties:true};
}

function playRound(pairs, prev, st) {
  return pairs.map(([i,j]) => {
    const h=prev[i], a=prev[j];
    if (!h&&!a) return {h:null,a:null,winner:null,hGoals:0,aGoals:0,penalties:false};
    if (!h) return {h:null,a,winner:a,hGoals:0,aGoals:0,penalties:false};
    if (!a) return {h,a:null,winner:h,hGoals:0,aGoals:0,penalties:false};
    return {h,a,...knockoutWithScore(h,a,st)};
  });
}

function pct(p) { return `${(p*100).toFixed(0)}%`; }

function formatMatch(round, champ, h, a, hG, aG, pen, st) {
  const {p1,px,p2} = matchProbabilities(h, a, st);
  const pC = champ===h?p1:p2, pR = champ===h?p2:p1, rival = champ===h?a:h;
  const [cG,rG] = champ===h?[hG,aG]:[aG,hG];
  const tag = pen?" (pen)":"";
  const wow = pC<0.30?" 🔥INSÓLITO":pC<0.35?" ⚡SORPRESA":"";
  return `  ${round.padEnd(8)}: ${champ} ${cG}-${rG} ${rival}${tag}   (${champ} ${pct(pC)} / X ${pct(px)} / ${rival} ${pct(pR)})${wow}`;
}

function buildPath(champion, r32M, r16M, qfM, sfM, finalM) {
  const path = [];
  for (const [round, matches] of [
    ["R32",r32M],["Octavos",r16M],["Cuartos",qfM],["Semis",sfM],["Final",[finalM]]
  ]) {
    const m = matches.find(x=>x.winner===champion && x.h && x.a);
    if (m) path.push({round, match:m});
  }
  return path;
}

function printPath(label, champ, path, groupPos, strength) {
  console.log(`\n══ ${label} — CAMPEÓN: ${champ} (str base ${strength}) — salió ${groupPos} ══`);
  for (const {round,match} of path) {
    console.log(formatMatch(round,champ,match.h,match.a,match.hGoals,match.aGoals,match.penalties,STRENGTH_ADJ));
  }
}

// ─── Pre-procesamiento ────────────────────────────────────────────────────────
const STRENGTH_ADJ = recalibrateStrengths(GROUPS, state, STRENGTH);

const fixedResults={}, pendingByGroup={};
for (const g of GROUPS) {
  const gs = state[g.id]||{};
  fixedResults[g.id]={}; pendingByGroup[g.id]=[];
  for (const fix of g.fixtures) {
    const r=gs[fix.id];
    if (r&&r.home!==""&&r.away!==""&&!isNaN(parseInt(r.home))&&!isNaN(parseInt(r.away))) {
      fixedResults[g.id][fix.id]=r;
    } else pendingByGroup[g.id].push(fix);
  }
}
const fullyFixed={};
for (const g of GROUPS) {
  if (!pendingByGroup[g.id].length)
    fullyFixed[g.label]=computeStandings(g.teams,g.fixtures,fixedResults[g.id]);
}
const simBuf={}, pendBuf={};
for (const g of GROUPS) {
  simBuf[g.id]={...fixedResults[g.id]}; pendBuf[g.id]={};
  for (const fix of pendingByGroup[g.id]) {
    const slot={home:"0",away:"0"};
    simBuf[g.id][fix.id]=slot; pendBuf[g.id][fix.id]=slot;
  }
}

// ─── Motor de una iteración — devuelve campeón + path + pos ──────────────────
function runIteration() {
  for (const g of GROUPS)
    for (const fix of pendingByGroup[g.id]) {
      const venue=STADIUM_COUNTRY[fix.stadium]??"USA";
      const {home,away}=simulateMatch(fix.home,fix.away,venue,STRENGTH_ADJ);
      const slot=pendBuf[g.id][fix.id];
      slot.home=String(home); slot.away=String(away);
    }

  const qualified={};
  for (const g of GROUPS)
    qualified[g.label]=(g.label in fullyFixed)
      ?fullyFixed[g.label]
      :computeStandings(g.teams,g.fixtures,simBuf[g.id]);

  const bestThirds=computeBestThirds(GROUPS,simBuf);
  const top8=bestThirds.slice(0,8);
  const comboKey=top8.map(t=>t.groupLabel).sort().join("");
  const combo=BEST_THIRDS_COMBINATIONS[comboKey]||null;

  const r32=R32_SEEDS.map(s=>{
    const hCode=resolveSeed(s.home,qualified);
    let aCode;
    if (s.thirdSlot!==null&&combo) {
      const ts=combo[s.thirdSlot];
      aCode=ts?resolveSeed(ts,qualified):null;
    } else aCode=resolveSeed(s.away,qualified);
    return {h:hCode,a:aCode};
  });

  const r32M=r32.map(({h,a})=>{
    if (!h&&!a) return {h:null,a:null,winner:null,hGoals:0,aGoals:0,penalties:false};
    if (!h) return {h:null,a,winner:a,hGoals:0,aGoals:0,penalties:false};
    if (!a) return {h,a:null,winner:h,hGoals:0,aGoals:0,penalties:false};
    return {h,a,...knockoutWithScore(h,a,STRENGTH_ADJ)};
  });
  const r32W=r32M.map(m=>m.winner);
  const r16M=playRound(R16_PAIRS,r32W,STRENGTH_ADJ);
  const r16W=r16M.map(m=>m.winner);
  const qfM=playRound(QF_PAIRS,r16W,STRENGTH_ADJ);
  const qfW=qfM.map(m=>m.winner);
  const sfM=playRound(SF_PAIRS,qfW,STRENGTH_ADJ);
  const sfW=sfM.map(m=>m.winner);
  const [f1,f2]=sfW;
  let finalM={h:null,a:null,winner:null,hGoals:0,aGoals:0,penalties:false};
  if (f1&&f2) finalM={h:f1,a:f2,...knockoutWithScore(f1,f2,STRENGTH_ADJ)};

  const champion=finalM.winner||f1||f2;
  if (!champion) return null;

  const champGroup=GROUPS.find(g=>g.teams.includes(champion));
  const groupPos=champGroup
    ?`${qualified[champGroup.label].findIndex(r=>r.team.code===champion)+1}°Gr.${champGroup.label}`
    :"?";

  const path=buildPath(champion,r32M,r16M,qfM,sfM,finalM);
  return {champion, path, groupPos};
}

// ─── 2 CORRIDAS × 2000 iteraciones ───────────────────────────────────────────
const ITERS = 2000;
const RUNS  = 2;

const totalCount={};
const argPaths=[];
const insoliPaths={};  // equipos con str base < 72

// Guardar últimos resultados de cada corrida para mostrar
const lastOfRun=[];

for (let run=1; run<=RUNS; run++) {
  let lastResult=null;
  for (let i=1; i<=ITERS; i++) {
    const res=runIteration();
    if (!res) continue;
    const {champion,path,groupPos}=res;
    totalCount[champion]=(totalCount[champion]||0)+1;

    if (champion==="ARG" && argPaths.length<5)
      argPaths.push({run,iter:i,path,groupPos});

    const str=STRENGTH[champion]??65;
    if (str<72) {
      if (!insoliPaths[champion]) insoliPaths[champion]=[];
      if (insoliPaths[champion].length<3)
        insoliPaths[champion].push({run,iter:i,path,groupPos});
    }

    lastResult=res;
    lastResult.iter=i;
    lastResult.run=run;
  }
  if (lastResult) lastOfRun.push(lastResult);
}

const grandTotal=Object.values(totalCount).reduce((s,n)=>s+n,0);

// ─── OUTPUT ───────────────────────────────────────────────────────────────────
console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(` AUDITORÍA MONTE CARLO — ${RUNS} corridas × ${ITERS} its = ${grandTotal} iteraciones totales`);
console.log(" State real al 26/06 21:00 | STRENGTH_ADJ calibrado con resultados reales");
console.log("═══════════════════════════════════════════════════════════════════════\n");

// ── Campeón de la última iteración de cada corrida ────────────────────────────
console.log("── ÚLTIMO CAMPEÓN DE CADA CORRIDA ──────────────────────────────────────");
for (const {run,iter,champion,path,groupPos} of lastOfRun) {
  printPath(`Corrida ${run} — iter ${iter}`, champion, path, groupPos, STRENGTH[champion]??65);
}

// ── Tabla consolidada ─────────────────────────────────────────────────────────
console.log("\n");
console.log("── TABLA CONSOLIDADA (" + grandTotal + " iteraciones) ────────────────────────────");
console.log("  EQUIPO  TÍTULOS    %      BARRA");
console.log("  ──────────────────────────────────────────────────────────────────");

const sorted=Object.entries(totalCount).sort((a,b)=>b[1]-a[1]);
for (const [code,n] of sorted) {
  const p=(n/grandTotal*100).toFixed(1).padStart(5);
  const str=STRENGTH[code]??65;
  const flag=str<72?" ←insólito":"";
  const bar="█".repeat(Math.round(n/grandTotal*50));
  console.log(`  ${code.padEnd(6)} ${String(n).padStart(5)}    ${p}%   ${bar}${flag}`);
}

// ── Caminos de Argentina ──────────────────────────────────────────────────────
const argTotal=totalCount["ARG"]||0;
console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(` ARGENTINA — ganó ${argTotal}/${grandTotal} iteraciones (${(argTotal/grandTotal*100).toFixed(1)}%)`);
console.log("═══════════════════════════════════════════════════════════════════════");
if (argPaths.length===0) {
  console.log("  ARG no ganó ninguna iteración registrada.");
} else {
  for (const {run,iter,path,groupPos} of argPaths.slice(0,3)) {
    printPath(`Corrida ${run} iter ${iter}`, "ARG", path, groupPos, STRENGTH["ARG"]);
  }
}

// ── Campeones insólitos ───────────────────────────────────────────────────────
const insoliSorted=Object.entries(insoliPaths)
  .map(([code,paths])=>({code,n:totalCount[code]||0,paths}))
  .sort((a,b)=>b.n-a.n);

console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(" CAMPEONES INSÓLITOS (fuerza base < 72)");
if (insoliSorted.length===0) {
  console.log(" Ningún equipo con str<72 ganó en estas " + grandTotal + " iteraciones.");
} else {
  const topInsoli=insoliSorted[0];
  console.log(` Más repetido: ${topInsoli.code} (str ${STRENGTH[topInsoli.code]??65}) — ganó ${topInsoli.n} veces`);
  console.log("═══════════════════════════════════════════════════════════════════════");
  for (const {code,n,paths} of insoliSorted) {
    const str=STRENGTH[code]??65;
    console.log(`\n  ${code} (str base ${str}) — ${n} título(s)`);
    for (const {run,iter,path,groupPos} of paths.slice(0,2)) {
      printPath(`  Corrida ${run} iter ${iter}`, code, path, groupPos, str);
    }
  }
}

console.log(`
─────────────────────────────────────────────────────────────────────────────
NOTA
El campeón de cada iteración sale del azar Poisson ponderado por STRENGTH_ADJ
(fuerzas recalibradas con los resultados reales). 🔥INSÓLITO = ganó ese cruce
con <30% de probabilidad previa. ⚡SORPRESA = ganó con <35%.
─────────────────────────────────────────────────────────────────────────────
`);
