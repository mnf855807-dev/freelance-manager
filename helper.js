import { auth, db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, lang, escapeHtml, moneyText, dateText } from "./shell.js";

const text = {
  en: {
    title: "Helper",
    placeholder: "Ask about your work...",
    send: "Send",
    hello: "Hi! I can answer questions about your clients, projects and invoices. Tap a question below, or type your own.",
    chips: {
      unpaid: "How much is unpaid?",
      earned: "How much did I earn?",
      deadlines: "Upcoming deadlines",
      overdue: "Overdue invoices",
      active: "Projects in progress"
    },
    unpaidTotal: "You are still owed",
    noUnpaid: "You have no unpaid invoices.",
    earnedTotal: "You have earned",
    earnedFrom: (n) => "from " + n + " paid invoice" + (n === 1 ? "" : "s") + ".",
    noEarned: "No paid invoices yet.",
    deadlinesTitle: "Your next deadlines:",
    noDeadlines: "You have no active projects with deadlines.",
    overdueTitle: "These invoices are overdue:",
    noOverdue: "No overdue invoices. Nice!",
    activeTitle: "Projects in progress:",
    noActive: "No projects are in progress right now.",
    clientsCount: (n) => "You have " + n + " client" + (n === 1 ? "" : "s") + ".",
    due: "due",
    clientProjects: (name, n) => name + " has " + n + " project" + (n === 1 ? "" : "s") + ":",
    clientNone: (name) => name + " has no projects yet.",
    clientOwed: "Still owed by this client:",
    notUnderstood: "I didn't understand that. Try one of the questions below, or ask about a client by name.",
    statuses: { "Not started": "Not started", "In progress": "In progress", "Done": "Done" }
  },
  ar: {
    title: "المساعد",
    placeholder: "اسأل عن عملك...",
    send: "إرسال",
    hello: "مرحباً! يمكنني الإجابة عن أسئلتك حول العملاء والمشاريع والفواتير. اختر سؤالاً أدناه أو اكتب سؤالك.",
    chips: {
      unpaid: "كم المبلغ غير المدفوع؟",
      earned: "كم ربحت؟",
      deadlines: "المواعيد القادمة",
      overdue: "الفواتير المتأخرة",
      active: "المشاريع قيد التنفيذ"
    },
    unpaidTotal: "المبلغ المستحق لك",
    noUnpaid: "لا توجد فواتير غير مدفوعة.",
    earnedTotal: "إجمالي ما حصّلته",
    earnedFrom: (n) => "من " + n + " فاتورة مدفوعة.",
    noEarned: "لا توجد فواتير مدفوعة بعد.",
    deadlinesTitle: "مواعيدك القادمة:",
    noDeadlines: "لا توجد مشاريع نشطة لها مواعيد.",
    overdueTitle: "هذه الفواتير متأخرة:",
    noOverdue: "لا توجد فواتير متأخرة. أحسنت!",
    activeTitle: "المشاريع قيد التنفيذ:",
    noActive: "لا توجد مشاريع قيد التنفيذ حالياً.",
    clientsCount: (n) => "لديك " + n + " عميل.",
    due: "الاستحقاق",
    clientProjects: (name, n) => "لدى " + name + " " + n + " مشروع:",
    clientNone: (name) => "لا توجد مشاريع لـ " + name + " بعد.",
    clientOwed: "المبلغ المستحق على هذا العميل:",
    notUnderstood: "لم أفهم سؤالك. جرّب أحد الأسئلة أدناه أو اسأل عن عميل بالاسم.",
    statuses: { "Not started": "لم يبدأ", "In progress": "قيد التنفيذ", "Done": "مكتمل" }
  }
};
const L = text[lang];

const intents = [
  { id: "overdue", words: ["overdue", "late", "متأخر"] },
  { id: "unpaid", words: ["unpaid", "owed", "owe", "outstanding", "غير مدفوع", "غير المدفوع", "مستحق", "متبقي"] },
  { id: "earned", words: ["earn", "paid", "income", "revenue", "مدفوع", "ربح", "أرباح", "دخل", "حصلت"] },
  { id: "deadlines", words: ["deadline", "upcoming", "due", "موعد", "مواعيد", "تسليم"] },
  { id: "active", words: ["progress", "active", "ongoing", "current", "قيد", "نشط"] },
  { id: "clients", words: ["how many clients", "number of clients", "كم عميل", "عدد العملاء"] }
];

let currentUser;

export function startHelper(user) {
  if ($("#helperButton")) return;
  currentUser = user;

  const box = document.createElement("div");
  box.innerHTML = `
    <button class="helper-button" id="helperButton" type="button" aria-label="${L.title}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>
    <section class="helper-panel" id="helperPanel" hidden>
      <header class="helper-header">
        <strong>${L.title}</strong>
        <button class="helper-close" id="helperClose" type="button" aria-label="Close">×</button>
      </header>
      <div class="helper-messages" id="helperMessages"></div>
      <div class="helper-chips">
        ${Object.keys(L.chips).map((id) => `<button type="button" data-intent="${id}">${L.chips[id]}</button>`).join("")}
      </div>
      <form class="helper-form" id="helperForm">
        <input id="helperInput" dir="auto" type="text" placeholder="${L.placeholder}" autocomplete="off">
        <button class="button primary small" type="submit">${L.send}</button>
      </form>
    </section>
  `;
  document.body.appendChild(box);

  addMessage("bot", L.hello);

  $("#helperButton").onclick = () => {
    const panel = $("#helperPanel");
    panel.hidden = !panel.hidden;
    if (!panel.hidden) $("#helperInput").focus();
  };

  $("#helperClose").onclick = () => {
    $("#helperPanel").hidden = true;
  };

  document.querySelectorAll(".helper-chips button").forEach((button) => {
    button.onclick = () => ask(button.textContent, button.dataset.intent);
  });

  $("#helperForm").onsubmit = (event) => {
    event.preventDefault();
    const input = $("#helperInput");
    const question = input.value.trim();
    if (!question) return;
    input.value = "";
    ask(question, null);
  };
}

function addMessage(who, html) {
  const messages = $("#helperMessages");
  const div = document.createElement("div");
  div.className = "helper-msg " + who;
  div.innerHTML = html;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

async function getList(name) {
  const snapshot = await getDocs(query(collection(db, name), where("userId", "==", currentUser.uid)));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function ask(question, intent) {
  addMessage("user", escapeHtml(question));

  const data = {
    clients: await getList("clients"),
    projects: await getList("projects"),
    invoices: await getList("invoices")
  };

  let answer;
  if (intent) {
    answer = reply(intent, data);
  } else {
    const client = findClient(question, data.clients);
    answer = client ? clientReply(client, data) : reply(detect(question.toLowerCase()), data);
  }

  addMessage("bot", answer);
}

function detect(q) {
  const found = intents.find((intent) => intent.words.some((word) => q.includes(word)));
  return found ? found.id : "unknown";
}

function findClient(question, clients) {
  const q = question.toLowerCase();
  const words = q.split(/[\s،,؟?.!]+/);

  return clients.find((c) => {
    const name = c.name.toLowerCase();
    const first = name.split(" ")[0];
    return q.includes(name) || (first.length >= 3 && words.includes(first));
  });
}

function list(items) {
  return items.map((item) => "• " + item).join("<br>");
}

function sum(invoices) {
  return invoices.reduce((total, i) => total + Number(i.amount), 0);
}

function today() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function invoiceLines(invoices) {
  return invoices.map((i) => escapeHtml(i.projectTitle) + " — " + moneyText(i.amount) + " (" + L.due + " " + dateText(i.dueDate) + ")");
}

function projectLines(projects) {
  return projects.map((p) => escapeHtml(p.title) + " (" + escapeHtml(p.clientName) + ") — " + dateText(p.deadline));
}

function byDeadline(a, b) {
  return (a.deadline || "").localeCompare(b.deadline || "");
}

function reply(intent, data) {
  const { clients, projects, invoices } = data;

  if (intent === "unpaid") {
    const unpaid = invoices.filter((i) => i.status !== "Paid");
    if (!unpaid.length) return L.noUnpaid;
    return L.unpaidTotal + " <b>" + moneyText(sum(unpaid)) + "</b>:<br>" + list(invoiceLines(unpaid));
  }

  if (intent === "earned") {
    const paid = invoices.filter((i) => i.status === "Paid");
    if (!paid.length) return L.noEarned;
    return L.earnedTotal + " <b>" + moneyText(sum(paid)) + "</b> " + L.earnedFrom(paid.length);
  }

  if (intent === "deadlines") {
    const next = projects.filter((p) => p.status !== "Done").sort(byDeadline).slice(0, 5);
    if (!next.length) return L.noDeadlines;
    return L.deadlinesTitle + "<br>" + list(projectLines(next));
  }

  if (intent === "overdue") {
    const late = invoices.filter((i) => i.status !== "Paid" && i.dueDate && i.dueDate < today());
    if (!late.length) return L.noOverdue;
    return L.overdueTitle + "<br>" + list(invoiceLines(late));
  }

  if (intent === "active") {
    const running = projects.filter((p) => p.status === "In progress").sort(byDeadline);
    if (!running.length) return L.noActive;
    return L.activeTitle + "<br>" + list(projectLines(running));
  }

  if (intent === "clients") {
    return L.clientsCount(clients.length);
  }

  return L.notUnderstood;
}

function clientReply(client, data) {
  const name = escapeHtml(client.name);
  const projects = data.projects.filter((p) => p.clientId === client.id);
  if (!projects.length) return L.clientNone(name);

  const ids = projects.map((p) => p.id);
  const owed = sum(data.invoices.filter((i) => ids.includes(i.projectId) && i.status !== "Paid"));

  const lines = projects.map((p) => escapeHtml(p.title) + " — " + (L.statuses[p.status] || p.status) + " — " + dateText(p.deadline));
  let html = L.clientProjects(name, projects.length) + "<br>" + list(lines);

  if (owed > 0) {
    html += "<br><br>" + L.clientOwed + " <b>" + moneyText(owed) + "</b>";
  }
  return html;
}