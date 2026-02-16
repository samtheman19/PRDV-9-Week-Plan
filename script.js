/* ==================================================
   FIREBASE IMPORTS
================================================== */

import { initializeApp } from 
"https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* ==================================================
   FIREBASE CONFIG
================================================== */

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

/* ==================================================
   AUTH
================================================== */

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

/* ==================================================
   BASE SETTINGS
================================================== */

const BASE_2KM = 470; // 7:50 baseline

/* ==================================================
   WEEK ENGINE
================================================== */

function getCurrentWeek() {
  let start = localStorage.getItem("programStart");

  if (!start) {
    start = Date.now();
    localStorage.setItem("programStart", start);
  }

  const diff = Date.now() - start;
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return week > 10 ? 10 : week;
}

/* ==================================================
   RECOVERY INTELLIGENCE
================================================== */

function calculateRecovery(pushups, pullups, fatigue, sleep) {

  const sleepScore = sleep >= 8 ? 15 :
                     sleep >= 7 ? 10 :
                     sleep >= 6 ? 5 : -15;

  return (
    (pushups * 2) +
    (pullups * 3) -
    (fatigue * 3) +
    sleepScore
  );
}

function getRecoveryState(score) {
  if (score >= 100) return "GREEN";
  if (score >= 60) return "AMBER";
  return "RED";
}

function detectOvertraining(fatigue, sleep) {

  if (fatigue >= 8 && sleep < 6)
    return "⚠ High overtraining risk";

  if (fatigue >= 7)
    return "⚠ Monitor fatigue";

  return "Recovery stable";
}

/* ==================================================
   WORKOUT SCALING
================================================== */

function getScaledWorkout(baseWorkout, recoveryState) {

  if (recoveryState === "GREEN")
    return baseWorkout + " + 1 bonus interval";

  if (recoveryState === "RED")
    return "Reduced Volume: " + baseWorkout;

  return baseWorkout;
}

/* ==================================================
   VO2 MAX ESTIMATOR
================================================== */

function estimateVO2max(twoKmSeconds) {
  const velocity = 2000 / twoKmSeconds;
  const vo2 = (velocity * 3.5 * 60) / 1000 * 100;
  return vo2.toFixed(1);
}

/* ==================================================
   2KM PREDICTION
================================================== */

function predict2KMImprovement(pushups, pullups, sleepAvg) {

  let improvement = 0;

  if (pushups > 45) improvement += 5;
  if (pullups > 12) improvement += 5;
  if (sleepAvg >= 7.5) improvement += 5;

  return BASE_2KM - improvement;
}

/* ==================================================
   PRDV SCORE MODEL
================================================== */

function calculatePRDVScore(pushups, pullups, twoKmSeconds) {

  let score = 0;

  score += pushups * 1.5;
  score += pullups * 3;

  if (twoKmSeconds <= 440) score += 30;
  else if (twoKmSeconds <= 460) score += 20;
  else if (twoKmSeconds <= 480) score += 10;

  return Math.floor(score);
}

/* ==================================================
   DISPLAY WORKOUT
================================================== */

function displayWorkout() {

  const week = getCurrentWeek();

  const pushups = parseInt(localStorage.getItem("pushups")) || 0;
  const pullups = parseInt(localStorage.getItem("pullups")) || 0;
  const fatigue = parseInt(localStorage.getItem("fatigue")) || 5;
  const sleep = parseFloat(localStorage.getItem("sleep")) || 7;

  const readiness = calculateRecovery(pushups, pullups, fatigue, sleep);
  const recoveryState = getRecoveryState(readiness);

  const pace = (BASE_2KM / 5).toFixed(1);
  const baseWorkout = `5–8 x 400m @ ${pace}s (Week ${week})`;

  const scaledWorkout = getScaledWorkout(baseWorkout, recoveryState);
  const warning = detectOvertraining(fatigue, sleep);

  const container = document.getElementById("todayWorkout");
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <h2>🔥 Today’s Mission</h2>
      <strong>${scaledWorkout}</strong>
      <p style="margin-top:10px;opacity:0.6">
        Recovery State: ${recoveryState}
      </p>
      <p style="color:#ef4444;margin-top:8px">
        ${warning}
      </p>
    </div>
  `;
}

/* ==================================================
   SAVE PERFORMANCE
================================================== */

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

  const vo2 = estimateVO2max(BASE_2KM);
  const predicted = predict2KMImprovement(pushups, pullups, sleep);
  const prdvScore = calculatePRDVScore(pushups, pullups, BASE_2KM);

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

  alert(
    "Session Saved\n\n" +
    "VO2max: " + vo2 + "\n" +
    "Predicted 2KM: " + predicted + " sec\n" +
    "PRDV Score: " + prdvScore
  );
};

/* ==================================================
   SPLIT COACH
================================================== */

window.startSplitCoach = function() {

  let splits = 5;
  let splitTime = BASE_2KM / splits;
  let current = 1;

  const timer = setInterval(() => {

    if (current > splits) {
      clearInterval(timer);
      splitDisplay.innerText = "2KM COMPLETE";
      return;
    }

    splitDisplay.innerText = "400m Split " + current;
    new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    ).play();

    current++;

  }, splitTime * 1000);
};

/* ==================================================
   SELECTION SIMULATION
================================================== */

window.runSelectionSimulation = function() {

  const pushups = parseInt(localStorage.getItem("pushups")) || 0;
  const pullups = parseInt(localStorage.getItem("pullups")) || 0;

  let result = "FAIL";

  if (pushups >= 45 && pullups >= 12)
    result = "PASS - SELECTION READY";

  alert("Selection Simulation Result: " + result);
};

/* ==================================================
   WEEKLY SUMMARY
================================================== */

window.generateWeeklySummary = async function() {

  const user = auth.currentUser;
  if (!user) return alert("Login first.");

  const q = query(
    collection(db, "users", user.uid, "sessions"),
    orderBy("timestamp", "desc"),
    limit(7)
  );

  const snapshot = await getDocs(q);

  let total = 0;
  let count = 0;

  snapshot.forEach(doc => {
    total += doc.data().readinessScore;
    count++;
  });

  const avg = count ? (total / count).toFixed(1) : 0;

  alert("Weekly Average Readiness: " + avg);
};

/* ==================================================
   CALENDAR VIEW
================================================== */

window.showCalendar = function() {

  const week = getCurrentWeek();

  let grid = "10 Week Program\n\n";

  for (let i = 1; i <= 10; i++) {
    grid += i === week
      ? "Week " + i + " ← CURRENT\n"
      : "Week " + i + "\n";
  }

  alert(grid);
};

/* ==================================================
   EXPORT
================================================== */

window.exportData = function() {

  const content = `
    PRDV Tactical Report

    Pushups: ${localStorage.getItem("pushups")}
    Pullups: ${localStorage.getItem("pullups")}
    Fatigue: ${localStorage.getItem("fatigue")}
    Sleep: ${localStorage.getItem("sleep")}
  `;

  const blob = new Blob([content], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "PRDV_Report.txt";
  link.click();
};

/* ==================================================
   OPERATOR MODE
================================================== */

window.toggleOperatorMode = function() {
  document.body.classList.toggle("operator");
};

/* ==================================================
   INIT
================================================== */

window.onload = function() {
  displayWorkout();
};
