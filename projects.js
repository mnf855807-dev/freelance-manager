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

let currentUser;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadClients();
    loadProjects();
  } else {
    window.location.href = "login.html";
  }
});

async function loadClients() {
  const select = document.getElementById("clientSelect");
  select.innerHTML = "";

  const q = query(collection(db, "clients"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.data().name;
    select.appendChild(option);
  });
}

async function loadProjects() {
  const list = document.getElementById("projectList");
  list.innerHTML = "";

  const q = query(collection(db, "projects"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach((d) => {
    const p = d.data();
    const li = document.createElement("li");
    li.textContent = p.title + " - " + p.clientName + " - " + p.price + " SAR - " + p.deadline + " - " + p.status + " ";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      await deleteDoc(doc(db, "projects", d.id));
      loadProjects();
    };

    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

document.getElementById("addBtn").onclick = async () => {
  const select = document.getElementById("clientSelect");
  const title = document.getElementById("title");
  const price = document.getElementById("price");
  const deadline = document.getElementById("deadline");
  const status = document.getElementById("status");

  if (title.value === "" || select.value === "") return;

  await addDoc(collection(db, "projects"), {
    clientId: select.value,
    clientName: select.options[select.selectedIndex].text,
    title: title.value,
    price: Number(price.value),
    deadline: deadline.value,
    status: status.value,
    userId: currentUser.uid
  });

  title.value = "";
  price.value = "";
  deadline.value = "";
  loadProjects();
};