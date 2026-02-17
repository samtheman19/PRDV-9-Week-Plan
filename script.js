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
  projectId: "prdv-platform"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===============================
   AUTH
================================ */

window.register = async () => {
  try { await createUserWithEmailAndPassword(auth,email.value,password.value); }
  catch(e){ alert(e.message); }
};

window.login = async () => {
  try { await signInWithEmailAndPassword(auth,email.value,password.value); }
  catch(e){ alert(e.message); }
};

window.logout = async () => await signOut(auth);

onAuthStateChanged(auth,(user)=>{
  const status=document.getElementById("userStatus");
  if(!status) return;
  status.innerHTML = user
    ? `<span style="color:#10b981;">Logged in as ${user.email}</span>`
    : `<span style="color:#ef4444;">Not logged in</span>`;
});

/* ===============================
   PROGRAM ENGINE
================================ */

const BASE_2KM = 470;
const TOTAL_DAYS = 70; // 10 weeks

let currentViewDay = 0;

function getProgramStart(){
  if(!localStorage.getItem("programStart")){
    localStorage.setItem("programStart",Date.now());
  }
  return parseInt(localStorage.getItem("programStart"));
}

function getTodayIndex(){
  const diff = Math.floor((Date.now()-getProgramStart())/(1000*60*60*24));
  return Math.min(diff, TOTAL_DAYS-1);
}

function getWorkoutForIndex(dayIndex){

  const week = Math.floor(dayIndex/7)+1;
  const day = dayIndex % 7;
  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM;

  if(day===0){
    return { week, title:"Recovery + Mobility", exercises:[] };
  }

  if(day===1){
    return {
      week,
      title:"Lower Strength (Unilateral)",
      exercises:[
        {name:"Bulgarian Split Squat", unilateral:true},
        {name:"Single Leg RDL", unilateral:true},
        {name:"Lateral Lunge", unilateral:true}
      ]
    };
  }

  if(day===2){
    const reps = week<=3?6:week<=6?7:8;
    return {
      week,
      title:`VO2 Intervals`,
      exercises:[
        {name:`${reps} x 400m @ ${(twoKm/5).toFixed(1)}s`, cardio:true}
      ]
    };
  }

  if(day===3){
    return {
      week,
      title:"Upper Strength",
      exercises:[
        {name:"Pull Ups"},
        {name:"Barbell Row"},
        {name:"DB Bench"}
      ]
    };
  }

  if(day===4){
    return {
      week,
      title:"Tempo Session",
      exercises:[
        {name:"3 x 1km Tempo", cardio:true}
      ]
    };
  }

  if(day===5){
    return {
      week,
      title:"Power Conditioning",
      exercises:[
        {name:"Ski Erg 400m", cardio:true},
        {name:"Wall Balls"},
        {name:"Row 400m", cardio:true}
      ]
    };
  }

  if(day===6){
    const mins = week<=3?70:week<=6?80:90;
    return {
      week,
      title:`Long Zone 2 (${mins} min)`,
      exercises:[
        {name:"Zone 2 Run", cardio:true}
      ]
    };
  }
}

/* ===============================
   NAVIGATION
================================ */

window.nextDay = function(){
  if(currentViewDay < TOTAL_DAYS-1){
    currentViewDay++;
    renderDashboard();
  }
};

window.prevDay = function(){
  if(currentViewDay > 0){
    currentViewDay--;
    renderDashboard();
  }
};

/* ===============================
   RENDER DASHBOARD
================================ */

function renderDashboard(){

  const workout = getWorkoutForIndex(currentViewDay);
  const container = document.getElementById("todayWorkout");
  if(!container) return;

  let exerciseHTML="";

  workout.exercises.forEach((ex,i)=>{

    if(ex.cardio){
      exerciseHTML+=`
        <div class="exercise-card">
          <h3>${ex.name}</h3>
          <input placeholder="Time (seconds)" id="ex_${i}_time">
        </div>`;
    }

    else if(ex.unilateral){
      exerciseHTML+=`
        <div class="exercise-card">
          <h3>${ex.name}</h3>
          <input placeholder="Left Weight" id="ex_${i}_lw">
          <input placeholder="Left Reps" id="ex_${i}_lr">
          <input placeholder="Right Weight" id="ex_${i}_rw">
          <input placeholder="Right Reps" id="ex_${i}_rr">
        </div>`;
    }

    else{
      exerciseHTML+=`
        <div class="exercise-card">
          <h3>${ex.name}</h3>
          <input placeholder="Weight" id="ex_${i}_w">
          <input placeholder="Reps" id="ex_${i}_r">
        </div>`;
    }

  });

  container.innerHTML=`
    <div class="card">
      <h2>Week ${workout.week} — ${workout.title}</h2>

      <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
        <button onclick="prevDay()">⬅ Previous</button>
        <button onclick="nextDay()">Next ➡</button>
      </div>

      ${exerciseHTML}

      <button onclick="saveSession()" class="primary">
        Save Session
      </button>
    </div>
  `;
}

/* ===============================
   SAVE SESSION
================================ */

window.saveSession = async function(){

  const workout = getWorkoutForIndex(currentViewDay);
  let exerciseData=[];

  workout.exercises.forEach((ex,i)=>{

    if(ex.cardio){
      exerciseData.push({
        name:ex.name,
        time:document.getElementById(`ex_${i}_time`)?.value||null
      });
    }

    else if(ex.unilateral){
      exerciseData.push({
        name:ex.name,
        leftWeight:document.getElementById(`ex_${i}_lw`)?.value||null,
        leftReps:document.getElementById(`ex_${i}_lr`)?.value||null,
        rightWeight:document.getElementById(`ex_${i}_rw`)?.value||null,
        rightReps:document.getElementById(`ex_${i}_rr`)?.value||null
      });
    }

    else{
      exerciseData.push({
        name:ex.name,
        weight:document.getElementById(`ex_${i}_w`)?.value||null,
        reps:document.getElementById(`ex_${i}_r`)?.value||null
      });
    }

  });

  const user = auth.currentUser;

  if(user){
    await addDoc(collection(db,"users",user.uid,"sessions"),{
      dayIndex:currentViewDay,
      week:workout.week,
      exercises:exerciseData,
      timestamp:Date.now()
    });
  }

  alert("Session saved.");
};

/* ===============================
   INIT
================================ */

window.onload = function(){
  currentViewDay = getTodayIndex(); // auto open today
  renderDashboard();
};
