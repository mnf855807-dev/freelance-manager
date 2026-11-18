import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, t, icon, escapeHtml, number, money, moneyText, dateText, badge, empty, startShell, userName } from "./shell.js";

export async function show(user) {
  const [clients, projects, invoices] = await Promise.all([
    getList("clients", user),
    getList("projects", user),
    getList("invoices", user)
  ]);

  if (location.hash && location.hash !== "#dashboard") return;
  $("#mainContent").innerHTML = buildDashboard(user, clients, projects, invoices);
}

async function getList(name, user) {
  const snapshot = await getDocs(query(collection(db, name), where("userId", "==", user.uid)));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function sumAmount(list) {
  return list.reduce((total, item) => total + Number(item.amount), 0);
}

function statCard(label, value, foot, iconName, color, isMoney) {
  return `
    <article class="stat-card">
      <div class="stat-top">
        <span class="stat-label">${t(label)}</span>
        <span class="stat-icon ${color}">${icon(iconName, 18)}</span>
      </div>
      <div class="stat-value ${isMoney ? color : ""}">${isMoney ? money(value) : number(value)}</div>
      <div class="stat-foot"><b class="${color === "red" ? "red" : ""}">●</b>${t(foot)}</div>
    </article>
  `;
}

function chart(invoices) {
  const months = [];
  const now = new Date();

  for (let offset = -3; offset <= 2; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const group = invoices.filter((i) => i.dueDate && i.dueDate.slice(0, 7) === key);
    months.push({
      label: new Intl.DateTimeFormat(t("dateLocale"), { month: "short" }).format(d),
      paid: sumAmount(group.filter((i) => i.status === "Paid")),
      unpaid: sumAmount(group.filter((i) => i.status !== "Paid"))
    });
  }

  const highest = Math.max(1000, ...months.flatMap((m) => [m.paid, m.unpaid]));
  const max = Math.ceil(highest / 2000) * 2000;
  const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0].map((n) => (n >= 1000 ? number(n / 1000) + "k" : number(n)));

  const bars = months.map((m) => `
    <div class="bar-group">
      <div class="bar paid" title="${t("paid")}: ${escapeHtml(moneyText(m.paid))}" style="height:${Math.max((m.paid / max) * 100, 1)}%"></div>
      <div class="bar unpaid" title="${t("unpaid")}: ${escapeHtml(moneyText(m.unpaid))}" style="height:${Math.max((m.unpaid / max) * 100, 1)}%"></div>
      <span class="bar-month">${m.label}</span>
    </div>
  `).join("");

  return `
    <div class="chart-wrap" role="img" aria-label="${t("incomeSub")}">
      <div class="chart-y">${ticks.map((x) => `<span>${x}</span>`).join("")}</div>
      <div class="chart-plot">
        <div class="chart-lines"><span></span><span></span><span></span><span></span><span></span></div>
        ${bars}
      </div>
    </div>
  `;
}

function invoiceTable(invoices, projects) {
  if (!invoices.length) return empty("noInvoices", "noInvoicesText", "invoices");

  const rows = invoices.map((inv, index) => {
    const project = projects.find((p) => p.id === inv.projectId);
    const color = index % 3 === 1 ? "blue" : index % 3 === 2 ? "amber" : "";
    return `
      <tr>
        <td>
          <div class="table-project">
            <span class="project-symbol ${color}">${icon("file", 15)}</span>
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
      </tr>
    `;
  }).join("");

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>${t("invoice")}</th><th>${t("client")}</th><th>${t("amount")}</th><th>${t("dueDate")}</th><th>${t("status")}</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function deadlineList(upcoming) {
  if (!upcoming.length) return empty("noDeadlines", "noDeadlinesText", "calendar");

  const rows = upcoming.map((p, i) => `
    <div class="deadline-row">
      <span class="project-symbol ${i === 1 ? "blue" : i === 2 ? "amber" : ""}">${icon(i === 1 ? "layers" : "link", 17)}</span>
      <div class="row-main"><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml(p.clientName)}</small></div>
      <span class="due-date">${dateText(p.deadline, { month: "short", day: "numeric" })}</span>
    </div>
  `).join("");

  return `<div class="deadline-list">${rows}</div><div class="deadline-footer">${t("deadlineFooter")}</div>`;
}

function buildDashboard(user, clients, projects, invoices) {
  const paid = sumAmount(invoices.filter((i) => i.status === "Paid"));
  const owed = sumAmount(invoices.filter((i) => i.status !== "Paid"));
  const active = projects.filter((p) => p.status !== "Done");

  const upcoming = [...active]
    .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))
    .slice(0, 3);

  const recent = [...invoices]
    .sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""))
    .slice(0, 4);

  const firstName = userName(user).split(" ")[0];
  const date = new Intl.DateTimeFormat(t("dateLocale"), { month: "short", day: "numeric", year: "numeric" }).format(new Date());

  return `
    <div class="page-heading">
      <div>
        <div class="eyebrow">${t("overview")}</div>
        <h1>${t("greeting")} ${escapeHtml(firstName)}<span style="color:var(--accent)">.</span></h1>
        <p>${t("greetingSub")}</p>
      </div>
      <div class="heading-actions">
        <span class="button secondary">${icon("calendar", 15)} ${date}</span>
        <a class="button primary" href="#projects">${icon("plus", 16)} ${t("newProject")}</a>
      </div>
    </div>

    <section class="stats-grid">
      ${statCard("earned", paid, "allTime", "wallet", "green", true)}
      ${statCard("owed", owed, "awaiting", "clock", "red", true)}
      ${statCard("clients", clients.length, "clientCount", "users", "purple", false)}
      ${statCard("activeProjects", active.length, "inMotion", "briefcase", "blue", false)}
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-heading">
          <div><h2>${t("income")}</h2><p>${t("incomeSub")}</p></div>
          <div class="chart-legend">
            <span><i class="legend-dot" style="background:#756ef5"></i>${t("paid")}</span>
            <span><i class="legend-dot" style="background:#d9d7fd"></i>${t("unpaid")}</span>
          </div>
        </div>
        ${chart(invoices)}
      </article>
      <article class="panel">
        <div class="panel-heading">
          <div><h2>${t("deadlines")}</h2><p>${t("deadlinesSub")}</p></div>
          <a class="panel-link" href="#projects">${t("viewAll")} ${t("arrow")}</a>
        </div>
        ${deadlineList(upcoming)}
      </article>
    </section>

    <section class="panel table-panel">
      <div class="panel-heading">
        <div><h2>${t("recentInvoices")}</h2><p>${t("recentSub")}</p></div>
        <a class="panel-link" href="#invoices">${t("viewAll")} ${t("arrow")}</a>
      </div>
      ${invoiceTable(recent, projects)}
    </section>
  `;
}