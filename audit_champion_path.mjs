// audit_champion_path.mjs — 100 corridas × 2000 iteraciones
// De cada corrida se guarda SOLO el último campeón (iter 2000).
// La tabla y los caminos se construyen con esos 100 resultados.
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

const state = {
  groupA: { 1:{home:"2",away:"0"},2:{home:"2",away:"1"},25:{home:"1",away:"1"},28:{home:"1",away:"0"},53:{home:"0",away:"3"},54:{home:"1",away:"0"} },
  groupB: { 3:{home:"1",away:"1"},8:{home:"1",away:"1"},26:{home:"4",away:"1"},27:{home:"6",away:"0"},51:{home:"2",away:"1"},52:{home:"3",away:"1"} },
  groupC: { 7:{home:"1",away:"1"},5:{home:"0",away:"1"},29:{home:"3",away:"0"},30:{home:"0",away:"1"},49:{home:"0",away:"3"},50:{home:"4",away:"2"} },
  groupD: { 4:{home:"4",away:"1"},6:{home:"2",away:"0"},31:{home:"0",away:"1"},32:{home:"2",away:"0"},59:{home:"3",away:"2"},60:{home:"0",away:"0"} },
  groupE: { 9:{home:"7",away:"1"},10:{home:"1",away:"0"},33:{home:"2",away:"1"},34:{home:"0",away:"0"},55:{home:"0",away:"2"},56:{home:"2",away:"1"} },
  groupF: { 11:{home:"2",away:"2"},12:{home:"5",away:"1"},35:{home:"5",away:"1"},36:{home:"0",away:"4"},57:{home:"1",away:"1"},58:{home:"1",away:"3"} },
  groupG: { 16:{home:"1",away:"1"},15:{home:"2",away:"2"},39:{home:"0",away:"0"},40:{home:"1",away:"3"} },   // MD3 pendiente
  groupH: { 14:{home:"0",away:"0"},13:{home:"1",away:"1"},38:{home:"4",away:"0"},37:{home:"2",away:"2"} },   // MD3 pendiente
  groupI: { 17:{home:"3",away:"1"},18:{home:"1",away:"4"},42:{home:"3",away:"0"},41:{home:"3",away:"2"},61:{home:"1",away:"4"},62:{home:"5",away:"0"} },
  groupJ: { 19:{home:"3",away:"0"},20:{home:"3",away:"1"},43:{home:"2",away:"0"},44:{home:"1",away:"2"} },   // MD3 pendiente
  groupK: { 23:{home:"1",away:"1"},24:{home:"1",away:"3"},47:{home:"5",away:"0"},48:{home:"1",away:"0"} },   // MD3 pendiente
  groupL: { 22:{home:"4",away:"2"},21:{home:"1",away:"0"},45:{home:"0",away:"0"},46:{home:"0",away:"1"} },   // MD3 pendiente
};

// ─── Bracket ──────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveSeed(seed, qualified) {
  const m = seed.match(/^(\d)([A-L])$/);
  if (!m) return null;
  const pos = parseInt(m[1],10)-1;
  const rows = qualified[m[2]];
  return rows && rows.length>pos ? rows[pos].team.code : null;
}
function ko(h, a, st) {
  const {home:hG,away:aG} = simulateMatch(h,a,null,st);
  if (hG!==aG) return {winner:hG>aG?h:a,hGoals:hG,aGoals:aG,penalties:false};
  const sH=st[h]??65, sA=st[a]??65;
  return {winner:Math.random()<sH/(sH+sA)?h:a,hGoals:hG,aGoals:aG,penalties:true};
}
function playRound(pairs, prev, st) {
  return pairs.map(([i,j])=>{
    const h=prev[i],a=prev[j];
    if (!h&&!a) return {h:null,a:null,winner:null,hGoals:0,aGoals:0,penalties:false};
    if (!h) return {h:null,a,winner:a,hGoals:0,aGoals:0,penalties:false};
    if (!a) return {h,a:null,winner:h,hGoals:0,aGoals:0,penalties:false};
    return {h,a,...ko(h,a,st)};
  });
}
function pct(p){return `${(p*100).toFixed(0)}%`;}
function fmtMatch(round, champ, h, a, hG, aG, pen, st) {
  const {p1,px,p2}=matchProbabilities(h,a,st);
  const pC=champ===h?p1:p2, pR=champ===h?p2:p1, rival=champ===h?a:h;
  const [cG,rG]=champ===h?[hG,aG]:[aG,hG];
  const tag=pen?" (pen)":"";
  const wow=pC<0.30?" 🔥INSÓLITO":pC<0.35?" ⚡SORPRESA":"";
  return `  ${round.padEnd(8)}: ${champ} ${cG}-${rG} ${rival}${tag}   (${champ} ${pct(pC)} / X ${pct(px)} / ${rival} ${pct(pR)})${wow}`;
}
function printPath(label, champ, path, groupPos) {
  const str=STRENGTH[champ]??65;
  console.log(`\n══ ${label} — CAMPEÓN: ${champ} (str ${str}) — salió ${groupPos} ══`);
  for (const {round,match} of path)
    if (match.h&&match.a)
      console.log(fmtMatch(round,champ,match.h,match.a,match.hGoals,match.aGoals,match.penalties,STRENGTH_ADJ));
}

// ─── Pre-procesamiento (UNA sola vez) ────────────────────────────────────────
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

// ─── Una iteración completa → campeón + path ─────────────────────────────────
function runOne() {
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
  const comboKey=bestThirds.slice(0,8).map(t=>t.groupLabel).sort().join("");
  const combo=BEST_THIRDS_COMBINATIONS[comboKey]||null;

  const r32=R32_SEEDS.map(s=>{
    const hCode=resolveSeed(s.home,qualified);
    let aCode;
    if (s.thirdSlot!==null&&combo){const ts=combo[s.thirdSlot]; aCode=ts?resolveSeed(ts,qualified):null;}
    else aCode=resolveSeed(s.away,qualified);
    return {h:hCode,a:aCode};
  });
  const r32M=r32.map(({h,a})=>{
    if (!h&&!a) return {h:null,a:null,winner:null,hGoals:0,aGoals:0,penalties:false};
    if (!h) return {h:null,a,winner:a,hGoals:0,aGoals:0,penalties:false};
    if (!a) return {h,a:null,winner:h,hGoals:0,aGoals:0,penalties:false};
    return {h,a,...ko(h,a,STRENGTH_ADJ)};
  });
  const r32W=r32M.map(m=>m.winner);
  const r16M=playRound(R16_PAIRS,r32W,STRENGTH_ADJ);
  const qfM =playRound(QF_PAIRS, r16M.map(m=>m.winner),STRENGTH_ADJ);
  const sfM =playRound(SF_PAIRS, qfM.map(m=>m.winner), STRENGTH_ADJ);
  const [f1,f2]=sfM.map(m=>m.winner);
  let finalM={h:null,a:null,winner:null,hGoals:0,aGoals:0,penalties:false};
  if (f1&&f2) finalM={h:f1,a:f2,...ko(f1,f2,STRENGTH_ADJ)};

  const champion=finalM.winner||f1||f2;
  if (!champion) return null;

  const champGroup=GROUPS.find(g=>g.teams.includes(champion));
  const groupPos=champGroup
    ?`${qualified[champGroup.label].findIndex(r=>r.team.code===champion)+1}°Gr.${champGroup.label}`:"?";

  const allRounds=[["R32",r32M],["Octavos",r16M],["Cuartos",qfM],["Semis",sfM],["Final",[finalM]]];
  const path=allRounds.map(([round,matches])=>{
    const m=matches.find(x=>x.winner===champion&&x.h&&x.a);
    return m?{round,match:m}:null;
  }).filter(Boolean);

  return {champion,path,groupPos};
}

// ─── 100 corridas × 2000 iteraciones ─────────────────────────────────────────
const RUNS=100, ITERS=2000;

// Tabla: 100 últimos campeones (uno por corrida)
const lastChampCount={};
const lastChampPaths=[];   // [{run, champion, path, groupPos}]

// Acumulador de paths para mostrar: ARG e insólitos (de entre los últimos 100)
const argPaths=[];
const insoliPaths={};  // str<72

process.stderr.write(`Corriendo ${RUNS} corridas × ${ITERS} iteraciones...\n`);

for (let run=1; run<=RUNS; run++) {
  let last=null;
  for (let i=1; i<=ITERS; i++) {
    last=runOne();
  }
  if (!last) continue;

  process.stderr.write(`  Corrida ${run}/${RUNS}: último campeón = ${last.champion}\n`);

  const {champion,path,groupPos}=last;
  lastChampCount[champion]=(lastChampCount[champion]||0)+1;
  lastChampPaths.push({run,champion,path,groupPos});

  if (champion==="ARG" && argPaths.length<4) argPaths.push({run,path,groupPos});

  const str=STRENGTH[champion]??65;
  if (str<72) {
    if (!insoliPaths[champion]) insoliPaths[champion]=[];
    if (insoliPaths[champion].length<2) insoliPaths[champion].push({run,path,groupPos});
  }
}

// ─── OUTPUT ───────────────────────────────────────────────────────────────────
console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(` AUDITORÍA — ${RUNS} corridas × ${ITERS} iteraciones`);
console.log(` Tabla = último campeón de cada corrida (${RUNS} muestras independientes)`);
console.log("═══════════════════════════════════════════════════════════════════════\n");

// ── Tabla de los 100 últimos campeones ────────────────────────────────────────
const sorted=Object.entries(lastChampCount).sort((a,b)=>b[1]-a[1]);
const total=sorted.reduce((s,[,n])=>s+n,0);

console.log("  #   EQUIPO   VECES    %     BARRA (cada █ = 1 corrida)");
console.log("  ────────────────────────────────────────────────────────────────");
let rank=1;
for (const [code,n] of sorted) {
  const str=STRENGTH[code]??65;
  const flag=str<72?" ←insólito":"";
  const bar="█".repeat(n);
  console.log(`  ${String(rank).padStart(2)}. ${code.padEnd(5)}   ${String(n).padStart(3)}    ${((n/total)*100).toFixed(0).padStart(3)}%   ${bar}${flag}`);
  rank++;
}
console.log(`\n  Total corridas: ${total} | Campeones distintos: ${sorted.length}`);

// ── Lista de los 100 últimos campeones en orden de corrida ───────────────────
console.log("\n── SECUENCIA DE ÚLTIMOS CAMPEONES (corrida 1→100) ─────────────────────");
const seq=lastChampPaths.map(({run,champion})=>`${run}:${champion}`);
// Mostrar en filas de 10
for (let i=0;i<seq.length;i+=10)
  console.log("  "+seq.slice(i,i+10).map(s=>s.padEnd(10)).join(" "));

// ── Caminos de Argentina ──────────────────────────────────────────────────────
console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
const argN=lastChampCount["ARG"]||0;
console.log(` ARGENTINA — ganó ${argN} de las ${RUNS} últimas corridas`);
console.log("═══════════════════════════════════════════════════════════════════════");
if (argPaths.length===0) {
  console.log("  ARG no fue el último campeón en ninguna de las 100 corridas.");
} else {
  for (const {run,path,groupPos} of argPaths)
    printPath(`Corrida ${run}`, "ARG", path, groupPos);
}

// ── Campeones insólitos ───────────────────────────────────────────────────────
const insoliSorted=Object.entries(insoliPaths)
  .map(([code,paths])=>({code,n:lastChampCount[code]||0,paths,str:STRENGTH[code]??65}))
  .sort((a,b)=>b.n-a.n);

console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(" CAMPEONES INSÓLITOS en las últimas corridas (str base < 72)");
console.log("═══════════════════════════════════════════════════════════════════════");
if (insoliSorted.length===0) {
  console.log("  Ningún equipo con str<72 fue el último campeón en estas 100 corridas.");
} else {
  const top=insoliSorted[0];
  console.log(` Más frecuente: ${top.code} (str ${top.str}) — ganó ${top.n} corridas\n`);
  for (const {code,n,paths,str} of insoliSorted) {
    console.log(`  ${code} (str ${str}) — ${n} corrida(s)`);
    for (const {run,path,groupPos} of paths)
      printPath(`  Corrida ${run}`, code, path, groupPos);
    console.log();
  }
}

console.log(`
─────────────────────────────────────────────────────────────────────────────
NOTA: cada corrida corre 2000 iteraciones completas y se registra solo
el campeón de la iteración 2000. Las 100 muestras son independientes.
🔥INSÓLITO = ganó con <30% · ⚡SORPRESA = ganó con <35%
─────────────────────────────────────────────────────────────────────────────
`);
