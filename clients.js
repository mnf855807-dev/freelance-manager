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
let allClients = [];

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadClients();
  } else {
    window.location.href = "login.html";
  }
});

async function loadClients() {
  const q = query(collection(db, "clients"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  allClients = [];
  snapshot.forEach((d) => {
    allClients.push({ id: d.id, ...d.data() });
  });

  showClients();
}

function showClients() {
  const list = document.getElementById("clientList");
  list.innerHTML = "";

  const text = document.getElementById("search").value.toLowerCase();

  allClients.forEach((client) => {
    const searchable = (client.name + " " + client.phone + " " + client.email).toLowerCase();
    if (!searchable.includes(text)) return;

    const li = document.createElement("li");
    li.textContent = client.name + " - " + client.phone + " - " + client.email + " ";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      await deleteDoc(doc(db, "clients", client.id));
      loadClients();
    };

    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

document.getElementById("search").oninput = showClients;

document.getElementById("addBtn").onclick = async () => {
  const name = document.getElementById("name");
  const phone = document.getElementById("phone");
  const email = document.getElementById("email");

  if (name.value === "") return;

  await addDoc(collection(db, "clients"), {
    name: name.value,
    phone: phone.value,
    email: email.value,
    userId: currentUser.uid
  });

  name.value = "";
  phone.value = "";
  email.value = "";
  loadClients();
};