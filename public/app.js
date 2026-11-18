import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { $, startApp, setActive } from "./shell.js";

// Pages that already run inside the single page. The others still open as normal pages.
const converted = ["dashboard", "clients", "client", "projects", "invoices"];

const navFor = {
  dashboard: "dashboard",
  clients: "clients",
  client: "clients",
  projects: "projects",
  invoices: "invoices",
  profile: "profile"
};

let currentUser;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  startApp(user);
  route();
});

window.addEventListener("hashchange", () => {
  if (currentUser) route();
});

async function route() {
  const parts = window.location.hash.slice(1).split("/");
  const name = navFor[parts[0]] ? parts[0] : "dashboard";

  if (!converted.includes(name)) {
    window.location.href = name + ".html" + (parts[1] ? "#" + parts[1] : "");
    return;
  }

  setActive(navFor[name]);
  $("#mainContent").innerHTML = "";

  const module = await import("./" + name + ".js");
  await module.show(currentUser, parts[1]);
}