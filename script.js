/* ===============================
   FIREBASE IMPORTS
================================ */

import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* ===============================
   FIREBASE CONFIG
================================ */

const firebaseConfig = {
  apiKey: "AIzaSyD7sHTLny_kAtTN_xXmkovFC-GSTtFMeNo",
  authDomain: "prdv-platform.firebaseapp.com",
  projectId: "prdv-platform"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===============================
   10 WEEK PROGRAM ENGINE
================================ */

const PROGRAM_START = new Date("2026-02-16"); // adjust if needed

const PROGRAM = {
  1: {
    1: {
      title: "Upper Strength Circuit",
      warmup: [
        "McGill Curl Up",
        "Side Plank",
        "Bird Dog"
      ],
      main: [
        "Goblet Step Up 3x8",
        "Split Stance RDL 3x8",
        "Skater Squat 3x10"
      ],
      conditioning: [
        "60min Zone 2 Run"
      ]
    },
    2: {
      title: "Erg Conditioning",
      warmup: [
        "McGill Big 3"
      ],
      main: [
        "Ski Erg 3x400m",
        "Row Erg 3x500m"
      ],
      conditioning: [
        "8 Burpees x 3 rounds"
      ]
    }
  }
};

/* ===============================
   CALCULATE CURRENT WEEK/DAY
================================ */

function getProgramPosition() {

  const today = new Date();
  const diff = today - PROGRAM_START;

  const daysSinceStart = Math.floor(diff / (1000 * 60 * 60 * 24));

  const week = Math.floor(daysSinceStart / 7) + 1;
  const day = (daysSinceStart % 7) + 1;

  return { week, day };
}

/* ===============================
   RENDER TODAY SESSION
================================ */

function renderTodaySession() {

  const { week, day } = getProgramPosition();

  const session = PROGRAM[week]?.[day];

  const container = document.getElementById("todayWorkout");

  if (!session) {
    container.innerHTML = `
      <div class="card">
        <h2>Program Complete</h2>
        <p>No session scheduled.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card">
      <h2>🔥 TODAY'S MISSION</h2>
      <h3>${session.title}</h3>

      <hr>

      <strong>Warm-Up</strong>
      <ul>
        ${session.warmup.map(e => `<li>${e}</li>`).join("")}
      </ul>

      <strong>Main Work</strong>
      <ul>
        ${session.main.map(e => `<li>${e}</li>`).join("")}
      </ul>

      <strong>Conditioning</strong>
      <ul>
        ${session.conditioning.map(e => `<li>${e}</li>`).join("")}
      </ul>

      <button class="success" onclick="completeSession()">
        Complete Session
      </button>
    </div>
  `;
}

/* ===============================
   COMPLETE SESSION TRACKER
================================ */

window.completeSession = async function () {

  const user = auth.currentUser;

  if (!user) {
    alert("Login first.");
    return;
  }

  const { week, day } = getProgramPosition();

  await addDoc(collection(db, "users", user.uid, "completedSessions"), {
    week,
    day,
    timestamp: Date.now()
  });

  alert("Session logged.");
};

/* ===============================
   AUTH SYSTEM
================================ */

window.register = async () =>
  createUserWithEmailAndPassword(auth,email.value,password.value);

window.login = async () =>
  signInWithEmailAndPassword(auth,email.value,password.value);

window.logout = async () => signOut(auth);

onAuthStateChanged(auth, (user) => {

  const status = document.getElementById("userStatus");
  if (!status) return;

  status.innerHTML = user
    ? `<span style="color:#10b981;">Logged in as ${user.email}</span>`
    : `<span style="color:#ef4444;">Not logged in</span>`;
});

/* ===============================
   INIT
================================ */

window.onload = function () {
  renderTodaySession();
};
