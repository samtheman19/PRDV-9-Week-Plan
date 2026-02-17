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
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* ===============================
   FIREBASE CONFIG
================================ */

const firebaseConfig = {
  apiKey: "AIzaSyD7sHTLny_kAtTN_xXmkovFC-GSTtFMeNo",
  authDomain: "prdv-platform.firebaseapp.com",
  projectId: "prdv-platform",
  storageBucket: "prdv-platform.firebasestorage.app",
  messagingSenderId: "578412239135",
  appId: "1:578412239135:web:7680746ea4df63246df82a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const BASE_2KM = 470;

/* ===============================
   AUTH
================================ */

window.register = async () => {
  try {
    await createUserWithEmailAndPassword(auth,email.value,password.value);
  } catch (e) { alert(e.message); }
};

window.login = async () => {
  try {
    await signInWithEmailAndPassword(auth,email.value,password.value);
  } catch (e) { alert(e.message); }
};

window.logout = async () => { await signOut(auth); };

onAuthStateChanged(auth, (user) => {
  const status = document.getElementById("userStatus");
  if (!status) return;

  status.innerHTML = user
    ? `<span style="color:#10b981;">Logged in as ${user.email}</span>`
    : `<span style="color:#ef4444;">Not logged in</span>`;
});

/* ===============================
   UTILITIES
================================ */

function parseTimeToSeconds(timeStr) {
  if (!timeStr) return BASE_2KM;
  if (timeStr.includes(":")) {
    const parts = timeStr.split(":");
    return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
  }
  return parseInt(timeStr);
}

function getWeekNumber() {
  const start = new Date("2026-01-01");
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.min(10, Math.max(1, Math.floor(diff / 7) + 1));
}

/* ===============================
   XP + RANK
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

  const strengthScore = (push * 1.5) + (pull * 2.5);
  const fatiguePenalty = fatigue * 4;

  const sleepBonus =
    sleep >= 8 ? 20 :
    sleep >= 7 ? 15 :
    sleep >= 6 ? 5 : -20;

  return strengthScore - fatiguePenalty + sleepBonus + 40;
}

function recoveryState(score) {
  if (score >= 110) return "GREEN";
  if (score >= 75) return "AMBER";
  return "RED";
}

/* ===============================
   INJURY RISK
================================ */

function injuryRisk(fatigue, sleep) {
  if (fatigue >= 8 && sleep <= 6) return "HIGH";
  if (fatigue >= 6) return "MODERATE";
  return "LOW";
}

/* ===============================
   10 WEEK PROGRAM ENGINE
================================ */

function generateDailyWorkout(twoKm, state) {

  const week = getWeekNumber();
  const day = new Date().getDay(); // 0-6
  const pace = twoKm / 5;

  const program = [
    `Intervals: ${6 + week} x 400m @ ${(pace - 2).toFixed(1)}s`,
    `Tempo: 3km steady @ ${(pace + 5).toFixed(1)}s per 400m`,
    "Upper Strength: Push/Pull/Core circuit",
    `Speed: 8 x 200m fast`,
    "Lower Strength + Plyometrics",
    "Long aerobic run 5–7km",
    "Active recovery + mobility"
  ];

  if (state === "RED") return "Recovery Run 20–30min + Mobility + Stretch";
  if (state === "AMBER") return program[day] + " (Reduced volume -20%)";

  return program[day];
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
   STREAK TRACKER
================================ */

function updateStreak() {
  const today = new Date().toDateString();
  const last = localStorage.getItem("lastWorkout");

  if (last !== today) {
    let streak = parseInt(localStorage.getItem("streak")) || 0;
    streak++;
    localStorage.setItem("streak", streak);
    localStorage.setItem("lastWorkout", today);
  }
  return parseInt(localStorage.getItem("streak")) || 1;
}

/* ===============================
   DASHBOARD
================================ */

function renderDashboard(data) {

  const container = document.getElementById("todayWorkout");
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <h2>🔥 TODAY'S MISSION</h2>
      <p style="font-size:18px;font-weight:600;">${data.workout}</p>
      <hr>
      <p><strong>Rank:</strong> ${data.rank}</p>
      <p><strong>XP:</strong> ${data.xp}</p>
      <p><strong>Recovery:</strong> ${data.state}</p>
      <p><strong>Injury Risk:</strong> ${data.risk}</p>
      <p><strong>Selection Probability:</strong> ${data.selection}%</p>
      <p><strong>Training Streak:</strong> ${data.streak} days</p>
    </div>
  `;

  const recEl = document.getElementById("recoveryInsight");
  if (recEl) {
    recEl.innerHTML =
      data.state === "GREEN"
        ? `<div class="readiness green">GREEN — Full intensity allowed</div>`
        : data.state === "AMBER"
        ? `<div class="readiness amber">AMBER — Manage load carefully</div>`
        : `<div class="readiness red">RED — Recovery focus required</div>`;
  }
}

/* ===============================
   SAVE PERFORMANCE
================================ */

window.savePerformance = async function () {

  const push = parseInt(manualPushups.value) || 0;
  const pull = parseInt(manualPullups.value) || 0;
  const fatigue = parseInt(manualFatigue.value) || 5;
  const sleep = parseFloat(sleepHours.value) || 7;
  const twoKm = parseTimeToSeconds(twoKmTime.value);

  localStorage.setItem("pushups", push);
  localStorage.setItem("pullups", pull);
  localStorage.setItem("twoKm", twoKm);

  const xp = calculateXP(push, pull, twoKm);
  const rank = getRank(xp);
  const recScore = recoveryScore(push, pull, fatigue, sleep);
  const state = recoveryState(recScore);
  const workout = generateDailyWorkout(twoKm, state);
  const selection = selectionProbability(push, pull, twoKm);
  const risk = injuryRisk(fatigue, sleep);
  const streak = updateStreak();

  const user = auth.currentUser;

  if (user) {
    await addDoc(collection(db, "users", user.uid, "sessions"), {
      push, pull, fatigue, sleep, twoKm,
      xp, rank, state, workout, selection,
      timestamp: Date.now()
    });
  }

  renderDashboard({ xp, rank, state, workout, selection, risk, streak });
};

/* ===============================
   INIT
================================ */

window.onload = function () {

  const push = parseInt(localStorage.getItem("pushups")) || 0;
  const pull = parseInt(localStorage.getItem("pullups")) || 0;
  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM;

  const xp = calculateXP(push, pull, twoKm);
  const rank = getRank(xp);
  const state = "GREEN";
  const workout = generateDailyWorkout(twoKm, state);
  const selection = selectionProbability(push, pull, twoKm);
  const streak = parseInt(localStorage.getItem("streak")) || 1;

  renderDashboard({
    xp,
    rank,
    state,
    workout,
    selection,
    risk: "LOW",
    streak
  });
};
