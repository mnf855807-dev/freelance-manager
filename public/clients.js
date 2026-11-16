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
import { $, t, icon, escapeHtml, number, empty, heading, field, startShell, showToast } from "./shell.js";

let currentUser;
let clients = [];
let editingId = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  startShell("clients", user);
  loadClients();
});

async function loadClients() {
  const q = query(collection(db, "clients"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);
  clients = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  clients.sort((a, b) => a.name.localeCompare(b.name));
  showPage();
}

function showPage() {
  const editing = clients.find((c) => c.id === editingId);
  const value = (key) => (editing ? 'value="' + escapeHtml(editing[key]) + '"' : "");

  const rows = clients.map((c) => `
    <tr data-search="${escapeHtml((c.name + " " + c.phone + " " + c.email).toLowerCase())}">
      <td>
        <div class="table-project">
          <span class="project-symbol">${escapeHtml(c.name.charAt(0).toUpperCase())}</span>
          <a class="client-link" href="client.html#${c.id}"><strong>${escapeHtml(c.name)}</strong></a>
        </div>
      </td>
      <td dir="auto">${escapeHtml(c.phone)}</td>
      <td dir="auto">${escapeHtml(c.email)}</td>
      <td>
        <div class="actions">
          <button class="button ghost small" data-action="edit" data-id="${c.id}">${t("edit")}</button>
          <button class="button ghost small danger" data-action="delete" data-id="${c.id}" aria-label="${t("delete")}">${icon("trash", 15)}</button>
        </div>
      </td>
    </tr>
  `).join("");

  const list = clients.length
    ? `<div class="table-wrap">
         <table class="data-table">
           <thead><tr><th>${t("fullName")}</th><th>${t("phone")}</th><th>${t("email")}</th><th>${t("actions")}</th></tr></thead>
           <tbody>${rows}</tbody>
         </table>
       </div>
       <div id="noSearchResults" hidden>${empty("noResults", "noResultsText", "search")}</div>`
    : empty("noClients", "noClientsText", "clients");

  $("#mainContent").innerHTML = `
    ${heading(t("clientsHeading"), t("clientsSub"))}
    <div class="page-layout">
      <section class="panel">
        <div class="list-tools">
          <h2>${t("allClients")} <span class="count-pill">${number(clients.length)}</span></h2>
          <div class="search-wrap">
            ${icon("search", 15)}
            <input class="search-input" id="clientSearch" type="search" placeholder="${t("searchClients")}">
          </div>
        </div>
        ${list}
      </section>
      <aside class="panel form-panel">
        <h2>${editing ? t("editClient") : t("addClient")}</h2>
        <p>${t("addClientSub")}</p>
        <form class="form-grid" id="clientForm">
          ${field("fullName", "name", "text", t("namePlaceholder"), 'required maxlength="100" ' + value("name"))}
          ${field("phone", "phone", "tel", t("phonePlaceholder"), 'required maxlength="40" ' + value("phone"))}
          ${field("email", "email", "email", t("emailPlaceholder"), 'required maxlength="120" ' + value("email"))}
          <button class="button primary" type="submit">${icon(editing ? "check" : "plus", 15)} ${editing ? t("saveChanges") : t("saveClient")}</button>
          ${editing ? `<button class="button" type="button" id="cancelEdit">${t("cancel")}</button>` : ""}
        </form>
      </aside>
    </div>
  `;

  $("#clientSearch").oninput = filterClients;
  $("#clientForm").onsubmit = saveClient;

  if (editing) {
    $("#cancelEdit").onclick = () => {
      editingId = null;
      showPage();
    };
  }

  document.querySelectorAll("button[data-action]").forEach((button) => {
    button.onclick = () => handleAction(button.dataset.action, button.dataset.id);
  });
}

async function handleAction(action, id) {
  if (action === "edit") {
    editingId = id;
    showPage();
    $("#clientForm").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (!confirm(t("deleteConfirm"))) return;
  await deleteDoc(doc(db, "clients", id));
  if (editingId === id) editingId = null;
  await loadClients();
  showToast(t("deleted"));
}

function filterClients() {
  const text = $("#clientSearch").value.trim().toLowerCase();
  let visible = 0;

  document.querySelectorAll("tr[data-search]").forEach((row) => {
    const match = row.dataset.search.includes(text);
    row.hidden = !match;
    if (match) visible++;
  });

  const none = $("#noSearchResults");
  if (none) none.hidden = visible !== 0;
}

async function saveClient(event) {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form));
  const data = {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email.trim()
  };

  if (editingId) {
    await updateClient(editingId, data);
    editingId = null;
    await loadClients();
    showToast(t("updated"));
    return;
  }

  await addDoc(collection(db, "clients"), { ...data, userId: currentUser.uid });
  await loadClients();
  showToast(t("addedClient"));
}

async function updateClient(id, data) {
  await updateDoc(doc(db, "clients", id), data);

  // Keep the client name in their projects and invoices up to date
  const projectSnap = await getDocs(query(collection(db, "projects"), where("userId", "==", currentUser.uid)));
  const invoiceSnap = await getDocs(query(collection(db, "invoices"), where("userId", "==", currentUser.uid)));
  const projects = projectSnap.docs.filter((d) => d.data().clientId === id);

  for (const p of projects) {
    await updateDoc(doc(db, "projects", p.id), { clientName: data.name });

    const label = p.data().title + " (" + data.name + ")";
    const projectInvoices = invoiceSnap.docs.filter((d) => d.data().projectId === p.id);
    for (const i of projectInvoices) {
      await updateDoc(doc(db, "invoices", i.id), { projectTitle: label });
    }
  }
}