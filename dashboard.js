import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("userEmail").textContent = user.email;
  } else {
    window.location.href = "login.html";
  }
});

document.getElementById("logoutBtn").onclick = () => {
  signOut(auth);
};