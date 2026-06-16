import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqRvXmDjKRo5kye39hGeh0uW0tGoi5o7c",
  authDomain: "panini-2026-c3ae8.firebaseapp.com",
  projectId: "panini-2026-c3ae8",
  storageBucket: "panini-2026-c3ae8.firebasestorage.app",
  messagingSenderId: "713513106611",
  appId: "1:713513106611:web:0f222abee8dde76915c4c6",
  measurementId: "G-X3LTQMHJZQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
