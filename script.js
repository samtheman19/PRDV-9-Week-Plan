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
   PROGRAM DATES
================================ */

const PROGRAM_START = new Date();
const PROGRAM_END = new Date("2026-04-27");
let selectedDate = new Date();

/* ===============================
   AUTH
================================ */

window.register = async () => {
  try { await createUserWithEmailAndPassword(auth,email.value,password.value); }
  catch (e) { alert(e.message); }
};

window.login = async () => {
  try { await signInWithEmailAndPassword(auth,email.value,password.value); }
  catch (e) { alert(e.message); }
};

window.logout = async () => { await signOut(auth); };

onAuthStateChanged(auth,(user)=>{
  const status = document.getElementById("userStatus");
  if(!status) return;
  status.innerHTML = user
    ? `<span style="color:#10b981;font-weight:600;">Logged in as ${user.email}</span>`
    : `<span style="color:#ef4444;">Not logged in</span>`;
});

/* ===============================
   WEEK + PHASE
================================ */

function getWeek(date){
  const diff = Math.floor((date - PROGRAM_START)/(1000*60*60*24));
  return Math.min(Math.floor(diff/7)+1,10);
}

function getPhase(week){
  if(week<=3) return "Base";
  if(week<=6) return "Build";
  if(week<=8) return "Peak";
  return "Taper";
}

/* ===============================
   READINESS ENGINE
================================ */

function getReadiness(){

  const sleep = parseInt(localStorage.getItem("sleepScore"))||3;
  const soreness = parseInt(localStorage.getItem("sorenessScore"))||3;
  const stress = parseInt(localStorage.getItem("stressScore"))||3;
  const motivation = parseInt(localStorage.getItem("motivationScore"))||3;

  const score = (sleep + motivation) - (soreness + stress);

  if(score >= 2) return {state:"GREEN",mod:1};
  if(score >= 0) return {state:"AMBER",mod:0.85};
  return {state:"RED",mod:0.7};
}

/* ===============================
   PROJECTION ENGINE
================================ */

function projected2km(week){
  const base = parseInt(localStorage.getItem("twoKm")) || 470;
  const improvement = week * 3;
  return Math.max(base - improvement, 390);
}

/* ===============================
   AUTO PROGRESSION
================================ */

function getProgression(exercise, week){

  let baseLoad = parseInt(localStorage.getItem(exercise+"_base")) || 40;

  if(week>1){
    const completed = localStorage.getItem(exercise+"_week"+(week-1));
    if(completed==="true"){
      baseLoad += 2.5;
    }
  }

  localStorage.setItem(exercise+"_base",baseLoad);
  return baseLoad;
}

/* ===============================
   REST TIMER
================================ */

window.startRest = function(sec){

  let remaining = sec;
  const btn = document.getElementById("restBtn");

  btn.innerText = remaining+"s";

  const timer = setInterval(()=>{
    remaining--;
    btn.innerText = remaining+"s";
    if(remaining<=0){
      clearInterval(timer);
      btn.innerText = "Rest Done";
    }
  },1000);
};

/* ===============================
   WORKOUT BUILDER
================================ */

function buildStrengthDay(date){

  const week = getWeek(date);
  const load = getProgression("splitSquat",week);

  return `
<h3>Bulgarian Split Squat</h3>
${setInputs("splitSquat",load,8)}

<h3>Single Leg RDL</h3>
${setInputs("singleRDL",load,8)}

<button id="restBtn" onclick="startRest(90)">Start 90s Rest</button>
`;
}

function setInputs(name,load,reps){

  let html="";
  for(let i=1;i<=4;i++){
    html += `
    <div style="margin-bottom:10px;">
      Set ${i} –
      <input id="${name}_w${i}" placeholder="kg" value="${load}" style="width:60px;">
      <input id="${name}_r${i}" placeholder="reps" value="${reps}" style="width:60px;">
    </div>
    `;
  }
  return html;
}

/* ===============================
   NAVIGATION
================================ */

window.prevDay = function(){
  selectedDate.setDate(selectedDate.getDate()-1);
  render();
};

window.nextDay = function(){
  selectedDate.setDate(selectedDate.getDate()+1);
  render();
};

/* ===============================
   RENDER
================================ */

function render(){

  if(selectedDate < PROGRAM_START) selectedDate = new Date(PROGRAM_START);
  if(selectedDate > PROGRAM_END) selectedDate = new Date(PROGRAM_END);

  const week = getWeek(selectedDate);
  const phase = getPhase(week);
  const readiness = getReadiness();
  const proj = projected2km(week);

  const day = selectedDate.getDay();

  let workoutHTML="";

  if(day===1){
    workoutHTML = buildStrengthDay(selectedDate);
  } else {
    workoutHTML = "<p>Conditioning / Run Session</p>";
  }

  const container = document.getElementById("todayWorkout");

  container.innerHTML = `
  <div class="card">

    <h2>${selectedDate.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</h2>

    <p><strong>Week ${week}/10</strong></p>
    <p>Phase: ${phase}</p>
    <p>Readiness: ${readiness.state}</p>
    <p>Projected 2KM: ${proj} sec</p>

    <div style="display:flex;justify-content:space-between;margin:10px 0;">
      <button onclick="prevDay()">⬅</button>
      <button onclick="nextDay()">➡</button>
    </div>

    ${workoutHTML}

    <button onclick="completeSession()" class="success">
      Complete Session
    </button>

  </div>
  `;
}

/* ===============================
   COMPLETE SESSION
================================ */

window.completeSession = async function(){

  const week = getWeek(selectedDate);
  localStorage.setItem("splitSquat_week"+week,"true");

  const user = auth.currentUser;

  if(user){
    await addDoc(collection(db,"users",user.uid,"sessions"),{
      date:selectedDate.toDateString(),
      week:week,
      timestamp:Date.now()
    });
  }

  alert("Session saved & progression applied.");
};

/* ===============================
   INIT
================================ */

window.onload = function(){
  selectedDate = new Date();
  render();
};
