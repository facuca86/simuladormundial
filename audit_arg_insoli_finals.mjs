// audit_arg_insoli_finals.mjs
// Busca iteraciones específicas donde equipos insólitos llegaron a la final vs ARG
// y en particular donde esos equipos LE GANARON a Argentina.
// node audit_arg_insoli_finals.mjs

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
const R16_PAIRS=[[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13],[14,15]];
const QF_PAIRS =[[0,1],[2,3],[4,5],[6,7]];
const SF_PAIRS =[[0,1],[2,3]];

function resolveSeed(seed,q){
  const m=seed.match(/^(\d)([A-L])$/); if(!m)return null;
  const rows=q[m[2]]; const pos=parseInt(m[1],10)-1;
  return rows&&rows.length>pos?rows[pos].team.code:null;
}
function koScore(h,a,st){
  const {home:hG,away:aG}=simulateMatch(h,a,null,st);
  if(hG!==aG)return{winner:hG>aG?h:a,hGoals:hG,aGoals:aG,penalties:false};
  const sH=st[h]??65,sA=st[a]??65;
  return{winner:Math.random()<sH/(sH+sA)?h:a,hGoals:hG,aGoals:aG,penalties:true};
}
function playRound(pairs,prev,st){
  return pairs.map(([i,j])=>{
    const h=prev[i],a=prev[j];
    if(!h&&!a)return{h:null,a:null,winner:null,hGoals:0,aGoals:0,penalties:false};
    if(!h)return{h:null,a,winner:a,hGoals:0,aGoals:0,penalties:false};
    if(!a)return{h,a:null,winner:h,hGoals:0,aGoals:0,penalties:false};
    return{h,a,...koScore(h,a,st)};
  });
}
function pct(p){return`${(p*100).toFixed(0)}%`;}
function fmtMatch(round,champ,h,a,hG,aG,pen,st){
  const{p1,px,p2}=matchProbabilities(h,a,st);
  const pC=champ===h?p1:p2,pR=champ===h?p2:p1,rival=champ===h?a:h;
  const[cG,rG]=champ===h?[hG,aG]:[aG,hG];
  const tag=pen?" (pen)":"";
  const wow=pC<0.30?" 🔥INSÓLITO":pC<0.35?" ⚡SORPRESA":"";
  return`  ${round.padEnd(8)}: ${champ} ${cG}-${rG} ${rival}${tag}   (${champ} ${pct(pC)} / X ${pct(px)} / ${rival} ${pct(pR)})${wow}`;
}

// ─── Pre-procesamiento ────────────────────────────────────────────────────────
const STRENGTH_ADJ=recalibrateStrengths(GROUPS,state,STRENGTH);
const fixedResults={},pendingByGroup={};
for(const g of GROUPS){
  const gs=state[g.id]||{};fixedResults[g.id]={};pendingByGroup[g.id]=[];
  for(const fix of g.fixtures){
    const r=gs[fix.id];
    if(r&&r.home!==""&&r.away!==""&&!isNaN(parseInt(r.home))&&!isNaN(parseInt(r.away)))
      fixedResults[g.id][fix.id]=r;
    else pendingByGroup[g.id].push(fix);
  }
}
const fullyFixed={};
for(const g of GROUPS)
  if(!pendingByGroup[g.id].length)
    fullyFixed[g.label]=computeStandings(g.teams,g.fixtures,fixedResults[g.id]);
const simBuf={},pendBuf={};
for(const g of GROUPS){
  simBuf[g.id]={...fixedResults[g.id]};pendBuf[g.id]={};
  for(const fix of pendingByGroup[g.id]){
    const slot={home:"0",away:"0"};
    simBuf[g.id][fix.id]=slot;pendBuf[g.id][fix.id]=slot;
  }
}

// Equipos objetivo: insólitos que nos interesan, ordenados por fuerza (menor = más insólito)
// Busco: el que llegó a final vs ARG (cualquiera), y el que LE GANÓ a ARG
const TARGETS_FINAL   = new Set(["CPV","KSA","COD","SCO"]);  // aparecieron en final vs ARG
const TARGETS_BEAT    = new Set(["CPV","KSA","COD"]);         // le ganaron a ARG

// Qué quiero encontrar:
//   found_final[team]  = primera iteración donde llegó a final vs ARG
//   found_beat[team]   = primera iteración donde LE GANÓ a ARG en final
const found_final={}, found_beat={};
// Caminos del insólito para esa iteración
const paths_final={}, paths_beat={};

function runOne(){
  for(const g of GROUPS)
    for(const fix of pendingByGroup[g.id]){
      const venue=STADIUM_COUNTRY[fix.stadium]??"USA";
      const{home,away}=simulateMatch(fix.home,fix.away,venue,STRENGTH_ADJ);
      const slot=pendBuf[g.id][fix.id];
      slot.home=String(home);slot.away=String(away);
    }
  const qualified={};
  for(const g of GROUPS)
    qualified[g.label]=(g.label in fullyFixed)
      ?fullyFixed[g.label]
      :computeStandings(g.teams,g.fixtures,simBuf[g.id]);
  const bestThirds=computeBestThirds(GROUPS,simBuf);
  const comboKey=bestThirds.slice(0,8).map(t=>t.groupLabel).sort().join("");
  const combo=BEST_THIRDS_COMBINATIONS[comboKey]||null;

  const r32=R32_SEEDS.map(s=>{
    const hCode=resolveSeed(s.home,qualified);
    let aCode;
    if(s.thirdSlot!==null&&combo){const ts=combo[s.thirdSlot];aCode=ts?resolveSeed(ts,qualified):null;}
    else aCode=resolveSeed(s.away,qualified);
    return{h:hCode,a:aCode};
  });
  const r32M=r32.map(({h,a})=>{
    if(!h&&!a)return{h:null,a:null,winner:null,hGoals:0,aGoals:0,penalties:false};
    if(!h)return{h:null,a,winner:a,hGoals:0,aGoals:0,penalties:false};
    if(!a)return{h,a:null,winner:h,hGoals:0,aGoals:0,penalties:false};
    return{h,a,...koScore(h,a,STRENGTH_ADJ)};
  });
  const r32W=r32M.map(m=>m.winner);
  const r16M=playRound(R16_PAIRS,r32W,STRENGTH_ADJ);
  const qfM =playRound(QF_PAIRS, r16M.map(m=>m.winner),STRENGTH_ADJ);
  const sfM =playRound(SF_PAIRS, qfM.map(m=>m.winner),STRENGTH_ADJ);
  const[f1,f2]=sfM.map(m=>m.winner);
  if(!f1||!f2)return null;
  const finalM={h:f1,a:f2,...koScore(f1,f2,STRENGTH_ADJ)};

  // ¿Hay ARG en la final?
  if(f1!=="ARG"&&f2!=="ARG")return null;
  const insoli=f1==="ARG"?f2:f1;
  if(!TARGETS_FINAL.has(insoli))return null;

  // Construir path del insólito
  const allRounds=[["R32",r32M],["Octavos",r16M],["Cuartos",qfM],["Semis",sfM],["Final",[finalM]]];
  const path=allRounds.map(([round,matches])=>{
    const m=matches.find(x=>x.winner===insoli&&x.h&&x.a);
    return m?{round,match:m}:null;
  }).filter(Boolean);

  const champGroup=GROUPS.find(g=>g.teams.includes(insoli));
  const groupPos=champGroup
    ?`${qualified[champGroup.label].findIndex(r=>r.team.code===insoli)+1}°Gr.${champGroup.label}`:"?";

  return{insoli,winner:finalM.winner,path,groupPos,finalMatch:finalM};
}

// Buscar hasta encontrar ejemplos de todos los targets
// Límite: 5.000.000 iteraciones (debería alcanzar con mucho margen)
const MAX=5_000_000;
let iter=0;
const needed_final=new Set(TARGETS_FINAL);
const needed_beat =new Set(TARGETS_BEAT);

process.stderr.write("Buscando finales insólitas vs ARG...\n");
while(iter<MAX&&(needed_final.size>0||needed_beat.size>0)){
  iter++;
  const res=runOne();
  if(!res)continue;
  const{insoli,winner,path,groupPos,finalMatch}=res;

  if(needed_final.has(insoli)){
    found_final[insoli]={iter,path,groupPos,winner,finalMatch};
    paths_final[insoli]={iter,path,groupPos,winner,finalMatch};
    needed_final.delete(insoli);
    process.stderr.write(`  ✓ Final vs ARG encontrada: ${insoli} — iter ${iter}\n`);
  }
  if(needed_beat.has(insoli)&&winner===insoli){
    found_beat[insoli]={iter,path,groupPos,winner,finalMatch};
    paths_beat[insoli]={iter,path,groupPos,winner,finalMatch};
    needed_beat.delete(insoli);
    process.stderr.write(`  🔥 ${insoli} LE GANÓ a ARG en la final! — iter ${iter}\n`);
  }
}
process.stderr.write(`Total iteraciones: ${iter}\n`);

// ─── OUTPUT ───────────────────────────────────────────────────────────────────
function printFullPath(label,team,{path,groupPos,finalMatch,winner}){
  const str=STRENGTH[team]??65;
  console.log(`\n══ ${label} ══`);
  console.log(`   ${team} (str base ${str}) — salió ${groupPos} — ${winner===team?"CAMPEÓN 🏆":"perdió la final"}`);
  for(const{round,match}of path){
    console.log(fmtMatch(round,team,match.h,match.a,match.hGoals,match.aGoals,match.penalties,STRENGTH_ADJ));
  }
  // Marcar la final explícitamente con ARG
  const{h,a,hGoals,aGoals,penalties}=finalMatch;
  const argGoals=h==="ARG"?hGoals:aGoals, teamGoals=h===team?hGoals:aGoals;
  const{p1,px,p2}=matchProbabilities(h,a,STRENGTH_ADJ);
  const pTeam=h===team?p1:p2, pArg=h==="ARG"?p1:p2;
  const pen=penalties?" (pen)":"";
  const wow=pTeam<0.30?" 🔥INSÓLITO":pTeam<0.35?" ⚡SORPRESA":"";
  console.log(`  ${"Final".padEnd(8)}: ${team} ${teamGoals}-${argGoals} ARG${pen}   (${team} ${pct(pTeam)} / X ${pct(px)} / ARG ${pct(pArg)})${wow}`);
}

console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(" FINALISTAS MÁS INSÓLITOS QUE ENFRENTARON A ARGENTINA");
console.log(" (ordenados por fuerza base — menor str = más insólito)");
console.log("═══════════════════════════════════════════════════════════════════════");

// Ordenar por str ascendente (más insólito primero)
const byStr=(a,b)=>(STRENGTH[a]??65)-(STRENGTH[b]??65);
const finalTeams=Object.keys(found_final).sort(byStr);

for(const team of finalTeams){
  printFullPath(`FINAL vs ARG — ${team} (str ${STRENGTH[team]??65}) — iter ${found_final[team].iter}`,
    team, found_final[team]);
}

console.log("\n");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(" FINALISTAS INSÓLITOS QUE LE GANARON A ARGENTINA");
console.log(" (ordenados por fuerza base — menor str = más insólito ganador)");
console.log("═══════════════════════════════════════════════════════════════════════");

const beatTeams=Object.keys(found_beat).sort(byStr);
if(beatTeams.length===0){
  console.log("  No se encontró ningún equipo insólito que le ganara a ARG en la final.");
} else {
  for(const team of beatTeams){
    printFullPath(`${team} CAMPEÓN — LE GANÓ A ARG en la final — iter ${found_beat[team].iter}`,
      team, found_beat[team]);
  }
}

// Tabla resumen
console.log("\n");
console.log("── TABLA RESUMEN DE FINALES INSÓLITAS VS ARG ──────────────────────────");
console.log("  Equipo   Str   Iters buscadas para encontrar 1ª final vs ARG");
console.log("  ───────────────────────────────────────────────────────────");
for(const team of [...finalTeams].sort(byStr)){
  const f=found_final[team];
  const b=found_beat[team];
  const won=b?`le ganó en iter ${b.iter}`:"no le ganó";
  console.log(`  ${team.padEnd(6)}   ${STRENGTH[team]??65}    encontrado en iter ${f.iter}  |  ${won}`);
}
console.log(`\n  Total iteraciones ejecutadas: ${iter.toLocaleString()}`);
