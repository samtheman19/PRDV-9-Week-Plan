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
   FIREBASE CONFIG (LIVE)
================================ */

const firebaseConfig = {
  apiKey: "AIzaSyD7sHTLny_kAtTN_xXmkovFC-GSTtFMeNo",
  authDomain: "prdv-platform.firebaseapp.com",
  projectId: "prdv-platform",
  storageBucket: "prdv-platform.firebasestorage.app",
  messagingSenderId: "578412239135",
  appId: "1:578412239135:web:7680746ea4df63246df82a",
  measurementId: "G-T4KJ9P53GZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const BASE_2KM = 470;

/* ===============================
   AUTH SYSTEM
================================ */

window.register = async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    alert("Account created.");
  } catch (e) {
    alert(e.message);
  }
};

window.login = async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    alert("Login successful.");
  } catch (e) {
    alert(e.message);
  }
};

window.logout = async () => {
  await signOut(auth);
  alert("Logged out.");
};

/* ===============================
   AUTH STATE LISTENER
================================ */

onAuthStateChanged(auth, (user) => {

  const status = document.getElementById("userStatus");
  if (!status) return;

  if (user) {
    status.innerHTML =
      `<span style="color:#10b981;font-weight:600;">
        Logged in as ${user.email}
      </span>`;
  } else {
    status.innerHTML =
      `<span style="color:#ef4444;font-weight:600;">
        Not logged in
      </span>`;
  }
});

/* ===============================
   XP + RANK SYSTEM
================================ */

function calculateXP(push, pull, twoKm) {
  return (push * 2) + (pull * 4) + Math.max(0, 500 - twoKm);
}

function getRank(xp) {
  if (xp < 200) return "Recruit";
  if (xp < 400) return "Trained";
  if (xp < 600) return "Advanced";
  if (xp < 800) return "Operator";
  if (xp < 1000) return "Elite";
  return "Tier 1";
}

/* ===============================
   RECOVERY ENGINE
================================ */

function recoveryScore(push, pull, fatigue, sleep) {

  const sleepBonus =
    sleep >= 8 ? 15 :
    sleep >= 7 ? 10 :
    sleep >= 6 ? 5 : -15;

  return (push * 2) + (pull * 3) - (fatigue * 3) + sleepBonus;
}

function recoveryState(score) {
  if (score >= 100) return "GREEN";
  if (score >= 60) return "AMBER";
  return "RED";
}

/* ===============================
   MISSION ENGINE
================================ */

function missionGenerator(twoKm, state) {

  const pace = twoKm / 5;

  if (state === "GREEN")
    return `8 x 400m @ ${(pace - 2).toFixed(1)}s`;

  if (state === "AMBER")
    return `6 x 400m @ ${pace.toFixed(1)}s`;

  return "Recovery Run + Mobility 30min";
}

/* ===============================
   SELECTION PROBABILITY
================================ */

function selectionProbability(push, pull, twoKm) {

  let prob = 40;

  if (push > 50) prob += 15;
  if (pull > 12) prob += 15;
  if (twoKm < 450) prob += 20;
  if (twoKm < 430) prob += 10;

  return Math.min(prob, 95);
}

/* ===============================
   DASHBOARD RENDER
================================ */

function renderDashboard(data) {

  const container = document.getElementById("todayWorkout");
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <h2>⚔ Elite Battlefield Dashboard</h2>
      <p><strong>Rank:</strong> ${data.rank}</p>
      <p><strong>XP:</strong> ${data.xp}</p>
      <p><strong>Recovery:</strong> ${data.state}</p>
      <p><strong>Mission:</strong> ${data.workout}</p>
      <p><strong>Selection Probability:</strong> ${data.selection}%</p>

      <div style="height:10px;background:#1f2937;border-radius:6px;margin-top:10px;">
        <div style="
          height:10px;
          width:${data.selection}%;
          background:#10b981;
          border-radius:6px;">
        </div>
      </div>
    </div>
  `;
}

/* ===============================
   SAVE PERFORMANCE
================================ */

window.savePerformance = async function () {

  const push = parseInt(manualPushups.value) || 0;
  const pull = parseInt(manualPullups.value) || 0;
  const fatigue = parseInt(manualFatigue.value) || 5;
  const sleep = parseFloat(sleepHours.value) || 7;
  const twoKm = parseInt(twoKmTime.value) || BASE_2KM;

  localStorage.setItem("pushups", push);
  localStorage.setItem("pullups", pull);
  localStorage.setItem("twoKm", twoKm);

  const xp = calculateXP(push, pull, twoKm);
  const rank = getRank(xp);
  const recScore = recoveryScore(push, pull, fatigue, sleep);
  const state = recoveryState(recScore);
  const workout = missionGenerator(twoKm, state);
  const selection = selectionProbability(push, pull, twoKm);

  const user = auth.currentUser;

  if (user) {
    try {
      await addDoc(collection(db, "users", user.uid, "sessions"), {
        push,
        pull,
        fatigue,
        sleep,
        twoKm,
        xp,
        rank,
        timestamp: Date.now()
      });
    } catch (e) {
      console.log("Firestore save failed:", e.message);
    }
  }

  renderDashboard({ xp, rank, state, workout, selection });
};

/* ===============================
   AUTO INIT
================================ */

window.onload = function () {

  const push = parseInt(localStorage.getItem("pushups")) || 0;
  const pull = parseInt(localStorage.getItem("pullups")) || 0;
  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM;

  const xp = calculateXP(push, pull, twoKm);
  const rank = getRank(xp);
  const state = "GREEN";
  const workout = missionGenerator(twoKm, state);
  const selection = selectionProbability(push, pull, twoKm);

  renderDashboard({ xp, rank, state, workout, selection });
};

/* ===============================
   OPERATOR MODE
================================ */

window.toggleOperatorMode = function () {
  document.body.classList.toggle("operator");
};
