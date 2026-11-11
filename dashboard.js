import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("userEmail").textContent = user.email;
    loadSummary(user);
  } else {
    window.location.href = "login.html";
  }
});

async function loadSummary(user) {
  const clientsSnap = await getDocs(query(collection(db, "clients"), where("userId", "==", user.uid)));
  const projectsSnap = await getDocs(query(collection(db, "projects"), where("userId", "==", user.uid)));
  const invoicesSnap = await getDocs(query(collection(db, "invoices"), where("userId", "==", user.uid)));

  document.getElementById("clientCount").textContent = clientsSnap.size;

  let paid = 0;
  let unpaid = 0;
  invoicesSnap.forEach((d) => {
    const inv = d.data();
    if (inv.status === "Paid") {
      paid += inv.amount;
    } else {
      unpaid += inv.amount;
    }
  });
  document.getElementById("totalPaid").textContent = paid;
  document.getElementById("totalUnpaid").textContent = unpaid;

  const active = [];
  projectsSnap.forEach((d) => {
    const p = d.data();
    if (p.status !== "Done") {
      active.push(p);
    }
  });
  document.getElementById("activeCount").textContent = active.length;

  active.sort((a, b) => a.deadline.localeCompare(b.deadline));

  const list = document.getElementById("deadlineList");
  list.innerHTML = "";
  active.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p.deadline + " - " + p.title + " (" + p.clientName + ")";
    list.appendChild(li);
  });
}

document.getElementById("logoutBtn").onclick = () => {
  signOut(auth);
};