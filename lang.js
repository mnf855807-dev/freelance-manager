const dict = {
    "Freelance Manager": "مدير العمل الحر",
    "Manage your clients, projects and invoices.": "أدر عملاءك ومشاريعك وفواتيرك.",
    "Email": "البريد الإلكتروني",
    "Password": "كلمة المرور",
    "Login": "تسجيل الدخول",
    "Create account": "إنشاء حساب",
    "Continue with Google": "المتابعة باستخدام Google",
    "Dashboard": "لوحة التحكم",
    "Clients": "العملاء",
    "Projects": "المشاريع",
    "Invoices": "الفواتير",
    "Logout": "تسجيل الخروج",
    "Your freelance business at a glance.": "نظرة سريعة على عملك الحر.",
    "Total earned": "إجمالي المحصّل",
    "Still owed": "المبالغ المستحقة",
    "Active projects": "المشاريع النشطة",
    "Income by month": "الدخل الشهري",
    "Upcoming deadlines": "المواعيد القادمة",
    "People and companies you work for.": "الأشخاص والشركات التي تعمل معهم.",
    "Add client": "إضافة عميل",
    "All clients": "كل العملاء",
    "Name": "الاسم",
    "Phone": "الهاتف",
    "Search clients...": "ابحث عن العملاء...",
    "Delete": "حذف",
    "Track the work you do for each client.": "تابع العمل الذي تنجزه لكل عميل.",
    "Add project": "إضافة مشروع",
    "All projects": "كل المشاريع",
    "Client": "العميل",
    "Deadline": "الموعد النهائي",
    "Status": "الحالة",
    "Not started": "لم يبدأ",
    "In progress": "قيد التنفيذ",
    "Done": "مكتمل",
    "Project title": "عنوان المشروع",
    "Price (SAR)": "السعر (ر.س)",
    "See what is paid and what is still owed.": "شاهد ما تم دفعه وما هو مستحق.",
    "Add invoice": "إضافة فاتورة",
    "All invoices": "كل الفواتير",
    "Project": "المشروع",
    "Due date": "تاريخ الاستحقاق",
    "Unpaid": "غير مدفوعة",
    "Paid": "مدفوعة",
    "Amount (SAR)": "المبلغ (ر.س)",
    "Mark paid": "تحديد كمدفوعة",
    "Mark unpaid": "تحديد كغير مدفوعة",
    "Dark mode": "الوضع الداكن",
    "Light mode": "الوضع الفاتح",
    "SAR": "ر.س"
  };
  
  const lang = localStorage.getItem("lang") || "en";
  
  function tr(text) {
    const key = text.trim();
    if (dict[key]) return text.replace(key, dict[key]);
    return text.replace(/ SAR/g, " ر.س").replace(" - due ", " - الاستحقاق ");
  }
  
  function translate(node) {
    if (node.nodeType === 3) {
      node.nodeValue = tr(node.nodeValue);
      return;
    }
    if (node.nodeType !== 1 || node.tagName === "SCRIPT") return;
  
    if (node.tagName === "OPTION" && !node.hasAttribute("value")) {
      node.setAttribute("value", node.textContent);
    }
    if (node.placeholder && dict[node.placeholder]) {
      node.placeholder = dict[node.placeholder];
    }
    node.childNodes.forEach(translate);
  }
  
  const langBtn = document.createElement("button");
  langBtn.id = "langBtn";
  langBtn.className = "secondary";
  langBtn.textContent = lang === "ar" ? "English" : "العربية";
  langBtn.onclick = () => {
    localStorage.setItem("lang", lang === "ar" ? "en" : "ar");
    location.reload();
  };
  document.body.appendChild(langBtn);
  
  if (lang === "ar") {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    translate(document.body);
  
    new MutationObserver((mutations) => {
      mutations.forEach((m) => m.addedNodes.forEach(translate));
    }).observe(document.body, { childList: true, subtree: true });
  }