import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const message = document.getElementById("message");

function showSuccess() {
    window.location.href = "dashboard.html";
  }

function showError(error) {
  message.textContent = error.message;
}

document.getElementById("loginBtn").onclick = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(showSuccess)
    .catch(showError);
};

document.getElementById("signupBtn").onclick = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(showSuccess)
    .catch(showError);
};

document.getElementById("googleBtn").onclick = () => {
  signInWithPopup(auth, new GoogleAuthProvider())
    .then(showSuccess)
    .catch(showError);
};