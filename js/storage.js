// Capa de persistencia sobre localStorage.
// Cada grupo usa su propia clave para evitar colisiones al escalar.

const KEYS = {
  groupA: "worldcup2026_groupA"
};

/**
 * Guarda los resultados de un grupo.
 * @param {"groupA"} group
 * @param {Object} results  - { [fixtureId]: { home: string, away: string } }
 */
export function saveResults(group, results) {
  localStorage.setItem(KEYS[group], JSON.stringify(results));
}

/**
 * Carga los resultados guardados de un grupo.
 * @param {"groupA"} group
 * @returns {Object} Resultados o {} si no hay nada guardado
 */
export function loadResults(group) {
  try {
    const raw = localStorage.getItem(KEYS[group]);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Borra los resultados de un grupo del localStorage.
 * @param {"groupA"} group
 */
export function clearResults(group) {
  localStorage.removeItem(KEYS[group]);
}
