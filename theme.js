const saved = localStorage.getItem("theme");
if (saved === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
}

const btn = document.createElement("button");
btn.id = "themeBtn";
btn.className = "secondary";
btn.textContent = saved === "dark" ? "Light mode" : "Dark mode";

btn.onclick = () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    btn.textContent = "Dark mode";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    btn.textContent = "Light mode";
  }
};

document.body.appendChild(btn);