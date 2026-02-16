/* ===============================
   FIREBASE IMPORTS
================================ */

import { initializeApp } from 
"https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

import { getAuth, createUserWithEmailAndPassword,
signInWithEmailAndPassword, signOut,
onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import { getFirestore, doc, setDoc,
collection, getDocs, query,
orderBy, limit, addDoc }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* ===============================
   FIREBASE CONFIG
================================ */

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "prdv-platform.firebaseapp.com",
  projectId: "prdv-platform",
  storageBucket: "prdv-platform.firebasestorage.app",
  messagingSenderId: "578412239135",
  appId: "1:578412239135:web:7680746ea4df63246df82a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===============================
   AUTH
================================ */

window.register = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
  } catch (e) { alert(e.message); }
};

window.login = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
  } catch (e) { alert(e.message); }
};

window.logout = () => signOut(auth);

onAuthStateChanged(auth, () => {
  displayWorkout();
});

/* ===============================
   PROGRAM ENGINE
================================ */

const BASE_2KM = 470; // 7:50 baseline

function getCurrentWeek() {
  let start = localStorage.getItem("programStart");
  if (!start) {
    start = Date.now();
    localStorage.setItem("programStart", start);
  }
  const diff = Date.now() - start;
  const week = Math.floor(diff / (7*24*60*60*1000)) + 1;
  return week > 10 ? 10 : week;
}

/* ===============================
   RECOVERY INTELLIGENCE
================================ */

function calculateRecovery(pushups, pullups, fatigue, sleep) {

  const sleepScore = sleep >= 8 ? 15 :
                     sleep >= 7 ? 10 :
                     sleep >= 6 ? 5 : -15;

  const readiness =
    (pushups * 2) +
    (pullups * 3) -
    (fatigue * 3) +
    sleepScore;

  return readiness;
}

function getRecoveryState(score) {
  if (score >= 100) return "GREEN";
  if (score >= 60) return "AMBER";
  return "RED";
}

function updateRecoveryInsight(score) {
  const state = getRecoveryState(score);
  const insight = document.getElementById("recoveryInsight");

  if (!insight) return;

  if (state === "GREEN")
    insight.innerText = "High readiness. Increase intensity.";
  else if (state === "AMBER")
    insight.innerText = "Moderate readiness. Maintain load.";
  else
    insight.innerText = "Low readiness. Reduce volume 30%.";
}

/* ===============================
   AUTO INTENSITY SCALING
================================ */

function getScaledWorkout(baseWorkout, recoveryState) {

  if (recoveryState === "GREEN")
    return baseWorkout + " + 1 extra interval";

  if (recoveryState === "RED")
    return "Reduced Volume: " + baseWorkout;

  return baseWorkout;
}

/* ===============================
   TODAY WORKOUT DISPLAY
================================ */

function displayWorkout() {

  const week = getCurrentWeek();

  const pushups = parseInt(localStorage.getItem("pushups")) || 0;
  const pullups = parseInt(localStorage.getItem("pullups")) || 0;
  const fatigue = parseInt(localStorage.getItem("fatigue")) || 5;
  const sleep = parseFloat(localStorage.getItem("sleep")) || 7;

  const readiness = calculateRecovery(pushups, pullups, fatigue, sleep);
  const recoveryState = getRecoveryState(readiness);

  const pace = (BASE_2KM / 5).toFixed(1);

  const baseWorkout =
    `5–8 x 400m @ ${pace}s (Week ${week})`;

  const scaledWorkout =
    getScaledWorkout(baseWorkout, recoveryState);

  const container = document.getElementById("todayWorkout");
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <h2>🔥 Today’s Mission</h2>
      <strong>${scaledWorkout}</strong>
      <p style="margin-top:10px;opacity:0.6">
        Recovery State: ${recoveryState}
      </p>
      <button onclick="resetProgram()">Reset Program</button>
    </div>
  `;

  updateRecoveryInsight(readiness);
}

/* ===============================
   WEEKLY SUMMARY
================================ */

window.generateWeeklySummary = async function() {

  const user = auth.currentUser;
  if (!user) return alert("Login first.");

  const q = query(
    collection(db, "users", user.uid, "sessions"),
    orderBy("timestamp", "desc"),
    limit(7)
  );

  const snapshot = await getDocs(q);

  let totalReadiness = 0;
  let count = 0;

  snapshot.forEach(doc => {
    totalReadiness += doc.data().readinessScore;
    count++;
  });

  const avg = count ? (totalReadiness / count).toFixed(1) : 0;

  alert("Weekly Average Readiness: " + avg);
};

/* ===============================
   SELECTION SIMULATION
================================ */

window.runSelectionSimulation = function() {

  const pushups = parseInt(localStorage.getItem("pushups")) || 0;
  const pullups = parseInt(localStorage.getItem("pullups")) || 0;

  let result = "FAIL";

  if (pushups >= 45 && pullups >= 12)
    result = "PASS - SELECTION READY";

  alert("Selection Simulation Result: " + result);
};

/* ===============================
   CALENDAR VIEW
================================ */

window.showCalendar = function() {

  const week = getCurrentWeek();
  alert("You are in Week " + week + " of 10.");
};

/* ===============================
   SAVE PERFORMANCE
================================ */

window.savePerformance = async function() {

  const user = auth.currentUser;
  if (!user) return alert("Login first.");

  const pushups = parseInt(manualPushups.value) || 0;
  const pullups = parseInt(manualPullups.value) || 0;
  const fatigue = parseInt(manualFatigue.value) || 5;
  const sleep = parseFloat(sleepHours.value) || 7;

  localStorage.setItem("pushups", pushups);
  localStorage.setItem("pullups", pullups);
  localStorage.setItem("fatigue", fatigue);
  localStorage.setItem("sleep", sleep);

  const readiness =
    calculateRecovery(pushups, pullups, fatigue, sleep);

  await addDoc(
    collection(db, "users", user.uid, "sessions"),
    {
      pushups,
      pullups,
      fatigue,
      sleep,
      readinessScore: readiness,
      timestamp: Date.now()
    }
  );

  displayWorkout();

  alert("Session saved.");
};

/* ===============================
   UTILITIES
================================ */

window.resetProgram = function() {
  localStorage.removeItem("programStart");
  displayWorkout();
};

window.exportData = function() {
  alert("Export feature coming soon.");
};

window.toggleOperatorMode = function() {
  document.body.classList.toggle("operator");
};

/* ===============================
   INIT
================================ */

window.onload = function() {
  displayWorkout();
};
