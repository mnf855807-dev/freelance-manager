import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, lang, icon, escapeHtml, heading, field, startShell, showToast } from "./shell.js";

const text = {
  en: {
    title: "Your business profile",
    subtitle: "This information appears on your PDF invoices.",
    businessName: "Business name",
    businessPlaceholder: "e.g. Mohammed Web Studio",
    ownerName: "Your name",
    ownerPlaceholder: "e.g. Mohammed",
    phone: "Phone",
    email: "Contact email",
    address: "Address",
    addressPlaceholder: "e.g. Jeddah, Saudi Arabia",
    paymentNote: "Payment details",
    paymentPlaceholder: "e.g. Bank name, account name, IBAN",
    logo: "Logo",
    logoHint: "PNG or JPG. It is resized automatically.",
    removeLogo: "Remove logo",
    save: "Save profile",
    saved: "Profile saved.",
    logoError: "Please choose an image file.",
    loadError: "Could not load the profile. Check the Firestore rules."
  },
  ar: {
    title: "الملف التجاري",
    subtitle: "تظهر هذه المعلومات في فواتير PDF الخاصة بك.",
    businessName: "اسم النشاط",
    businessPlaceholder: "مثال: استوديو محمد للويب",
    ownerName: "اسمك",
    ownerPlaceholder: "مثال: محمد",
    phone: "الهاتف",
    email: "البريد الإلكتروني للتواصل",
    address: "العنوان",
    addressPlaceholder: "مثال: جدة، المملكة العربية السعودية",
    paymentNote: "تفاصيل الدفع",
    paymentPlaceholder: "مثال: اسم البنك، اسم الحساب، الآيبان",
    logo: "الشعار",
    logoHint: "PNG أو JPG، ويتم تصغيره تلقائياً.",
    removeLogo: "إزالة الشعار",
    save: "حفظ الملف",
    saved: "تم حفظ الملف.",
    logoError: "يرجى اختيار ملف صورة.",
    loadError: "تعذّر تحميل الملف. تحقق من قواعد Firestore."
  }
};
const L = text[lang];

let currentUser;
let profile = {};
let logoData = "";
let logoWidth = 0;
let logoHeight = 0;

import { quickShell } from "./shell.js";
quickShell("profile");
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  startShell("profile", user);

  try {
    const snapshot = await getDoc(doc(db, "profiles", user.uid));
    profile = snapshot.exists() ? snapshot.data() : {};
  } catch (error) {
    showToast(L.loadError);
  }

  logoData = profile.logo || "";
  logoWidth = profile.logoWidth || 0;
  logoHeight = profile.logoHeight || 0;
  showPage();
});

function showPage() {
  $("#mainContent").innerHTML = `
    ${heading(L.title, L.subtitle)}
    <section class="panel form-panel" style="max-width:560px">
      <form class="form-grid" id="profileForm">
        ${field(L.businessName, "businessName", "text", L.businessPlaceholder, 'maxlength="80"')}
        ${field(L.ownerName, "ownerName", "text", L.ownerPlaceholder, 'maxlength="80"')}
        ${field(L.phone, "phone", "tel", "+966 50 123 4567", 'maxlength="40"')}
        ${field(L.email, "email", "email", "you@example.com", 'maxlength="120"')}
        ${field(L.address, "address", "text", L.addressPlaceholder, 'maxlength="150"')}
        <div class="field">
          <label for="paymentNote">${L.paymentNote}</label>
          <textarea id="paymentNote" name="paymentNote" rows="3" maxlength="300" placeholder="${escapeHtml(L.paymentPlaceholder)}"></textarea>
        </div>
        <div class="field">
          <label for="logoFile">${L.logo}</label>
          <div id="logoPreview"></div>
          <input id="logoFile" type="file" accept="image/*">
          <small class="form-note">${L.logoHint}</small>
        </div>
        <button class="button primary" type="submit">${icon("check", 15)} ${L.save}</button>
      </form>
    </section>
  `;

  ["businessName", "ownerName", "phone", "email", "address", "paymentNote"].forEach((key) => {
    $("#" + key).value = profile[key] || "";
  });

  showLogo();
  $("#logoFile").onchange = chooseLogo;
  $("#profileForm").onsubmit = saveProfile;
}

function showLogo() {
  if (!logoData) {
    $("#logoPreview").innerHTML = "";
    return;
  }

  $("#logoPreview").innerHTML = `
    <img src="${logoData}" alt="" style="max-width:120px;max-height:80px;display:block;margin-bottom:8px">
    <button class="button ghost small" type="button" id="removeLogo">${L.removeLogo}</button>
  `;

  $("#removeLogo").onclick = () => {
    logoData = "";
    logoWidth = 0;
    logoHeight = 0;
    showLogo();
  };
}

function chooseLogo(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast(L.logoError);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      if (!img.width || !img.height) {
        showToast(L.logoError);
        return;
      }

      const scale = Math.min(1, 300 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

      logoData = canvas.toDataURL("image/png");
      logoWidth = canvas.width;
      logoHeight = canvas.height;
      showLogo();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

async function saveProfile(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));

  await setDoc(doc(db, "profiles", currentUser.uid), {
    businessName: values.businessName.trim(),
    ownerName: values.ownerName.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
    paymentNote: values.paymentNote.trim(),
    logo: logoData,
    logoWidth: logoWidth,
    logoHeight: logoHeight,
    userId: currentUser.uid
  });

  showToast(L.saved);
}