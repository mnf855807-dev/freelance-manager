import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, t, icon, escapeHtml, number, empty, heading, field, startShell, showToast } from "./shell.js";

let currentUser;

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
  const clients = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  clients.sort((a, b) => a.name.localeCompare(b.name));
  showPage(clients);
}

function showPage(clients) {
  const rows = clients.map((c) => `
    <tr data-search="${escapeHtml((c.name + " " + c.phone + " " + c.email).toLowerCase())}">
      <td>
        <div class="table-project">
          <span class="project-symbol">${escapeHtml(c.name.charAt(0).toUpperCase())}</span>
          <strong>${escapeHtml(c.name)}</strong>
        </div>
      </td>
      <td dir="auto">${escapeHtml(c.phone)}</td>
      <td dir="auto">${escapeHtml(c.email)}</td>
      <td>
        <button class="button ghost small danger" data-id="${c.id}">${icon("trash", 15)} ${t("delete")}</button>
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
        <h2>${t("addClient")}</h2>
        <p>${t("addClientSub")}</p>
        <form class="form-grid" id="clientForm">
          ${field("fullName", "name", "text", t("namePlaceholder"), 'required maxlength="100"')}
          ${field("phone", "phone", "tel", t("phonePlaceholder"), 'required maxlength="40"')}
          ${field("email", "email", "email", t("emailPlaceholder"), 'required maxlength="120"')}
          <button class="button primary" type="submit">${icon("plus", 15)} ${t("saveClient")}</button>
        </form>
      </aside>
    </div>
  `;

  $("#clientSearch").oninput = filterClients;
  $("#clientForm").onsubmit = addClient;

  document.querySelectorAll("button[data-id]").forEach((button) => {
    button.onclick = async () => {
      if (!confirm(t("deleteConfirm"))) return;
      await deleteDoc(doc(db, "clients", button.dataset.id));
      await loadClients();
      showToast(t("deleted"));
    };
  });
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

async function addClient(event) {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form));

  await addDoc(collection(db, "clients"), {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    userId: currentUser.uid
  });

  await loadClients();
  showToast(t("addedClient"));
}