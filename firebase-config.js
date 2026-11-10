import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpFMcQW7ejqU1SC61mDp3nA5R6N_vV32A",
  authDomain: "freelance-manager-64459.firebaseapp.com",
  projectId: "freelance-manager-64459",
  storageBucket: "freelance-manager-64459.firebasestorage.app",
  messagingSenderId: "267888545271",
  appId: "1:267888545271:web:197db07d55b877439b32f2"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);