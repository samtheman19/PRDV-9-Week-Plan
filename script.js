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
    await createUserWithEmailAndPassword(auth,email.value,password.value);
  } catch (e) { alert(e.message); }
};

window.login = async () => {
  try {
    await signInWithEmailAndPassword(auth,email.value,password.value);
  } catch (e) { alert(e.message); }
};

window.logout = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth,(user)=>{
  const status = document.getElementById("userStatus");
  if(!status) return;
  status.innerHTML = user
    ? `<span style="color:#10b981;font-weight:600;">Logged in as ${user.email}</span>`
    : `<span style="color:#ef4444;">Not logged in</span>`;
});

/* ===============================
   CORE PERFORMANCE ENGINE
================================ */

const BASE_2KM = 470;

function secToMinKm(secondsPer400){
  const perKm = secondsPer400 * 2.5;
  const mins = Math.floor(perKm/60);
  const secs = Math.round(perKm%60).toString().padStart(2,"0");
  return `${mins}:${secs}/km`;
}

function get400Split(twoKm){
  return twoKm/5;
}

/* ===============================
   WEEK + PHASE
================================ */

function getCurrentWeek(){
  if(!localStorage.getItem("programStart")){
    localStorage.setItem("programStart",Date.now());
  }
  const start = new Date(parseInt(localStorage.getItem("programStart")));
  const now = new Date();
  const diff = Math.floor((now-start)/(1000*60*60*24));
  return Math.min(Math.floor(diff/7)+1,10);
}

function getPhaseLabel(week){
  if(week<=3) return "Phase 1 – Base Build";
  if(week===4) return "Deload Week";
  if(week<=7) return "Phase 2 – Power + Threshold";
  if(week===8) return "Deload Week";
  return "Phase 3 – Race Specific";
}

/* ===============================
   FATIGUE AUTO ADJUST
================================ */

function adjustForFatigue(workout){
  const fatigue = parseInt(localStorage.getItem("fatigue")) || 5;
  if(fatigue >= 8){
    return workout + "\n\n⚠ FATIGUE HIGH — Reduce volume 20%";
  }
  return workout;
}

/* ===============================
   WORKOUT ENGINE (FULL 10 WEEKS)
================================ */

function getWorkout(twoKm){

  const week = getCurrentWeek();
  const day = new Date().getDay();
  const split = get400Split(twoKm);

  const warmup = `
WARM UP:
5–10min easy jog
Dynamic mobility
2–3 strides
`;

  if(day===0){
    return "REST DAY\nMobility + Light Walk";
  }

  if(day===1){
    if(week===4 || week===8){
      return warmup + `
DELOAD LOWER
Light Split Squats 3x8
Light RDL 3x8
Mobility
`;
    }
    return warmup + `
LOWER STRENGTH

Bulgarian Split Squat 4x6
Single Leg RDL 4x6
Step Ups 3x8
Nordic Curl 3x6
Soleus Raise 4x15
+ 20min Zone 2
`;
  }

  if(day===2){

    if(week===1) return warmup + `6x400m @ ${split.toFixed(1)}s (${secToMinKm(split)})`;
    if(week===2) return warmup + `7x400m @ ${split.toFixed(1)}s (${secToMinKm(split)})`;
    if(week===3) return warmup + `8x400m @ ${split.toFixed(1)}s (${secToMinKm(split)})`;
    if(week===4) return warmup + `5x400m relaxed`;

    if(week===5) return warmup + `6x400m @ ${(split-2).toFixed(1)}s (${secToMinKm(split-2)})`;
    if(week===6) return warmup + `5x600m @ ${(split*1.5).toFixed(1)}s`;
    if(week===7) return warmup + `8x400m @ ${(split-4).toFixed(1)}s`;
    if(week===8) return warmup + `5x400m easy`;

    if(week===9) return warmup + `4x800m @ ${(split*2).toFixed(1)}s`;
    if(week===10) return warmup + `3x400m sharp + 2x200 fast`;
  }

  if(day===3){
    if(week===4 || week===8){
      return warmup + `
DELOAD UPPER
Pull Ups 3x5
Push Ups 3x10
Mobility
`;
    }
    return warmup + `
UPPER STRENGTH

Weighted Pull Ups 4x6
Barbell Row 4x6
DB Bench 4x8
Face Pulls 3x15
Core Circuit
`;
  }

  if(day===4){

    if(week===1) return warmup + `3x1km tempo`;
    if(week===2) return warmup + `4x1km tempo`;
    if(week===3) return warmup + `2x2km tempo`;
    if(week===4) return warmup + `2x1km relaxed`;

    if(week===5) return warmup + `3x2km tempo`;
    if(week===6) return warmup + `5km continuous tempo`;
    if(week===7) return warmup + `4x1.5km tempo`;
    if(week===8) return warmup + `3km steady`;

    if(week===9) return warmup + `3km hard + 2km hard`;
    if(week===10) return warmup + `2km race rehearsal`;
  }

  if(day===5){
    return warmup + `
CONDITIONING

4 Rounds:
500m Ski
15 Wall Balls
400m Run
12 DB Thrusters
`;
  }

  if(day===6){

    if(week===1) return "70min Zone 2";
    if(week===2) return "75min Zone 2";
    if(week===3) return "80min Zone 2";
    if(week===4) return "60min Zone 2";

    if(week===5) return "80min Zone 2";
    if(week===6) return "85min Zone 2";
    if(week===7) return "90min Zone 2";
    if(week===8) return "60min Zone 2";

    if(week===9) return "70min relaxed";
    if(week===10) return "45min easy";
  }
}

/* ===============================
   DASHBOARD RENDER
================================ */

function renderDashboard(){

  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM;
  const week = getCurrentWeek();
  const phase = getPhaseLabel(week);

  let workout = getWorkout(twoKm);
  workout = adjustForFatigue(workout);

  const container = document.getElementById("todayWorkout");
  if(!container) return;

  container.innerHTML = `
  <div class="card">
    <h2>🔥 TODAY'S MISSION</h2>
    <p><strong>Week:</strong> ${week}/10</p>
    <p><strong>${phase}</strong></p>
    <pre style="white-space:pre-wrap;">${workout}</pre>
    <button onclick="completeSession()" class="success">
      Complete Session
    </button>
  </div>
  `;
}

/* ===============================
   SAVE PERFORMANCE
================================ */

window.savePerformance = async function(){

  const push = parseInt(manualPushups.value)||0;
  const pull = parseInt(manualPullups.value)||0;
  const fatigue = parseInt(manualFatigue.value)||5;
  const sleep = parseFloat(sleepHours.value)||7;
  const twoKm = parseInt(twoKmTime.value)||BASE_2KM;

  localStorage.setItem("pushups",push);
  localStorage.setItem("pullups",pull);
  localStorage.setItem("twoKm",twoKm);
  localStorage.setItem("fatigue",fatigue);

  const user = auth.currentUser;

  if(user){
    await addDoc(collection(db,"users",user.uid,"sessions"),{
      push,pull,fatigue,sleep,twoKm,
      week:getCurrentWeek(),
      timestamp:Date.now()
    });
  }

  alert("Performance saved.");
  renderDashboard();
};

/* ===============================
   SESSION COMPLETE
================================ */

window.completeSession = function(){

  const today = new Date().toDateString();
  localStorage.setItem("lastSession",today);

  let streak = parseInt(localStorage.getItem("streak"))||0;
  streak++;
  localStorage.setItem("streak",streak);

  alert("Session completed. Streak: "+streak);
};

/* ===============================
   INIT
================================ */

window.onload = function(){
  renderDashboard();
};
