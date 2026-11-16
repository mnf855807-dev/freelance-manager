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
import {
  $, t, icon, escapeHtml, number, moneyText, dateText, badge, empty,
  heading, field, selectField, startShell, showToast
} from "./shell.js";

let currentUser;
let projects = [];
let invoices = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  startShell("invoices", user);

  const snapshot = await getDocs(query(collection(db, "projects"), where("userId", "==", user.uid)));
  projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  loadInvoices();
});

async function loadInvoices() {
  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);
  invoices = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  invoices.sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""));
  showPage();
}

function showPage() {
  const rows = invoices.map((inv, i) => {
    const project = projects.find((p) => p.id === inv.projectId);
    const isPaid = inv.status === "Paid";
    return `
      <tr>
        <td>
          <div class="table-project">
            <span class="project-symbol ${i % 3 === 1 ? "blue" : i % 3 === 2 ? "amber" : ""}">${icon("file", 15)}</span>
            <div>
              <strong>${escapeHtml(project ? project.title : inv.projectTitle)}</strong>
              <div class="row-main"><small>#INV-${escapeHtml(inv.id.slice(0, 4).toUpperCase())}</small></div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(project ? project.clientName : "—")}</td>
        <td class="amount">${moneyText(inv.amount)}</td>
        <td>${dateText(inv.dueDate)}</td>
        <td>${badge(inv.status)}</td>
        <td>
          <div class="actions">
            <button class="button ghost small" data-action="pdf" data-id="${inv.id}">${t("pdf")}</button>
            <button class="button ghost small" data-action="toggle" data-id="${inv.id}">${t(isPaid ? "markUnpaid" : "markPaid")}</button>
            <button class="button ghost small danger" data-action="delete" data-id="${inv.id}" aria-label="${t("delete")}">${icon("trash", 15)}</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  const list = invoices.length
    ? `<div class="table-wrap">
         <table class="data-table">
           <thead>
             <tr><th>${t("invoice")}</th><th>${t("client")}</th><th>${t("amount")}</th><th>${t("dueDate")}</th><th>${t("status")}</th><th>${t("actions")}</th></tr>
           </thead>
           <tbody>${rows}</tbody>
         </table>
       </div>`
    : empty("noInvoices", "noInvoicesText", "invoices");

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.title + " (" + p.clientName + ")" }));
  const noProjects = projects.length === 0;

  $("#mainContent").innerHTML = `
    ${heading(t("invoicesHeading"), t("invoicesSub"))}
    <div class="page-layout">
      <section class="panel">
        <div class="list-tools">
          <h2>${t("allInvoices")} <span class="count-pill">${number(invoices.length)}</span></h2>
        </div>
        ${list}
      </section>
      <aside class="panel form-panel">
        <h2>${t("addInvoice")}</h2>
        <p>${t("addInvoiceSub")}</p>
        <form class="form-grid" id="invoiceForm">
          ${selectField("project", "projectId", projectOptions, "selectProject")}
          ${field("amountSar", "amount", "number", "0.00", 'required min="0" step="0.01"')}
          ${field("dueDate", "dueDate", "date", "", "required")}
          <div class="field">
            <label for="invoiceStatus">${t("status")}</label>
            <select id="invoiceStatus" name="status">
              <option value="Unpaid">${t("unpaid")}</option>
              <option value="Paid">${t("paid")}</option>
            </select>
          </div>
          ${noProjects ? `<div class="form-note">${t("needProject")}</div>` : ""}
          <button class="button primary" type="submit" ${noProjects ? "disabled" : ""}>${icon("plus", 15)} ${t("saveInvoice")}</button>
        </form>
      </aside>
    </div>
  `;

  $("#invoiceForm").onsubmit = addInvoice;

  document.querySelectorAll("button[data-action]").forEach((button) => {
    button.onclick = () => handleAction(button.dataset.action, button.dataset.id);
  });
}

async function handleAction(action, id) {
  const inv = invoices.find((i) => i.id === id);

  if (action === "pdf") {
    downloadPdf(inv);
    return;
  }

  if (action === "toggle") {
    const newStatus = inv.status === "Paid" ? "Unpaid" : "Paid";
    await updateDoc(doc(db, "invoices", id), { status: newStatus });
    await loadInvoices();
    showToast(t("statusUpdated"));
    return;
  }

  if (action === "delete") {
    if (!confirm(t("deleteConfirm"))) return;
    await deleteDoc(doc(db, "invoices", id));
    await loadInvoices();
    showToast(t("deleted"));
  }
}

async function addInvoice(event) {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form));
  const project = projects.find((p) => p.id === values.projectId);

  await addDoc(collection(db, "invoices"), {
    projectId: values.projectId,
    projectTitle: project.title + " (" + project.clientName + ")",
    amount: Number(values.amount),
    dueDate: values.dueDate,
    status: values.status,
    userId: currentUser.uid
  });

  await loadInvoices();
  showToast(t("addedInvoice"));
}

function downloadPdf(inv) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(22);
  pdf.text("INVOICE", 20, 25);

  pdf.setFontSize(12);
  pdf.text("Invoice #: " + inv.id.slice(0, 6).toUpperCase(), 20, 40);
  pdf.text("Date: " + new Date().toLocaleDateString(), 20, 48);
  pdf.text("From: " + currentUser.email, 20, 60);
  pdf.text("Project: " + inv.projectTitle, 20, 75);
  pdf.text("Amount: " + inv.amount + " SAR", 20, 90);
  pdf.text("Due date: " + inv.dueDate, 20, 98);
  pdf.text("Status: " + inv.status, 20, 106);

  pdf.save("invoice-" + inv.id.slice(0, 6) + ".pdf");
}