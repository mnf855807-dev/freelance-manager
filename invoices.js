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

function downloadPdf(inv, id) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(22);
  pdf.text("INVOICE", 20, 25);

  pdf.setFontSize(12);
  pdf.text("Invoice #: " + id.slice(0, 6).toUpperCase(), 20, 40);
  pdf.text("Date: " + new Date().toLocaleDateString(), 20, 48);
  pdf.text("From: " + currentUser.email, 20, 60);
  pdf.text("Project: " + inv.projectTitle, 20, 75);
  pdf.text("Amount: " + inv.amount + " SAR", 20, 90);
  pdf.text("Due date: " + inv.dueDate, 20, 98);
  pdf.text("Status: " + inv.status, 20, 106);

  pdf.save("invoice-" + id.slice(0, 6) + ".pdf");
}

async function loadInvoices() {
  const list = document.getElementById("invoiceList");
  list.innerHTML = "";

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach((d) => {
    const inv = d.data();
    const li = document.createElement("li");
    li.className = "row";

    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = inv.projectTitle;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = inv.amount + " SAR - due " + inv.dueDate;
    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";

    const badge = document.createElement("span");
    badge.className = "badge " + (inv.status === "Paid" ? "green" : "red");
    badge.textContent = inv.status;

    const pdfBtn = document.createElement("button");
    pdfBtn.className = "secondary";
    pdfBtn.textContent = "PDF";
    pdfBtn.onclick = () => downloadPdf(inv, d.id);

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "secondary";
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

    actions.appendChild(badge);
    actions.appendChild(pdfBtn);
    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(info);
    li.appendChild(actions);
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