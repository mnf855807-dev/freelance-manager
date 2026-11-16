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
  heading, field, selectField, startShell, showToast, userName
} from "./shell.js";

let currentUser;
let clients = [];
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

  const clientSnap = await getDocs(query(collection(db, "clients"), where("userId", "==", user.uid)));
  clients = clientSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

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

  const project = projects.find((p) => p.id === inv.projectId);
  const client = project ? clients.find((c) => c.id === project.clientId) : null;
  const invoiceNo = "INV-" + inv.id.slice(0, 6).toUpperCase();
  const isPaid = inv.status === "Paid";
  const amount = Number(inv.amount).toFixed(2) + " SAR";
  const today = new Date().toISOString().slice(0, 10);

  const purple = [98, 91, 246];
  const dark = [31, 36, 51];
  const gray = [120, 128, 145];
  const green = [22, 163, 74];
  const red = [220, 38, 38];

  // Header
  pdf.setFillColor(...purple);
  pdf.rect(0, 0, 210, 44, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.text("INVOICE", 20, 28);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text("#" + invoiceNo, 190, 22, { align: "right" });
  pdf.text("Issued " + today, 190, 30, { align: "right" });

  // Billed to / From
  pdf.setTextColor(...gray);
  pdf.setFontSize(9);
  pdf.text("BILLED TO", 20, 62);
  pdf.text("FROM", 120, 62);

  pdf.setTextColor(...dark);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(client ? client.name : "-", 20, 71);
  pdf.text(userName(currentUser), 120, 71);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...gray);
  pdf.text(client ? client.phone : "", 20, 78);
  pdf.text(client ? client.email : "", 20, 84);
  pdf.text(currentUser.email, 120, 78);

  // Details boxes
  const boxes = [
    ["ISSUE DATE", today, dark],
    ["DUE DATE", inv.dueDate || "-", dark],
    ["STATUS", isPaid ? "PAID" : "UNPAID", isPaid ? green : red]
  ];

  boxes.forEach((box, i) => {
    const x = 20 + i * 59;
    pdf.setFillColor(243, 244, 248);
    pdf.roundedRect(x, 96, 52, 22, 3, 3, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.text(box[0], x + 5, 104);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...box[2]);
    pdf.text(box[1], x + 5, 112);
  });

  // Table
  pdf.setFillColor(...dark);
  pdf.rect(20, 132, 170, 10, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("DESCRIPTION", 25, 138.5);
  pdf.text("AMOUNT", 185, 138.5, { align: "right" });

  pdf.setTextColor(...dark);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  const title = project ? project.title : inv.projectTitle;
  pdf.text(pdf.splitTextToSize(title, 110), 25, 153);
  pdf.text(amount, 185, 153, { align: "right" });

  pdf.setDrawColor(229, 231, 235);
  pdf.line(20, 162, 190, 162);

  // Totals
  pdf.setFontSize(10);
  pdf.setTextColor(...gray);
  pdf.text("Subtotal", 130, 174);
  pdf.text(amount, 190, 174, { align: "right" });
  pdf.text("Paid", 130, 182);
  pdf.text(isPaid ? amount : "0.00 SAR", 190, 182, { align: "right" });

  pdf.setFillColor(...purple);
  pdf.roundedRect(125, 190, 65, 16, 3, 3, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("BALANCE DUE", 130, 200);
  pdf.setFontSize(12);
  pdf.text(isPaid ? "0.00 SAR" : amount, 186, 200, { align: "right" });

  // Footer
  pdf.setDrawColor(229, 231, 235);
  pdf.line(20, 272, 190, 272);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...gray);
  pdf.text("Thank you for your business.", 105, 280, { align: "center" });
  pdf.text("Generated with Freelance Manager", 105, 286, { align: "center" });

  pdf.save(invoiceNo + ".pdf");
}