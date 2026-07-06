// js/probabilities.js
// Vista de probabilidades — pestaña "Probabilidades".
// Patrón: igual a thirds.js / historia.js (sin frameworks, sin bundler).

import { runMonteCarlo, predCache } from "./predictor.js";
import { TEAMS } from "./teams.js";
import { saveSimulationToFirebase, computeStateHash } from "./storage.js";
import { getFixedBracketResults } from "./bracket.js";

function pct(v) {
  if (v === undefined || v === null) return "–";
  if (v >= 0.995) return "100%";
  if (v < 0.001)  return "<0.1%";
  return (v * 100).toFixed(1) + "%";
}

function buildResultRows(probs) {
  const entries = Object.entries(probs);
  entries.sort((a, b) => b[1].champion - a[1].champion);

  return entries.map(([code, p], idx) => {
    const team = TEAMS[code] || { flag: "", name: code };
    return `
      <tr>
        <td class="pos">${idx + 1}</td>
        <td class="team-cell">
          <span class="flag">${team.flag}</span>
          <span class="team-name">${team.name}</span>
        </td>
        <td class="pct-cell">${pct(p.group)}</td>
        <td class="pct-cell">${pct(p.octavos)}</td>
        <td class="pct-cell">${pct(p.qf)}</td>
        <td class="pct-cell">${pct(p.sf)}</td>
        <td class="pct-cell">${pct(p.final)}</td>
        <td class="pct-cell pct-cell--champion">${pct(p.champion)}</td>
      </tr>`;
  }).join("");
}

export function renderProbabilitiesView(container, GROUPS, state) {
  const { result, stale } = predCache;
  const hasResults = result !== null;

  const staleNotice = (hasResults && stale)
    ? `<div class="prob-stale-banner">
         ⚠ Resultados desactualizados — editaste marcadores desde la última simulación.
         Volvé a simular para actualizar.
       </div>`
    : "";

  const emptyNotice = !hasResults
    ? `<div class="prob-empty-notice">
         ${predCache.restoring
           ? "Cargando simulación guardada…"
           : "No hay simulación ejecutada. Presioná el botón para calcular probabilidades."}
       </div>`
    : "";

  const tableHtml = hasResults
    ? `<div class="standings-wrapper prob-table-wrap">
         <table class="prob-table">
           <thead>
             <tr>
               <th>#</th>
               <th class="team-col">Equipo</th>
               <th title="Probabilidad de avanzar desde la fase de grupos">Clasifica</th>
               <th title="Probabilidad de llegar a octavos de final">Octavos</th>
               <th title="Probabilidad de llegar a cuartos de final">Cuartos</th>
               <th title="Probabilidad de llegar a semifinales">Semis</th>
               <th title="Probabilidad de llegar a la final">Final</th>
               <th title="Probabilidad de ser campeón" class="pct-col--champion">Campeón</th>
             </tr>
           </thead>
           <tbody>
             ${buildResultRows(result)}
           </tbody>
         </table>
       </div>`
    : "";

  container.innerHTML = `
    <div class="prob-container">
      <div class="prob-header">
        <h2 class="prob-title">PROBABILIDADES</h2>
        <p class="prob-subtitle">Simulación Monte Carlo · Poisson · ${2000} iteraciones</p>
      </div>
      ${staleNotice}
      ${emptyNotice}
      <div class="prob-actions">
        <button id="prob-run-btn" type="button" class="btn-prob-run">
          ▶ Correr simulación (2000)
        </button>
      </div>
      ${tableHtml}
    </div>
  `;

  const btn = container.querySelector("#prob-run-btn");
  btn.addEventListener("click", () => {
    btn.disabled = true;
    btn.textContent = "Simulando…";
    // Dar tiempo al navegador para redibujar el estado "Simulando…"
    // antes de bloquear el hilo con el cálculo Monte Carlo.
    setTimeout(() => {
      const probs = runMonteCarlo(GROUPS, state, 2000, null, getFixedBracketResults());
      // Persistir en Firebase + localStorage para recuperar al recargar
      saveSimulationToFirebase({
        probabilities: probs,
        slotDist: predCache.slotDist,
        strengthAdj: predCache.strengthAdj,
        iterations: 2000,
        timestamp: Date.now(),
        stateHash: computeStateHash(state),
      }).catch(e => console.error("[probabilities] saveSimulationToFirebase:", e));
      // Notificar a app.js para que refresque las columnas Prob% en standings
      document.dispatchEvent(new CustomEvent("predictorUpdated"));
      renderProbabilitiesView(container, GROUPS, state);
    }, 0);
  });
}
