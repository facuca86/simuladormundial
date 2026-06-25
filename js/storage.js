// Persistencia con Firebase Firestore (fallback a localStorage si Firebase no está disponible).

const PREFIX = "worldcup2026_";
const SIM_LS_KEY  = PREFIX + "simulation_latest";
const SIM_FS_PATH = "simulador/mundial2026/simulations/latest";

let _firebasePromise = null;

function getFirebase() {
  if (_firebasePromise) return _firebasePromise;
  _firebasePromise = (async () => {
    try {
      const [{ db }, { doc, setDoc, getDoc, deleteDoc }] = await Promise.all([
        import("./firebase_config.js"),
        import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
      ]);
      return { db, doc, setDoc, getDoc, deleteDoc };
    } catch {
      return null;
    }
  })();
  return _firebasePromise;
}

function firestorePath(groupId) {
  // Datos compartidos: un único simulador para todos.
  return `simulador/mundial2026/resultados/${groupId}`;
}

/**
 * Guarda los resultados de un grupo.
 * Persiste en localStorage de inmediato y en Firebase en segundo plano.
 */
export function saveResults(groupId, results) {
  localStorage.setItem(PREFIX + groupId, JSON.stringify(results));
  getFirebase().then(fb => {
    if (!fb) return;
    const { db, doc, setDoc } = fb;
    setDoc(doc(db, firestorePath(groupId)), { data: JSON.stringify(results) })
      .catch(e => console.error(`[storage] saveResults(${groupId}):`, e));
  });
}

/**
 * Carga los resultados guardados de un grupo desde localStorage.
 * @returns {Object} Resultados o {} si no hay datos
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
 * Borra los resultados de un grupo de localStorage y Firebase.
 */
export function clearResults(groupId) {
  localStorage.removeItem(PREFIX + groupId);
  getFirebase().then(fb => {
    if (!fb) return;
    const { db, doc, deleteDoc } = fb;
    deleteDoc(doc(db, firestorePath(groupId))).catch(() => {});
  });
}

// ─── Hash de estado ────────────────────────────────────────────────────────

/**
 * Hash djb2 de una string. No criptográfico; suficiente para detectar
 * cambios en el estado de marcadores entre simulaciones.
 */
function _djb2Hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Genera un hash determinístico del estado de marcadores.
 * Serializa groupId→fixtureId→{home,away} ordenando lexicográficamente los
 * groupIds y numéricamente los fixtureIds, para que el resultado sea idéntico
 * independientemente del orden de inserción en el objeto.
 */
export function computeStateHash(state) {
  const ordered = {};
  for (const groupId of Object.keys(state).sort()) {
    ordered[groupId] = {};
    const gs = state[groupId] || {};
    for (const fixtureId of Object.keys(gs).sort((a, b) => Number(a) - Number(b))) {
      const r = gs[fixtureId];
      ordered[groupId][fixtureId] = { home: r.home ?? "", away: r.away ?? "" };
    }
  }
  return _djb2Hash(JSON.stringify(ordered));
}

// ─── Persistencia de simulación Monte Carlo ────────────────────────────────

/**
 * Guarda la última simulación en Firestore y en localStorage (fallback offline).
 * payload: { probabilities, iterations, timestamp, stateHash }
 */
export async function saveSimulationToFirebase(payload) {
  const serialized = JSON.stringify(payload);
  try { localStorage.setItem(SIM_LS_KEY, serialized); } catch {}
  const fb = await getFirebase();
  if (!fb) return;
  try {
    const { db, doc, setDoc } = fb;
    await setDoc(doc(db, SIM_FS_PATH), { data: serialized });
  } catch (e) {
    console.error("[storage] saveSimulationToFirebase:", e);
  }
}

/**
 * Carga la última simulación desde Firestore.
 * Fallback a localStorage si Firebase no está disponible o falla.
 * Retorna el payload o null si no hay datos.
 */
export async function loadSimulationFromFirebase() {
  const fb = await getFirebase();
  if (fb) {
    try {
      const { db, doc, getDoc } = fb;
      const snap = await getDoc(doc(db, SIM_FS_PATH));
      if (snap.exists()) {
        const payload = JSON.parse(snap.data().data);
        try { localStorage.setItem(SIM_LS_KEY, JSON.stringify(payload)); } catch {}
        return payload;
      }
    } catch (e) {
      console.warn("[storage] loadSimulationFromFirebase Firestore error, usando localStorage:", e);
    }
  }
  try {
    const raw = localStorage.getItem(SIM_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// ─── Resultados de grupo ────────────────────────────────────────────────────

/**
 * Carga los resultados desde Firebase y los sincroniza al localStorage.
 * Retorna null si Firebase no está disponible o no hay datos.
 */
export async function loadResultsFromFirebase(groupId) {
  const fb = await getFirebase();
  if (!fb) return null;
  try {
    const { db, doc, getDoc } = fb;
    const snap = await getDoc(doc(db, firestorePath(groupId)));
    if (snap.exists()) {
      const results = JSON.parse(snap.data().data);
      localStorage.setItem(PREFIX + groupId, JSON.stringify(results));
      return results;
    }
  } catch (e) {
    console.warn(`[storage] loadResultsFromFirebase(${groupId}):`, e);
  }
  return null;
}
