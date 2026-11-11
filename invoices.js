import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadProjects();
    loadInvoices();
  } else {
    window.location.href = "login.html";
  }
});

async function loadProjects() {
  const select = document.getElementById("projectSelect");
  select.innerHTML = "";

  const q = query(collection(db, "projects"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.data().title + " (" + d.data().clientName + ")";
    select.appendChild(option);
  });
}

async function loadInvoices() {
  const list = document.getElementById("invoiceList");
  list.innerHTML = "";

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach((d) => {
    const inv = d.data();
    const li = document.createElement("li");
    li.textContent = inv.projectTitle + " - " + inv.amount + " SAR - due " + inv.dueDate + " - " + inv.status + " ";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = inv.status === "Paid" ? "Mark unpaid" : "Mark paid";
    toggleBtn.onclick = async () => {
      const newStatus = inv.status === "Paid" ? "Unpaid" : "Paid";
      await updateDoc(doc(db, "invoices", d.id), { status: newStatus });
      loadInvoices();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      await deleteDoc(doc(db, "invoices", d.id));
      loadInvoices();
    };

    li.appendChild(toggleBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

document.getElementById("addBtn").onclick = async () => {
  const select = document.getElementById("projectSelect");
  const amount = document.getElementById("amount");
  const dueDate = document.getElementById("dueDate");
  const status = document.getElementById("status");

  if (select.value === "" || amount.value === "") return;

  await addDoc(collection(db, "invoices"), {
    projectId: select.value,
    projectTitle: select.options[select.selectedIndex].text,
    amount: Number(amount.value),
    dueDate: dueDate.value,
    status: status.value,
    userId: currentUser.uid
  });

  amount.value = "";
  dueDate.value = "";
  loadInvoices();
};