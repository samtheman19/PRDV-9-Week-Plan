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
   PERFORMANCE ENGINE
================================ */

const BASE_2KM = 470;

function get400Split(twoKm){
  return (twoKm/5).toFixed(1);
}

/* ===============================
   10 WEEK PROGRAM (6 DAYS)
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

function getWorkout(twoKm){

  const week = getCurrentWeek();
  const day = new Date().getDay(); // 0 Sunday

  const split = get400Split(twoKm);

  // Sunday recovery
  if(day===0){
    return "Full Rest + Mobility 20min";
  }

  // Monday Lower Strength
  if(day===1){
    return `
    LOWER STRENGTH (Unilateral Focus)

    Bulgarian Split Squat 4x8
    Single Leg RDL 4x8
    Goblet Lateral Lunge 3x10
    Skater Squats 3x8
    Soleus Raise 3x15
    + 20min Zone 2
    `;
  }

  // Tuesday VO2
  if(day===2){
    let reps = week<=3?6:week<=6?7:8;
    return `
    VO2 Session

    Warm Up 10min
    ${reps} x 400m @ ${split}s
    90 sec rest
    `;
  }

  // Wednesday Upper
  if(day===3){
    return `
    UPPER STRENGTH

    Pull Ups 4x max
    Barbell Row 4x6
    DB Bench 4x8
    Face Pulls 3x15
    Core circuit
    `;
  }

  // Thursday Tempo
  if(day===4){
    return `
    TEMPO

    2km warm up
    3 x 1km tempo
    2min float
    1km cool down
    `;
  }

  // Friday Power Conditioning
  if(day===5){
    return `
    CONDITIONING

    3 Rounds:
    400m Ski
    20 Wall Balls
    400m Row
    `;
  }

  // Saturday Long Z2
  if(day===6){
    let mins = week<=3?70:week<=6?80:90;
    return `
    LONG ZONE 2

    ${mins} min steady Z2
    HR controlled
    `;
  }
}

/* ===============================
   DASHBOARD RENDER
================================ */

function renderDashboard(){

  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM;
  const workout = getWorkout(twoKm);
  const week = getCurrentWeek();

  const container = document.getElementById("todayWorkout");
  if(!container) return;

  container.innerHTML = `
  <div class="card">
    <h2>🔥 TODAY'S MISSION</h2>
    <p><strong>Week:</strong> ${week}/10</p>
    <pre style="white-space:pre-wrap;">${workout}</pre>
    <button onclick="completeSession()" class="success">Complete Session</button>
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

  const user = auth.currentUser;

  if(user){
    await addDoc(collection(db,"users",user.uid,"sessions"),{
      push,pull,fatigue,sleep,twoKm,
      timestamp:Date.now()
    });
  }

  alert("Performance saved.");
  renderDashboard();
};

/* ===============================
   SESSION COMPLETE + STREAK
================================ */

window.completeSession = function(){

  const today = new Date().toDateString();
  localStorage.setItem("lastSession",today);

  let streak = parseInt(localStorage.getItem("streak"))||0;
  streak++;
  localStorage.setItem("streak",streak);

  alert("Session completed. Streak: "+streak+" days");
};

/* ===============================
   INIT
================================ */

window.onload = function(){
  renderDashboard();
};
