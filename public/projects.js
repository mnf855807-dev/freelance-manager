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
  $, t, lang, icon, escapeHtml, number, moneyText, dateText, badge,
  empty, heading, field, selectField, startShell, showToast
} from "./shell.js";

const text = {
  en: {
    searchProjects: "Search projects...",
    payment: "Payment",
    allStatuses: "All statuses",
    allPayments: "All payments",
    from: "Deadline from",
    to: "Deadline to",
    noMatch: "No matching projects",
    noMatchText: "Try a different search or filter."
  },
  ar: {
    searchProjects: "ابحث عن المشاريع...",
    payment: "الدفع",
    allStatuses: "كل الحالات",
    allPayments: "كل المدفوعات",
    from: "الموعد من",
    to: "الموعد إلى",
    noMatch: "لا توجد مشاريع مطابقة",
    noMatchText: "جرّب بحثاً أو فلتراً آخر."
  }
};
const L = text[lang];

let currentUser;
let clients = [];
let invoices = [];
let projects = [];
let editingId = null;
let highlightId = null;

export async function show(user, projectId) {
  highlightId = projectId || null;
  currentUser = user;
  editingId = null;

  const [clientSnap, invoiceSnap, projectSnap] = await Promise.all([
    getDocs(query(collection(db, "clients"), where("userId", "==", user.uid))),
    getDocs(query(collection(db, "invoices"), where("userId", "==", user.uid))),
    getDocs(query(collection(db, "projects"), where("userId", "==", user.uid)))
  ]);

  clients = clientSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  invoices = invoiceSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  projects = projectSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  projects.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));

  showPage();
}

async function loadProjects() {
  const q = query(collection(db, "projects"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);
  projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  projects.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
  showPage();
}

function paidOf(project) {
  return invoices
    .filter((i) => i.projectId === project.id && i.status === "Paid")
    .reduce((total, i) => total + Number(i.amount), 0);
}

function paymentOf(project) {
  const list = invoices.filter((i) => i.projectId === project.id);
  if (list.length === 0) return "none";
  const paid = paidOf(project);
  if (paid >= Number(project.price)) return "Paid";
  return paid > 0 ? "Partial" : "Unpaid";
}

const partialLabel = lang === "ar" ? "جزئي" : "Partial";

function paymentCell(project, payment) {
  if (payment === "none") return "—";
  const label = payment === "Partial" ? `<span class="badge partial">${partialLabel}</span>` : badge(payment);
  return label + `<div class="row-main"><small>${moneyText(paidOf(project))} / ${moneyText(project.price)}</small></div>`;
}

function showPage() {
  if (!location.hash.startsWith("#projects")) return;
  const editing = projects.find((p) => p.id === editingId);

  const rows = projects.map((p, i) => {
    const payment = paymentOf(p);
    const searchText = (p.title + " " + p.clientName + " " + p.status + " " + p.deadline).toLowerCase();

    return `
      <tr id="project-${p.id}" data-text="${escapeHtml(searchText)}" data-status="${escapeHtml(p.status)}" data-payment="${payment}" data-date="${escapeHtml(p.deadline || "")}">
        <td>
          <div class="table-project">
            <span class="project-symbol ${i % 3 === 1 ? "blue" : i % 3 === 2 ? "amber" : ""}">${icon("link", 15)}</span>
            <strong>${escapeHtml(p.title)}</strong>
          </div>
        </td>
        <td>${escapeHtml(p.clientName)}</td>
        <td class="amount">${moneyText(p.price)}</td>
        <td>${dateText(p.deadline)}</td>
        <td>${badge(p.status)}</td>
        <td>${paymentCell(p, payment)}</td>
        <td>
          <div class="actions">
            <button class="button ghost small" data-action="edit" data-id="${p.id}">${t("edit")}</button>
            <button class="button ghost small danger" data-action="delete" data-id="${p.id}" aria-label="${t("delete")}">${icon("trash", 15)}</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  const filters = `
    <div class="filters">
      <div class="field">
        <label for="statusFilter">${t("status")}</label>
        <select id="statusFilter">
          <option value="">${L.allStatuses}</option>
          <option value="Not started">${t("notStarted")}</option>
          <option value="In progress">${t("inProgress")}</option>
          <option value="Done">${t("done")}</option>
        </select>
      </div>
      <div class="field">
        <label for="paymentFilter">${L.payment}</label>
        <select id="paymentFilter">
          <option value="">${L.allPayments}</option>
          <option value="Partial">${partialLabel}</option>
          <option value="Unpaid">${t("unpaid")}</option>
        </select>
      </div>
      <div class="field">
        <label for="fromDate">${L.from}</label>
        <input id="fromDate" type="date">
      </div>
      <div class="field">
        <label for="toDate">${L.to}</label>
        <input id="toDate" type="date">
      </div>
    </div>
  `;

  const table = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>${t("project")}</th><th>${t("client")}</th><th>${t("price")}</th><th>${t("deadline")}</th><th>${t("status")}</th><th>${L.payment}</th><th>${t("actions")}</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div id="noMatch" hidden>
      <div class="empty-state">
        <div class="empty-icon">${icon("search", 20)}</div>
        <strong>${L.noMatch}</strong>
        <p>${L.noMatchText}</p>
      </div>
    </div>
  `;

  const hasProjects = projects.length > 0;
  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));
  const noClients = clients.length === 0;

  $("#mainContent").innerHTML = `
    ${heading(t("projectsHeading"), t("projectsSub"))}
    <div class="page-layout">
      <section class="panel">
        <div class="list-tools">
          <h2>${t("allProjects")} <span class="count-pill" id="projectCount">${number(projects.length)}</span></h2>
          <div class="search-wrap">
            ${icon("search", 15)}
            <input class="search-input" id="projectSearch" type="search" placeholder="${L.searchProjects}">
          </div>
        </div>
        ${hasProjects ? filters + table : empty("noProjects", "noProjectsText", "projects")}
      </section>
      <aside class="panel form-panel">
        <h2>${editing ? t("editProject") : t("addProject")}</h2>
        <p>${t("addProjectSub")}</p>
        <form class="form-grid" id="projectForm">
          ${selectField("client", "clientId", clientOptions, "selectClient")}
          ${field("projectTitle", "title", "text", t("projectPlaceholder"), 'required maxlength="100"')}
          ${field("price", "price", "number", "0.00", 'required min="0" step="0.01"')}
          ${field("deadline", "deadline", "date", "", "required")}
          <div class="field">
            <label for="projectStatus">${t("status")}</label>
            <select id="projectStatus" name="status">
              <option value="Not started">${t("notStarted")}</option>
              <option value="In progress">${t("inProgress")}</option>
              <option value="Done">${t("done")}</option>
            </select>
          </div>
          ${noClients ? `<div class="form-note">${t("needClient")}</div>` : ""}
          <button class="button primary" type="submit" ${noClients ? "disabled" : ""}>${icon(editing ? "check" : "plus", 15)} ${editing ? t("saveChanges") : t("saveProject")}</button>
          ${editing ? `<button class="button" type="button" id="cancelEdit">${t("cancel")}</button>` : ""}
        </form>
      </aside>
    </div>
  `;


  if (highlightId) {
    const row = document.getElementById("project-" + highlightId);
    highlightId = null;
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("row-highlight");
    }
  }

  if (editing) {
    $("#clientId").value = editing.clientId;
    $("#title").value = editing.title;
    $("#price").value = editing.price;
    $("#deadline").value = editing.deadline;
    $("#projectStatus").value = editing.status;
    $("#cancelEdit").onclick = () => {
      editingId = null;
      showPage();
    };
  }

  if (hasProjects) {
    ["projectSearch", "statusFilter", "paymentFilter", "fromDate", "toDate"].forEach((id) => {
      $("#" + id).oninput = filterProjects;
    });
  } else {
    $("#projectSearch").disabled = true;
  }

  document.querySelectorAll("button[data-action]").forEach((button) => {
    button.onclick = () => handleAction(button.dataset.action, button.dataset.id);
  });
}

async function handleAction(action, id) {
  if (action === "edit") {
    editingId = id;
    showPage();
    $("#projectForm").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (!confirm(t("deleteConfirm"))) return;
  await deleteDoc(doc(db, "projects", id));
  if (editingId === id) editingId = null;
  await loadProjects();
  showToast(t("deleted"));
}

function filterProjects() {
  const searchText = $("#projectSearch").value.trim().toLowerCase();
  const status = $("#statusFilter").value;
  const payment = $("#paymentFilter").value;
  const from = $("#fromDate").value;
  const to = $("#toDate").value;
  let visible = 0;

  document.querySelectorAll("tr[data-text]").forEach((row) => {
    const date = row.dataset.date;
    const match =
      row.dataset.text.includes(searchText) &&
      (status === "" || row.dataset.status === status) &&
      (payment === "" || row.dataset.payment === payment) &&
      (from === "" || date >= from) &&
      (to === "" || date <= to);

    row.hidden = !match;
    if (match) visible++;
  });

  $("#projectCount").textContent = number(visible);
  $("#noMatch").hidden = visible !== 0;
}

async function saveProject(event) {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form));
  const client = clients.find((c) => c.id === values.clientId);

  const data = {
    clientId: values.clientId,
    clientName: client.name,
    title: values.title.trim(),
    price: Number(values.price),
    deadline: values.deadline,
    status: values.status
  };

  if (editingId) {
    await updateProject(editingId, data);
    editingId = null;
    await loadProjects();
    showToast(t("updated"));
    return;
  }

  await addDoc(collection(db, "projects"), { ...data, userId: currentUser.uid });
  await loadProjects();
  showToast(t("addedProject"));
}

async function updateProject(id, data) {
  await updateDoc(doc(db, "projects", id), data);

  // Keep the project title in its invoices up to date
  const label = data.title + " (" + data.clientName + ")";
  for (const inv of invoices.filter((i) => i.projectId === id)) {
    await updateDoc(doc(db, "invoices", inv.id), { projectTitle: label });
    inv.projectTitle = label;
  }
}