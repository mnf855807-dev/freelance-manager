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
import {
  $, t, icon, escapeHtml, number, moneyText, dateText, badge, empty,
  heading, field, selectField, startShell, showToast
} from "./shell.js";

let currentUser;
let clients = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  startShell("projects", user);

  const snapshot = await getDocs(query(collection(db, "clients"), where("userId", "==", user.uid)));
  clients = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  loadProjects();
});

async function loadProjects() {
  const q = query(collection(db, "projects"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);
  const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  projects.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
  showPage(projects);
}

function showPage(projects) {
  const rows = projects.map((p, i) => `
    <tr>
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
      <td>
        <button class="button ghost small danger" data-id="${p.id}" aria-label="${t("delete")}">${icon("trash", 15)}</button>
      </td>
    </tr>
  `).join("");

  const list = projects.length
    ? `<div class="table-wrap">
         <table class="data-table">
           <thead>
             <tr><th>${t("project")}</th><th>${t("client")}</th><th>${t("price")}</th><th>${t("deadline")}</th><th>${t("status")}</th><th>${t("actions")}</th></tr>
           </thead>
           <tbody>${rows}</tbody>
         </table>
       </div>`
    : empty("noProjects", "noProjectsText", "projects");

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));
  const noClients = clients.length === 0;

  $("#mainContent").innerHTML = `
    ${heading(t("projectsHeading"), t("projectsSub"))}
    <div class="page-layout">
      <section class="panel">
        <div class="list-tools">
          <h2>${t("allProjects")} <span class="count-pill">${number(projects.length)}</span></h2>
        </div>
        ${list}
      </section>
      <aside class="panel form-panel">
        <h2>${t("addProject")}</h2>
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
          <button class="button primary" type="submit" ${noClients ? "disabled" : ""}>${icon("plus", 15)} ${t("saveProject")}</button>
        </form>
      </aside>
    </div>
  `;

  $("#projectForm").onsubmit = addProject;

  document.querySelectorAll("button[data-id]").forEach((button) => {
    button.onclick = async () => {
      if (!confirm(t("deleteConfirm"))) return;
      await deleteDoc(doc(db, "projects", button.dataset.id));
      await loadProjects();
      showToast(t("deleted"));
    };
  });
}

async function addProject(event) {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form));
  const client = clients.find((c) => c.id === values.clientId);

  await addDoc(collection(db, "projects"), {
    clientId: values.clientId,
    clientName: client.name,
    title: values.title.trim(),
    price: Number(values.price),
    deadline: values.deadline,
    status: values.status,
    userId: currentUser.uid
  });

  await loadProjects();
  showToast(t("addedProject"));
}