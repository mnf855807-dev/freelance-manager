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
  } else {
    window.location.href = "login.html";
  }
});

async function loadClients() {
  const list = document.getElementById("clientList");
  list.innerHTML = "";

  const q = query(collection(db, "clients"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach((d) => {
    const client = d.data();
    const li = document.createElement("li");
    li.textContent = client.name + " - " + client.phone + " - " + client.email + " ";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      await deleteDoc(doc(db, "clients", d.id));
      loadClients();
    };

    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

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