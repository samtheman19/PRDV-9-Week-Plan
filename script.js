/* ===============================
   FIREBASE IMPORTS (v12.9.0)
================================ */

import { initializeApp } from 
"https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

import { getAuth, createUserWithEmailAndPassword,
signInWithEmailAndPassword, signOut,
onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import { getFirestore, doc, setDoc, getDoc,
collection, getDocs, query, orderBy, limit }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* ===============================
   FIREBASE CONFIG
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

/* ===============================
   AUTH SYSTEM
================================ */

window.register = async function() {
  try {
    await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
  } catch (e) {
    alert(e.message);
  }
};

window.login = async function() {
  try {
    await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
  } catch (e) {
    alert(e.message);
  }
};

window.logout = function() {
  signOut(auth);
};

onAuthStateChanged(auth, (user) => {
  userStatus.innerText =
    user ? "Logged in as " + user.email : "Not logged in";
});

/* ===============================
   GLOBAL STATE
================================ */

let splitTimer;

/* ===============================
   SAVE PERFORMANCE TO CLOUD
================================ */

window.savePerformance = async function() {
  const user = auth.currentUser;
  if (!user) {
    alert("Login first.");
    return;
  }

  const pushups = localStorage.getItem("pushups") || 0;
  const pullups = localStorage.getItem("pullups") || 0;
  const fatigue = localStorage.getItem("fatigue") || 5;

  await setDoc(doc(db, "users", user.uid), {
    pushups,
    pullups,
    fatigue,
    updated: Date.now()
  });

  alert("Performance saved to cloud.");
};

/* ===============================
   LEADERBOARD
================================ */

window.loadLeaderboard = async function() {
  const q = query(
    collection(db, "users"),
    orderBy("pushups", "desc"),
    limit(10)
  );

  const snapshot = await getDocs(q);

  let html = "";
  snapshot.forEach(doc => {
    html += doc.data().pushups + " push-ups<br>";
  });

  leaderboard.innerHTML = html;
};

/* ===============================
   3-DAY MOCK MODE
================================ */

window.startMockDay = function(day) {
  const display = document.getElementById("mockDisplay");

  if (day === 1)
    display.innerText = "Day 1: 2KM + Push/Pull Test";
  if (day === 2)
    display.innerText = "Day 2: 15KM Loaded Tab Simulation";
  if (day === 3)
    display.innerText = "Day 3: Hills + Circuit Under Fatigue";

  localStorage.setItem("mockDay", day);
};

/* ===============================
   SPLIT COACH (400m)
================================ */

window.startSplitCoach = function() {
  let splits = 5;
  let targetTime = 480;
  let splitTime = targetTime / splits;
  let current = 1;

  splitTimer = setInterval(() => {
    if (current > splits) {
      clearInterval(splitTimer);
      splitDisplay.innerText = "2KM COMPLETE";
      return;
    }

    splitDisplay.innerText = "400m Split " + current;
    beep();
    current++;

  }, splitTime * 1000);
};

function beep() {
  const audio = new Audio(
    "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
  );
  audio.play();
}

/* ===============================
   FATIGUE + INJURY RISK
================================ */

function riskAnalysis() {
  let fatigue = parseInt(localStorage.getItem("fatigue")) || 5;
  let pushups = parseInt(localStorage.getItem("pushups")) || 0;

  let injuryRisk = fatigue > 7 ? "HIGH" :
                   fatigue > 5 ? "MODERATE" : "LOW";

  let overtraining =
    (fatigue > 8 && pushups < 30) ? "YES" : "NO";

  riskDisplay.innerHTML = `
    Injury Risk: ${injuryRisk}<br>
    Overtraining Risk: ${overtraining}
  `;
}

/* ===============================
   ADAPTIVE ENGINE
================================ */

function adaptiveEngine() {
  let fatigue = parseInt(localStorage.getItem("fatigue")) || 5;
  let pushups = parseInt(localStorage.getItem("pushups")) || 0;
  let pullups = parseInt(localStorage.getItem("pullups")) || 0;

  if (fatigue > 8)
    return "Reduce volume 20% this week.";
  if (pushups < 35)
    return "Increase push-up density sessions.";
  if (pullups < 10)
    return "Add weighted pull-ups twice weekly.";
  return "Maintain intensity. Focus on tab speed.";
}

/* ===============================
   EXPORT DATA
================================ */

window.exportData = function() {
  const data = {
    pushups: localStorage.getItem("pushups"),
    pullups: localStorage.getItem("pullups"),
    fatigue: localStorage.getItem("fatigue"),
    mockDay: localStorage.getItem("mockDay")
  };

  console.log("Export Ready:", JSON.stringify(data));
};

/* ===============================
   AUTO LOAD
================================ */

window.onload = function() {
  riskAnalysis();
  console.log("Adaptive Advice:", adaptiveEngine());
};
