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

/* ===============================
   AUTH SYSTEM
================================ */

window.register = async function() {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
  } catch (e) { alert(e.message); }
};

window.login = async function() {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
  } catch (e) { alert(e.message); }
};

window.logout = function() { signOut(auth); };

onAuthStateChanged(auth, (user) => {
  userStatus.innerText =
    user ? "Logged in as " + user.email : "Not logged in";
});

/* ===============================
   READINESS RING ENGINE
================================ */

function updateReadinessUI(score) {

  const circle = document.querySelector(".progress-ring__circle");
  if (!circle) return;

  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = circumference;

  const percent = Math.min(score / 150, 1);
  const offset = circumference - percent * circumference;

  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 100);

  // Animated number count up
  let current = 0;
  const scoreDisplay = document.getElementById("scoreValue");

  const interval = setInterval(() => {
    if (current >= score) {
      clearInterval(interval);
    } else {
      current++;
      scoreDisplay.innerText = current;
    }
  }, 10);

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

  const rankEl = document.getElementById("rankStatus");
  if (rankEl) rankEl.innerText = rank;
}

/* ===============================
   SAVE PERFORMANCE
================================ */

window.savePerformance = async function() {

  const user = auth.currentUser;
  if (!user) {
    alert("Login first.");
    return;
  }

  const pushups = parseInt(localStorage.getItem("pushups")) || 0;
  const pullups = parseInt(localStorage.getItem("pullups")) || 0;
  const fatigue = parseInt(localStorage.getItem("fatigue")) || 5;
  const mockDay = localStorage.getItem("mockDay") || null;

  const readinessScore =
    (pushups * 2) + (pullups * 3) - (fatigue * 3);

  // 🔥 FINAL FORM UPDATES
  updateReadinessUI(readinessScore);
  updateRank(pushups);

  await addDoc(
    collection(db, "users", user.uid, "sessions"),
    {
      pushups,
      pullups,
      fatigue,
      mockDay,
      readinessScore,
      timestamp: Date.now()
    }
  );

  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    latestPushups: pushups,
    latestPullups: pullups,
    latestFatigue: fatigue,
    latestReadiness: readinessScore,
    updated: Date.now()
  });

  alert("Session saved.");
};

/* ===============================
   LEADERBOARD
================================ */

window.loadLeaderboard = async function() {

  const q = query(
    collection(db, "users"),
    orderBy("latestReadiness", "desc"),
    limit(10)
  );

  const snapshot = await getDocs(q);

  let html = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    html += `${data.email || "User"} — ${data.latestReadiness || 0}<br>`;
  });

  leaderboard.innerHTML = html;
};

/* ===============================
   ANALYTICS
================================ */

window.loadAnalytics = async function() {

  const user = auth.currentUser;
  if (!user) return alert("Login first.");

  const q = query(
    collection(db, "users", user.uid, "sessions"),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);

  let pushups = [];
  let fatigue = [];
  let labels = [];
  let count = 1;

  snapshot.forEach(doc => {
    const data = doc.data();
    pushups.push(data.pushups);
    fatigue.push(data.fatigue);
    labels.push("S" + count);
    count++;
  });

  new Chart(pushupTrend, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Pushups", data: pushups }]
    }
  });

  new Chart(fatigueTrend, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Fatigue", data: fatigue }]
    }
  });
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
  localStorage.setItem("mockDay", day);
};

/* ===============================
   SPLIT COACH
================================ */

let splitTimer;

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
  new Audio(
    "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
  ).play();
}

/* ===============================
   MANUAL DATA
================================ */

window.setManualData = function() {
  localStorage.setItem("pushups",
    document.getElementById("manualPushups").value);
  localStorage.setItem("pullups",
    document.getElementById("manualPullups").value);
  localStorage.setItem("fatigue",
    document.getElementById("manualFatigue").value);
  alert("Manual performance data set.");
};

/* ===============================
   OPERATOR MODE
================================ */

window.toggleOperatorMode = function() {
  document.body.classList.toggle("operator");
};
