// Capa de persistencia sobre localStorage.
// Usa un prefijo común para evitar colisiones con otras apps en el mismo origen.
// Las claves resultantes son: worldcup2026_groupA, worldcup2026_groupB, …
// — compatibles con los datos guardados por versiones anteriores del Grupo A.

const PREFIX = "worldcup2026_";

/**
 * Guarda los resultados de un grupo.
 * @param {string} groupId  - Identificador del grupo (ej. "groupA")
 * @param {Object} results  - { [fixtureId]: { home: string, away: string } }
 */
export function saveResults(groupId, results) {
  localStorage.setItem(PREFIX + groupId, JSON.stringify(results));
}

/**
 * Carga los resultados guardados de un grupo.
 * @param {string} groupId
 * @returns {Object} Resultados o {} si no hay datos guardados
 */
export function loadResults(groupId) {
  try {
    const raw = localStorage.getItem(PREFIX + groupId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Borra los resultados de un grupo del localStorage.
 * @param {string} groupId
 */
export function clearResults(groupId) {
  localStorage.removeItem(PREFIX + groupId);
}
