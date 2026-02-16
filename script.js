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

onAuthStateChanged(auth, (user) => {
  userStatus.innerText =
    user ? "Logged in as " + user.email : "Not logged in";
});

/* ===============================
   10 WEEK 2KM ENGINE (7:50 START)
================================ */

const trainingProgram = [
  { week:1, focus:"Base Speed", workout:"6 x 400m @ 1:38 pace" },
  { week:2, focus:"Speed Build", workout:"8 x 400m @ 1:36 pace" },
  { week:3, focus:"Threshold", workout:"3 x 800m @ 3:20 pace" },
  { week:4, focus:"Volume", workout:"5 x 600m @ 2:20 pace" },
  { week:5, focus:"Speed", workout:"10 x 200m fast (40 sec)" },
  { week:6, focus:"Strength", workout:"4 x 1km @ 3:50 pace" },
  { week:7, focus:"Sharpening", workout:"6 x 400m @ 1:32 pace" },
  { week:8, focus:"Race Simulation", workout:"Full 2KM Time Trial" },
  { week:9, focus:"Peak", workout:"4 x 400m @ 1:28 pace" },
  { week:10, focus:"Final Test", workout:"2KM Max Effort — Target 7:00" }
];

function getCurrentWeek() {
  let startDate = localStorage.getItem("programStart");
  if (!startDate) {
    startDate = Date.now();
    localStorage.setItem("programStart", startDate);
  }

  const diff = Date.now() - startDate;
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return week > 10 ? 10 : week;
}

function displayWorkout() {

  const week = getCurrentWeek();
  const plan = trainingProgram[week - 1];

  let existing = document.getElementById("todayWorkout");
  if (existing) existing.remove();

  const workoutCard = document.createElement("div");
  workoutCard.className = "card";
  workoutCard.id = "todayWorkout";

  workoutCard.innerHTML = `
    <h2>🔥 Today’s Mission</h2>
    <strong>Week ${week}: ${plan.focus}</strong>
    <p style="margin-top:10px">${plan.workout}</p>
    <button onclick="resetProgram()" style="margin-top:15px">
      Reset Program
    </button>
  `;

  document.querySelector(".container")
    .insertBefore(workoutCard,
      document.querySelector(".container").children[1]);
}

window.resetProgram = function() {
  localStorage.removeItem("programStart");
  displayWorkout();
};

/* ===============================
   READINESS ENGINE
================================ */

function updateReadinessUI(score) {

  const circle = document.querySelector(".progress-ring__circle");
  if (!circle) return;

  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = `${circumference}`;

  const percent = Math.min(score / 150, 1);
  const offset = circumference - percent * circumference;

  circle.style.strokeDashoffset = offset;

  document.getElementById("scoreValue").innerText = score;

  const label = document.getElementById("readinessLabel");

  if (score >= 100) {
    label.className = "readiness green";
    label.innerText = "GREEN • READY";
  } else if (score >= 60) {
    label.className = "readiness amber";
    label.innerText = "AMBER • BUILDING";
  } else {
    label.className = "readiness red";
    label.innerText = "RED • IMPROVE";
  }
}

/* ===============================
   RANK SYSTEM
================================ */

function updateRank(pushups) {
  let rank = "Recruit";
  if (pushups >= 30) rank = "Trained";
  if (pushups >= 45) rank = "Advanced";
  if (pushups >= 60) rank = "Operator";
  if (pushups >= 75) rank = "Elite";
  rankStatus.innerText = rank;
}

/* ===============================
   SAVE PERFORMANCE
================================ */

window.savePerformance = async function() {

  const user = auth.currentUser;
  if (!user) return alert("Login first.");

  const pushups = parseInt(localStorage.getItem("pushups")) || 0;
  const pullups = parseInt(localStorage.getItem("pullups")) || 0;
  const fatigue = parseInt(localStorage.getItem("fatigue")) || 5;

  const readinessScore =
    (pushups * 2) + (pullups * 3) - (fatigue * 3);

  updateReadinessUI(readinessScore);
  updateRank(pushups);

  await addDoc(
    collection(db, "users", user.uid, "sessions"),
    {
      pushups,
      pullups,
      fatigue,
      readinessScore,
      timestamp: Date.now()
    }
  );

  alert("Session saved.");
};

/* ===============================
   MOCK MODE
================================ */

window.startMockDay = function(day) {
  const messages = {
    1: "Day 1: 2KM + Push/Pull Test",
    2: "Day 2: 15KM Loaded Tab",
    3: "Day 3: Hills + Circuit"
  };
  mockDisplay.innerText = messages[day];
};

/* ===============================
   SPLIT COACH
================================ */

let splitTimer;

window.startSplitCoach = function() {

  let splits = 5;
  let targetTime = 470; // based on 7:50
  let splitTime = targetTime / splits;
  let current = 1;

  splitTimer = setInterval(() => {

    if (current > splits) {
      clearInterval(splitTimer);
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

/* ===============================
   MANUAL DATA
================================ */

window.setManualData = function() {
  localStorage.setItem("pushups",
    manualPushups.value);
  localStorage.setItem("pullups",
    manualPullups.value);
  localStorage.setItem("fatigue",
    manualFatigue.value);
  alert("Manual performance data set.");
};

/* ===============================
   OPERATOR MODE
================================ */

window.toggleOperatorMode = function() {
  document.body.classList.toggle("operator");
};

window.exportData = function() {
  alert("Export feature coming soon.");
};

/* ===============================
   INIT
================================ */

window.onload = function() {
  displayWorkout();
};
