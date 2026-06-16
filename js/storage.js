// Persistencia con Firebase Firestore (fallback a localStorage si Firebase no está disponible).

const PREFIX = "worldcup2026_";

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
    setDoc(doc(db, firestorePath(groupId)), { data: JSON.stringify(results) }).catch(() => {});
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
  } catch {
    // Firebase falló, se usará localStorage
  }
  return null;
}
