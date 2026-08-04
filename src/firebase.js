import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, update, push, child, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAYJWtx9Pp2mB5xY3C_qdT1EjQD2rJhUnk",
  authDomain: "trustnft-7fbe9.firebaseapp.com",
  databaseURL: "https://trustnft-7fbe9-default-rtdb.firebaseio.com",
  projectId: "trustnft-7fbe9",
  storageBucket: "trustnft-7fbe9.firebasestorage.app",
  messagingSenderId: "78224108681",
  appId: "1:78224108681:web:f900ebac97ea8bc0786a58"
};

let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.error("Firebase init error:", e);
}

export { db, ref, get, set, update, push, child, onValue, remove };
export const IMGBB_API_KEY = "56fa255f7c9a7224a9bb9029f5211d89";
export const PKR_RATE = 300; // 1$ = 300 PKR
