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
    await createUserWithEmailAndPassword(auth, email.value, password.value);
  } catch (e) {
    alert(e.message);
  }
};

window.login = async function() {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
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

  // Save session history
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

  // Update summary
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
    html += `
      ${data.email || "User"} 
      — Readiness: ${data.latestReadiness || 0}<br>
    `;
  });

  leaderboard.innerHTML = html;
};

/* ===============================
   ANALYTICS DASHBOARD
================================ */

window.loadAnalytics = async function() {

  const user = auth.currentUser;
  if (!user) {
    alert("Login first.");
    return;
  }

  const q = query(
    collection(db, "users", user.uid, "sessions"),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);

  let pushups = [];
  let fatigue = [];
  let labels = [];
  let historyHTML = "";
  let count = 1;

  snapshot.forEach(doc => {
    const data = doc.data();

    pushups.push(data.pushups);
    fatigue.push(data.fatigue);
    labels.push("S" + count);

    historyHTML += `
      Session ${count} —
      Pushups: ${data.pushups},
      Pullups: ${data.pullups},
      Fatigue: ${data.fatigue}<br>
    `;

    count++;
  });

  sessionHistory.innerHTML = historyHTML;

  new Chart(pushupTrend, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Pushups",
        data: pushups
      }]
    }
  });

  new Chart(fatigueTrend, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Fatigue",
        data: fatigue
      }]
    }
  });
};

/* ===============================
   MOCK MODE
================================ */

window.startMockDay = function(day) {
  if (day === 1)
    mockDisplay.innerText = "Day 1: 2KM + Push/Pull Test";
  if (day === 2)
    mockDisplay.innerText = "Day 2: 15KM Loaded Tab";
  if (day === 3)
    mockDisplay.innerText = "Day 3: Hills + Circuit";

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
  const audio = new Audio(
    "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
  );
  audio.play();
}

/* ===============================
   RISK ANALYSIS
================================ */

function riskAnalysis() {

  let fatigue = parseInt(localStorage.getItem("fatigue")) || 5;
  let pushups = parseInt(localStorage.getItem("pushups")) || 0;

  let injuryRisk =
    fatigue > 7 ? "HIGH" :
    fatigue > 5 ? "MODERATE" : "LOW";

  let overtraining =
    (fatigue > 8 && pushups < 30) ? "YES" : "NO";

  riskDisplay.innerHTML = `
    Injury Risk: ${injuryRisk}<br>
    Overtraining Risk: ${overtraining}
  `;
}

window.onload = function() {
  riskAnalysis();
};
