import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const $ = (selector) => document.querySelector(selector);

const icons = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  projects: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M8 5V3m8 2V3"/>',
  invoices: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  wallet: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M16 14h5v-4h-5a2 2 0 0 0 0 4ZM5 5V4h12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  moon: '<path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  link: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 7h.01M10 7h.01"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6"/>',
  check: '<path d="m5 12 4 4L19 6"/>'
};

export function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ""}</svg>`;
}

const translations = {
  en: {
    workspace: "WORKSPACE", workspaceTitle: "Workspace",
    dashboard: "Dashboard", clients: "Clients", projects: "Projects", invoices: "Invoices",
    sidebarTitle: "Make room for more.", sidebarText: "A little less admin. A lot more doing what you love.",
    logout: "Log out",
    overview: "YOUR BUSINESS AT A GLANCE", greeting: "Good to see you,",
    greetingSub: "Here’s what’s happening with your business today.", newProject: "New project",
    earned: "Total earned", owed: "Still owed", activeProjects: "Active projects",
    allTime: "All time", awaiting: "Awaiting payment", clientCount: "People you work with", inMotion: "Currently in motion",
    income: "Income overview", incomeSub: "Paid and unpaid invoices by due month",
    paid: "Paid", unpaid: "Unpaid",
    deadlines: "Upcoming deadlines", deadlinesSub: "A look at what’s coming up", viewAll: "View all",
    noDeadlines: "No upcoming deadlines", noDeadlinesText: "Your next project deadline will show up here.",
    deadlineFooter: "Keep the good work moving.",
    recentInvoices: "Recent invoices", recentSub: "Your latest billing activity",
    invoice: "Invoice", client: "Client", amount: "Amount", dueDate: "Due date", status: "Status", actions: "Actions",
    clientsHeading: "Your clients, all in one place.", clientsSub: "Keep the people behind your projects close.",
    projectsHeading: "Make progress, beautifully.", projectsSub: "Every project has a place here.",
    invoicesHeading: "Keep the numbers clear.", invoicesSub: "Track what’s paid and what’s on its way.",
    allClients: "All clients", allProjects: "All projects", allInvoices: "All invoices",
    searchClients: "Search clients...", addClient: "Add a client", addClientSub: "A few details to keep in touch.",
    fullName: "Name", phone: "Phone", email: "Email address",
    namePlaceholder: "e.g. Sarah Ahmed", phonePlaceholder: "e.g. +966 50 123 4567", emailPlaceholder: "e.g. sarah@company.com",
    saveClient: "Add client",
    addProject: "Add a project", addProjectSub: "Let’s bring your next idea to life.",
    selectClient: "Select a client", projectTitle: "Project title", projectPlaceholder: "e.g. Website redesign",
    price: "Price (SAR)", deadline: "Deadline", notStarted: "Not started", inProgress: "In progress", done: "Done",
    saveProject: "Add project",
    addInvoice: "Add an invoice", addInvoiceSub: "Keep track of every payment.",
    selectProject: "Select a project", project: "Project", amountSar: "Amount (SAR)", saveInvoice: "Add invoice",
    markPaid: "Mark paid", markUnpaid: "Mark unpaid", delete: "Delete", pdf: "PDF",
    noClients: "No clients yet", noClientsText: "Add your first client to get started.",
    noProjects: "No projects yet", noProjectsText: "Your next great project starts here.",
    noInvoices: "No invoices yet", noInvoicesText: "Invoices you add will appear here.",
    noResults: "No matching clients", noResultsText: "Try a different name, phone or email.",
    needClient: "Add a client before creating a project.", needProject: "Add a project before creating an invoice.",
    deleteConfirm: "Delete this item?",
    addedClient: "Client added.", addedProject: "Project added.", addedInvoice: "Invoice added.",
    deleted: "Item deleted.", statusUpdated: "Invoice status updated.", error: "Please complete all required fields.",
    moneyHint: "SAR", dateLocale: "en-US", arrow: "→"
  },
  ar: {
    workspace: "مساحة العمل", workspaceTitle: "مساحة العمل",
    dashboard: "لوحة التحكم", clients: "العملاء", projects: "المشاريع", invoices: "الفواتير",
    sidebarTitle: "مساحة أكبر لما تحب.", sidebarText: "أعمال إدارية أقل. ووقت أكبر لما تجيده.",
    logout: "تسجيل الخروج",
    overview: "نظرة عامة على أعمالك", greeting: "سعداء برؤيتك،",
    greetingSub: "إليك ما يحدث في أعمالك اليوم.", newProject: "مشروع جديد",
    earned: "إجمالي الأرباح", owed: "المبالغ المستحقة", activeProjects: "المشاريع النشطة",
    allTime: "منذ البداية", awaiting: "بانتظار الدفع", clientCount: "الأشخاص الذين تعمل معهم", inMotion: "قيد التنفيذ حالياً",
    income: "نظرة على الدخل", incomeSub: "الفواتير المدفوعة وغير المدفوعة حسب شهر الاستحقاق",
    paid: "مدفوعة", unpaid: "غير مدفوعة",
    deadlines: "المواعيد القادمة", deadlinesSub: "نظرة على ما ينتظرك", viewAll: "عرض الكل",
    noDeadlines: "لا توجد مواعيد قادمة", noDeadlinesText: "سيظهر موعد مشروعك القادم هنا.",
    deadlineFooter: "خطوة أخرى نحو إنجاز أعمالك.",
    recentInvoices: "الفواتير الأخيرة", recentSub: "آخر نشاط للفوترة",
    invoice: "الفاتورة", client: "العميل", amount: "المبلغ", dueDate: "تاريخ الاستحقاق", status: "الحالة", actions: "الإجراءات",
    clientsHeading: "عملاؤك في مكان واحد.", clientsSub: "ابقَ على تواصل مع الأشخاص وراء مشاريعك.",
    projectsHeading: "تقدّم بثقة.", projectsSub: "كل مشاريعك مرتبة في مكان واحد.",
    invoicesHeading: "كل الأرقام واضحة.", invoicesSub: "تابع ما تم دفعه وما لا يزال مستحقاً.",
    allClients: "كل العملاء", allProjects: "كل المشاريع", allInvoices: "كل الفواتير",
    searchClients: "البحث عن عميل...", addClient: "إضافة عميل", addClientSub: "بعض التفاصيل للبقاء على تواصل.",
    fullName: "الاسم", phone: "الهاتف", email: "البريد الإلكتروني",
    namePlaceholder: "مثال: سارة أحمد", phonePlaceholder: "مثال: ‎+966 50 123 4567", emailPlaceholder: "مثال: sarah@company.com",
    saveClient: "إضافة العميل",
    addProject: "إضافة مشروع", addProjectSub: "لنبدأ العمل على فكرتك القادمة.",
    selectClient: "اختر عميلاً", projectTitle: "عنوان المشروع", projectPlaceholder: "مثال: إعادة تصميم الموقع",
    price: "السعر (ر.س)", deadline: "الموعد النهائي", notStarted: "لم يبدأ", inProgress: "قيد التنفيذ", done: "مكتمل",
    saveProject: "إضافة المشروع",
    addInvoice: "إضافة فاتورة", addInvoiceSub: "تابع جميع مدفوعاتك بسهولة.",
    selectProject: "اختر مشروعاً", project: "المشروع", amountSar: "المبلغ (ر.س)", saveInvoice: "إضافة الفاتورة",
    markPaid: "تحديد كمدفوعة", markUnpaid: "تحديد كغير مدفوعة", delete: "حذف", pdf: "PDF",
    noClients: "لا يوجد عملاء بعد", noClientsText: "أضف أول عميل للبدء.",
    noProjects: "لا توجد مشاريع بعد", noProjectsText: "مشروعك الرائع القادم يبدأ هنا.",
    noInvoices: "لا توجد فواتير بعد", noInvoicesText: "ستظهر الفواتير التي تضيفها هنا.",
    noResults: "لم يتم العثور على عملاء", noResultsText: "جرّب اسماً أو هاتفاً أو بريداً آخر.",
    needClient: "أضف عميلاً قبل إنشاء مشروع.", needProject: "أضف مشروعاً قبل إنشاء فاتورة.",
    deleteConfirm: "هل تريد حذف هذا العنصر؟",
    addedClient: "تمت إضافة العميل.", addedProject: "تمت إضافة المشروع.", addedInvoice: "تمت إضافة الفاتورة.",
    deleted: "تم الحذف.", statusUpdated: "تم تحديث حالة الفاتورة.", error: "يرجى إكمال جميع الحقول المطلوبة.",
    moneyHint: "ر.س", dateLocale: "ar-SA-u-ca-gregory", arrow: "←"
  }
};

export const lang = localStorage.getItem("fm_lang") === "ar" ? "ar" : "en";
let theme = localStorage.getItem("fm_theme") === "dark" ? "dark" : "light";

export const t = (key) => translations[lang][key] || key;

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

export function number(value) {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

export function money(value) {
  return `${number(value)} <span class="currency">${t("moneyHint")}</span>`;
}

export function moneyText(value) {
  return `${number(value)} ${t("moneyHint")}`;
}

export function dateText(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";
  const d = new Date(value + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(t("dateLocale"), options).format(d);
}

const statusKeys = { "Paid": "paid", "Unpaid": "unpaid", "Not started": "notstarted", "In progress": "progress", "Done": "done" };
const statusLabels = { paid: "paid", unpaid: "unpaid", notstarted: "notStarted", progress: "inProgress", done: "done" };

export function badge(status) {
  const key = statusKeys[status] || "notstarted";
  return `<span class="badge ${key}">${t(statusLabels[key])}</span>`;
}

export function empty(title, text, image = "file") {
  return `<div class="empty-state"><div class="empty-icon">${icon(image, 20)}</div><strong>${t(title)}</strong><p>${t(text)}</p></div>`;
}

export function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 3000);
}

export function userName(user) {
  if (user.displayName) return user.displayName;
  const name = user.email.split("@")[0].replace(/[._-]+/g, " ");
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function startShell(page, user) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
  html.dataset.theme = theme;
  document.title = t(page) + " — Freelance Manager";

  const name = userName(user);
  const links = ["dashboard", "clients", "projects", "invoices"].map((item) => `
    <a href="${item}.html" class="nav-link ${item === page ? "active" : ""}">${icon(item, 17)}<span>${t(item)}</span></a>
  `).join("");

  $("#app").innerHTML = `
    <div class="app-shell">
      <div class="mobile-overlay" id="mobileOverlay"></div>
      <aside class="sidebar" id="sidebar">
        <a href="dashboard.html" class="brand">
          <span class="brand-mark"><span></span><span></span><span></span></span>
          <span class="brand-copy"><strong>freelance<span>.</span></strong><small>MANAGER</small></span>
        </a>
        <div class="workspace-label">${t("workspace")}</div>
        <nav class="nav">${links}</nav>
        <div class="sidebar-bottom">
          <div class="sidebar-help">
            <div class="help-icon" aria-hidden="true">✦</div>
            <strong>${t("sidebarTitle")}</strong>
            <p>${t("sidebarText")}</p>
          </div>
          <button class="user-block" id="logoutButton" type="button" title="${t("logout")}">
            <span class="user-avatar">${escapeHtml(name.charAt(0).toUpperCase())}</span>
            <span class="user-info"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(user.email)}</small></span>
            <span class="logout-icon">${icon("logout", 16)}</span>
          </button>
        </div>
      </aside>
      <div class="main-shell">
        <header class="topbar">
          <div class="topbar-left">
            <button class="icon-button mobile-menu" id="menuButton" type="button" aria-label="Menu">${icon("menu", 20)}</button>
            <div class="breadcrumb"><span>${t("workspaceTitle")}</span><span class="breadcrumb-sep">/</span><strong>${t(page)}</strong></div>
          </div>
          <div class="topbar-actions">
            <button class="language-button" id="languageButton" type="button">${lang === "en" ? "عربي" : "EN"}</button>
            <button class="icon-button" id="themeButton" type="button" aria-label="Theme">${icon(theme === "dark" ? "sun" : "moon", 18)}</button>
            <span class="top-avatar">${escapeHtml(name.charAt(0).toUpperCase())}</span>
          </div>
        </header>
        <main id="mainContent" tabindex="-1"></main>
      </div>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
  `;

  $("#menuButton").onclick = () => {
    const opened = $("#sidebar").classList.toggle("open");
    $("#mobileOverlay").classList.toggle("open", opened);
  };

  $("#mobileOverlay").onclick = () => {
    $("#sidebar").classList.remove("open");
    $("#mobileOverlay").classList.remove("open");
  };

  $("#languageButton").onclick = () => {
    localStorage.setItem("fm_lang", lang === "en" ? "ar" : "en");
    location.reload();
  };

  $("#themeButton").onclick = () => {
    theme = theme === "light" ? "dark" : "light";
    localStorage.setItem("fm_theme", theme);
    html.dataset.theme = theme;
    $("#themeButton").innerHTML = icon(theme === "dark" ? "sun" : "moon", 18);
  };

  $("#logoutButton").onclick = () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    });
  };

  import("./helper.js").then((module) => module.startHelper(user));
}
export function heading(title, subtitle) {
    return `<div class="page-heading"><div><div class="eyebrow">${t("workspaceTitle")}</div><h1>${title}</h1><p>${subtitle}</p></div></div>`;
  }
  
  export function field(label, name, type, placeholder = "", attributes = "") {
    return `<div class="field"><label for="${name}">${t(label)}</label><input id="${name}" name="${name}" type="${type}" placeholder="${escapeHtml(placeholder)}" ${attributes}></div>`;
  }
  
  export function selectField(label, name, options, placeholder) {
    const items = options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join("");
    return `<div class="field"><label for="${name}">${t(label)}</label><select id="${name}" name="${name}" required><option value="">${t(placeholder)}</option>${items}</select></div>`;
  }