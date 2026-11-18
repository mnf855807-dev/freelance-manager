import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const copy = {
  en: {
    appName: 'Freelance Manager', eyebrow: 'YOUR WORK, IN GOOD ORDER',
    headline: 'Make room for<br>your best work.',
    tagline: 'A calmer way to keep clients, projects and payments moving.',
    workspace: 'YOUR WORKSPACE', steadyProgress: 'Steady progress',
    brandNote: 'A little more clarity, every day.', welcome: 'WELCOME BACK',
    signInTitle: 'Sign in to your workspace', signInSubtitle: 'Pick up right where you left off.',
    emailLabel: 'Email address', passwordLabel: 'Password', showPassword: 'Show', hidePassword: 'Hide',
    login: 'Log in', orContinue: 'or continue with', google: 'Continue with Google',
    noAccount: 'New to Freelance Manager?', createAccount: 'Create account',
    footer: 'Simple tools for independent work.', language: 'العربية',
    switchLanguage: 'Switch language to Arabic',
    switchThemeLight: 'Switch to light theme', switchThemeDark: 'Switch to dark theme',
    fillError: 'Please enter a valid email and a password.',
    wrongLogin: 'Wrong email or password.',
    emailUsed: 'This email is already used.',
    weakPassword: 'Password must be at least 6 characters.',
    genericError: 'Could not sign in. Please try again.',
    forgot: 'Forgot password?',
    resetEmail: 'Enter your email above first, then click "Forgot password?".',
    resetSent: 'Reset link sent. Check your email (and your spam folder).'
  },
  ar: {
    appName: 'مدير العمل الحر', eyebrow: 'عملك، بكل ترتيب',
    headline: 'مساحة أوسع<br>لأفضل أعمالك.',
    tagline: 'طريقة أكثر هدوءًا لإدارة العملاء والمشاريع والمدفوعات.',
    workspace: 'مساحة عملك', steadyProgress: 'تقدّم ثابت',
    brandNote: 'وضوح أكثر، يومًا بعد يوم.', welcome: 'مرحبًا بعودتك',
    signInTitle: 'سجّل الدخول إلى مساحة عملك', signInSubtitle: 'تابع من حيث توقفت.',
    emailLabel: 'البريد الإلكتروني', passwordLabel: 'كلمة المرور', showPassword: 'إظهار', hidePassword: 'إخفاء',
    login: 'تسجيل الدخول', orContinue: 'أو المتابعة باستخدام', google: 'المتابعة باستخدام Google',
    noAccount: 'جديد على مدير العمل الحر؟', createAccount: 'إنشاء حساب',
    footer: 'أدوات بسيطة للعمل المستقل.', language: 'English',
    switchLanguage: 'Switch language to English',
    switchThemeLight: 'التبديل إلى المظهر الفاتح', switchThemeDark: 'التبديل إلى المظهر الداكن',
    fillError: 'يرجى إدخال بريد إلكتروني صالح وكلمة مرور.',
    wrongLogin: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    emailUsed: 'هذا البريد الإلكتروني مستخدم بالفعل.',
    weakPassword: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    genericError: 'تعذّر تسجيل الدخول. حاول مرة أخرى.',
    forgot: 'نسيت كلمة المرور؟',
    resetEmail: 'أدخل بريدك الإلكتروني أعلاه أولاً، ثم اضغط "نسيت كلمة المرور؟".',
    resetSent: 'تم إرسال رابط إعادة التعيين. تحقق من بريدك (ومن مجلد الرسائل غير المرغوبة).'
  }
};

const $ = (selector) => document.querySelector(selector);
const html = document.documentElement;
const form = $('#loginForm');
const emailField = $('#email');
const passwordField = $('#password');
const errorBox = $('#errorMessage');
const passwordToggle = $('#passwordToggle');

let lang = localStorage.getItem('fm_lang') === 'ar' ? 'ar' : 'en';
let theme = localStorage.getItem('fm_theme') === 'dark' ? 'dark' : 'light';

function translate(key) {
  return copy[lang][key] || key;
}

function setLanguage(value) {
  lang = value;
  localStorage.setItem('fm_lang', lang);
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = lang === 'ar' ? 'تسجيل الدخول — مدير العمل الحر' : 'Sign in — Freelance Manager';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.innerHTML = translate(el.dataset.i18n);
  });
  $('#languageToggle').setAttribute('aria-label', translate('switchLanguage'));
  passwordToggle.textContent = translate(passwordField.type === 'password' ? 'showPassword' : 'hidePassword');
  hideError();
}

function setTheme(value) {
  theme = value;
  document.body.dataset.theme = theme;
  localStorage.setItem('fm_theme', theme);
  const label = translate(theme === 'light' ? 'switchThemeDark' : 'switchThemeLight');
  $('#themeToggle').setAttribute('aria-label', label);
  $('#themeToggle').title = label;
}

function showError(message) {
  errorBox.classList.remove('success');
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function showSuccess(message) {
  errorBox.classList.add('success');
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.classList.remove('success');
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function checkFields() {
  hideError();
  if (!emailField.value.trim() || !emailField.validity.valid || passwordField.value === '') {
    showError(translate('fillError'));
    return false;
  }
  return true;
}

function goToDashboard() {
  window.location.href = 'dashboard.html';
}

function handleError(error) {
  const map = {
    'auth/invalid-credential': 'wrongLogin',
    'auth/wrong-password': 'wrongLogin',
    'auth/user-not-found': 'wrongLogin',
    'auth/email-already-in-use': 'emailUsed',
    'auth/weak-password': 'weakPassword'
  };
  showError(translate(map[error.code] || 'genericError'));
}

$('#themeToggle').addEventListener('click', () => setTheme(theme === 'light' ? 'dark' : 'light'));
$('#languageToggle').addEventListener('click', () => setLanguage(lang === 'en' ? 'ar' : 'en'));

passwordToggle.addEventListener('click', () => {
  const reveal = passwordField.type === 'password';
  passwordField.type = reveal ? 'text' : 'password';
  passwordToggle.textContent = translate(reveal ? 'hidePassword' : 'showPassword');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!checkFields()) return;
  signInWithEmailAndPassword(auth, emailField.value.trim(), passwordField.value)
    .then(goToDashboard)
    .catch(handleError);
});

$('#createAccount').addEventListener('click', () => {
  if (!checkFields()) return;
  createUserWithEmailAndPassword(auth, emailField.value.trim(), passwordField.value)
    .then(goToDashboard)
    .catch(handleError);
});

$('#googleButton').addEventListener('click', () => {
  signInWithPopup(auth, new GoogleAuthProvider())
    .then(goToDashboard)
    .catch(handleError);
});

$('#forgotPassword').addEventListener('click', () => {
  hideError();
  if (!emailField.value.trim() || !emailField.validity.valid) {
    showError(translate('resetEmail'));
    emailField.focus();
    return;
  }
  sendPasswordResetEmail(auth, emailField.value.trim())
    .then(() => showSuccess(translate('resetSent')))
    .catch(handleError);
});

emailField.addEventListener('input', hideError);

setLanguage(lang);
setTheme(theme);