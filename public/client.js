import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, t, lang, icon, escapeHtml, number, money, moneyText, dateText, badge, startShell } from "./shell.js";

const text = {
  en: {
    projectsCount: "Projects",
    totalValue: "Total project value",
    clientProjects: "Projects",
    payment: "Payment",
    noClientProjects: "No projects for this client yet",
    noClientProjectsText: "Add one from the Projects page.",
    notFound: "Client not found",
    notFoundText: "This client may have been deleted."
  },
  ar: {
    projectsCount: "المشاريع",
    totalValue: "إجمالي قيمة المشاريع",
    clientProjects: "المشاريع",
    payment: "الدفع",
    noClientProjects: "لا توجد مشاريع لهذا العميل بعد",
    noClientProjectsText: "أضف مشروعاً من صفحة المشاريع.",
    notFound: "العميل غير موجود",
    notFoundText: "ربما تم حذف هذا العميل."
  }
};
const L = text[lang];

export async function show(user, clientId) {
  const [clients, allProjects, invoices] = await Promise.all([
    getList("clients", user),
    getList("projects", user),
    getList("invoices", user)
  ]);

  if (!location.hash.startsWith("#client/")) return;

  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    $("#mainContent").innerHTML = `
      <section class="panel">
        <div class="empty-state">
          <div class="empty-icon">${icon("clients", 20)}</div>
          <strong>${L.notFound}</strong>
          <p>${L.notFoundText}</p>
        </div>
      </section>
    `;
    return;
  }

  const projects = allProjects.filter((p) => p.clientId === clientId);
  projects.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));

  showClient(client, projects, invoices);
}

async function getList(name, user) {
  const snapshot = await getDocs(query(collection(db, name), where("userId", "==", user.uid)));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function sumAmount(list) {
  return list.reduce((total, item) => total + Number(item.amount), 0);
}

function statCard(label, value, iconName, color) {
  return `
    <article class="stat-card">
      <div class="stat-top">
        <span class="stat-label">${label}</span>
        <span class="stat-icon ${color}">${icon(iconName, 18)}</span>
      </div>
      <div class="stat-value">${value}</div>
    </article>
  `;
}

function paidOf(project, invoices) {
    return invoices
      .filter((i) => i.projectId === project.id && i.status === "Paid")
      .reduce((total, i) => total + Number(i.amount), 0);
  }
  
  const partialLabel = lang === "ar" ? "جزئي" : "Partial";
  
  function paymentCell(project, invoices) {
    const list = invoices.filter((i) => i.projectId === project.id);
    if (list.length === 0) return "—";
  
    const paid = paidOf(project, invoices);
    let label = badge("Unpaid");
    if (paid >= Number(project.price)) {
      label = badge("Paid");
    } else if (paid > 0) {
      label = `<span class="badge partial">${partialLabel}</span>`;
    }
  
    return label + `<div class="row-main"><small>${moneyText(paid)} / ${moneyText(project.price)}</small></div>`;
  }

function showClient(client, projects, invoices) {
  const projectIds = projects.map((p) => p.id);
  const clientInvoices = invoices.filter((i) => projectIds.includes(i.projectId));

  const totalValue = projects.reduce((total, p) => total + Number(p.price), 0);
  const paid = sumAmount(clientInvoices.filter((i) => i.status === "Paid"));
  const owed = sumAmount(clientInvoices.filter((i) => i.status !== "Paid"));

  const back = lang === "ar" ? "→" : "←";
  const subtitle = escapeHtml(client.phone) + " · " + escapeHtml(client.email);

  const rows = projects.map((p, i) => {
    return `
      <tr>
        <td>
          <div class="table-project">
            <span class="project-symbol ${i % 3 === 1 ? "blue" : i % 3 === 2 ? "amber" : ""}">${icon("link", 15)}</span>
            <strong>${escapeHtml(p.title)}</strong>
          </div>
        </td>
        <td class="amount">${moneyText(p.price)}</td>
        <td>${dateText(p.deadline)}</td>
        <td>${badge(p.status)}</td>
        <td>${paymentCell(p, invoices)}</td>
      </tr>
    `;
  }).join("");

  const list = projects.length
    ? `<div class="table-wrap">
         <table class="data-table">
           <thead>
             <tr><th>${t("project")}</th><th>${t("price")}</th><th>${t("deadline")}</th><th>${t("status")}</th><th>${L.payment}</th></tr>
           </thead>
           <tbody>${rows}</tbody>
         </table>
       </div>`
    : `<div class="empty-state">
         <div class="empty-icon">${icon("projects", 20)}</div>
         <strong>${L.noClientProjects}</strong>
         <p>${L.noClientProjectsText}</p>
       </div>`;

  $("#mainContent").innerHTML = `
    <p><a class="panel-link" href="#clients">${back} ${t("clients")}</a></p>
    <div class="page-heading">
      <div>
        <div class="eyebrow">${t("clients")}</div>
        <h1>${escapeHtml(client.name)}</h1>
        <p dir="auto">${subtitle}</p>
      </div>
    </div>

    <section class="stats-grid">
      ${statCard(L.projectsCount, number(projects.length), "briefcase", "blue")}
      ${statCard(L.totalValue, money(totalValue), "wallet", "purple")}
      ${statCard(t("paid"), money(paid), "check", "green")}
      ${statCard(t("owed"), money(owed), "clock", "red")}
    </section>

    <section class="panel">
      <div class="list-tools">
        <h2>${L.clientProjects} <span class="count-pill">${number(projects.length)}</span></h2>
      </div>
      ${list}
    </section>
  `;
}