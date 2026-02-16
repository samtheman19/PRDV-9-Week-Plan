import { initializeApp } from 
"https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
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
  apiKey: "YOUR_KEY",
  authDomain: "prdv-platform.firebaseapp.com",
  projectId: "prdv-platform"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const BASE_2KM = 470;

/* ===============================
   AUTH
================================ */

window.register = async () =>
  createUserWithEmailAndPassword(auth,email.value,password.value);

window.login = async () =>
  signInWithEmailAndPassword(auth,email.value,password.value);

window.logout = () => signOut(auth);

/* ===============================
   XP SYSTEM
================================ */

function calculateXP(push,pull,twoKm){
  return (push*2)+(pull*4)+Math.max(0,500-twoKm);
}

function getRank(xp){
  if(xp<200) return "Recruit";
  if(xp<400) return "Trained";
  if(xp<600) return "Advanced";
  if(xp<800) return "Operator";
  if(xp<1000) return "Elite";
  return "Tier 1";
}

function xpProgress(xp){
  return Math.min((xp%200)/200*100,100);
}

/* ===============================
   RECOVERY ENGINE
================================ */

function recoveryScore(push,pull,fatigue,sleep){
  const sleepBonus = sleep>=8?15:sleep>=7?10:sleep>=6?5:-15;
  return (push*2)+(pull*3)-(fatigue*3)+sleepBonus;
}

function recoveryState(score){
  if(score>=100) return "GREEN";
  if(score>=60) return "AMBER";
  return "RED";
}

/* ===============================
   MISSION ENGINE
================================ */

function missionGenerator(twoKm,state){
  const pace = twoKm/5;
  if(state==="GREEN") return `8 x 400m @ ${(pace-2).toFixed(1)}s`;
  if(state==="AMBER") return `6 x 400m @ ${pace.toFixed(1)}s`;
  return "Recovery Run + Mobility 30min";
}

/* ===============================
   SELECTION PROBABILITY
================================ */

function selectionProbability(push,pull,twoKm){
  let prob = 40;
  if(push>50) prob+=15;
  if(pull>12) prob+=15;
  if(twoKm<450) prob+=20;
  if(twoKm<430) prob+=10;
  return Math.min(prob,95);
}

/* ===============================
   DASHBOARD RENDER
================================ */

function renderDashboard(data){

  const container = document.getElementById("todayWorkout");
  if(!container) return;

  const progress = xpProgress(data.xp);

  container.innerHTML = `
    <div class="card battle-dashboard">
      <h2>⚔ ELITE COMMAND CENTER</h2>

      <div class="rank-glow">${data.rank}</div>

      <p>XP: ${data.xp}</p>

      <div class="progress-container">
        <div class="progress-bar" style="width:${progress}%"></div>
      </div>

      <p style="margin-top:15px;">
        Recovery: <strong>${data.state}</strong>
      </p>

      <p>Mission: ${data.workout}</p>

      <p>Selection Probability: ${data.selection}%</p>

      <div class="progress-container">
        <div class="progress-bar"
             style="width:${data.selection}%">
        </div>
      </div>
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

  const xp = calculateXP(push,pull,twoKm);
  const rank = getRank(xp);
  const recScore = recoveryScore(push,pull,fatigue,sleep);
  const state = recoveryState(recScore);
  const workout = missionGenerator(twoKm,state);
  const selection = selectionProbability(push,pull,twoKm);

  const user = auth.currentUser;
  if(user){
    await addDoc(collection(db,"users",user.uid,"sessions"),{
      push,pull,fatigue,sleep,twoKm,xp,rank,timestamp:Date.now()
    });
  }

  renderDashboard({xp,rank,state,workout,selection});
};

/* ===============================
   RESISTANCE MODE
================================ */

window.toggleResistance = function(){
  document.body.classList.toggle("resistance");
};

/* ===============================
   INIT LOAD
================================ */

window.onload = function(){

  const push = parseInt(localStorage.getItem("pushups"))||0;
  const pull = parseInt(localStorage.getItem("pullups"))||0;
  const twoKm = parseInt(localStorage.getItem("twoKm"))||BASE_2KM;

  const xp = calculateXP(push,pull,twoKm);
  const rank = getRank(xp);

  const recScore = recoveryScore(push,pull,5,7);
  const state = recoveryState(recScore);
  const workout = missionGenerator(twoKm,state);
  const selection = selectionProbability(push,pull,twoKm);

  renderDashboard({xp,rank,state,workout,selection});
};
