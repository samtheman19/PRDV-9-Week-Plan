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
  addDoc,
  getDocs,
  query,
  where
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
   GLOBAL PROGRAM STATE
================================ */

const TOTAL_DAYS = 70;
const BASE_2KM = 470;

let currentViewDay = 0;

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
   PROGRAM CLOCK
================================ */

function getProgramStart(){
  if(!localStorage.getItem("programStart")){
    localStorage.setItem("programStart",Date.now());
  }
  return parseInt(localStorage.getItem("programStart"));
}

function getTodayIndex(){
  const diff=Math.floor((Date.now()-getProgramStart())/(1000*60*60*24));
  return Math.min(diff,TOTAL_DAYS-1);
}

/* ===============================
   WORKOUT STRUCTURE
================================ */

function getWorkoutForIndex(dayIndex){

  const week=Math.floor(dayIndex/7)+1;
  const day=dayIndex%7;
  const twoKm=parseInt(localStorage.getItem("twoKm"))||BASE_2KM;

  if(day===0) return {week,title:"Recovery + Mobility",exercises:[]};

  if(day===1) return {
    week,title:"Lower Strength",
    exercises:[
      {name:"Bulgarian Split Squat",unilateral:true},
      {name:"Single Leg RDL",unilateral:true},
      {name:"Lateral Lunge",unilateral:true}
    ]
  };

  if(day===2){
    const reps=week<=3?6:week<=6?7:8;
    return {week,title:"VO2 Intervals",
      exercises:[
        {name:`${reps} x 400m @ ${(twoKm/5).toFixed(1)}s`,cardio:true}
      ]
    };
  }

  if(day===3) return {
    week,title:"Upper Strength",
    exercises:[
      {name:"Pull Ups"},
      {name:"Barbell Row"},
      {name:"DB Bench"}
    ]
  };

  if(day===4) return {
    week,title:"Tempo",
    exercises:[{name:"3 x 1km Tempo",cardio:true}]
  };

  if(day===5) return {
    week,title:"Conditioning",
    exercises:[
      {name:"Ski 400m",cardio:true},
      {name:"Wall Balls"},
      {name:"Row 400m",cardio:true}
    ]
  };

  if(day===6){
    const mins=week<=3?70:week<=6?80:90;
    return {week,title:`Long Zone 2 (${mins}min)`,
      exercises:[{name:"Zone 2 Run",cardio:true}]
    };
  }
}

/* ===============================
   NAVIGATION
================================ */

window.nextDay=()=>{ if(currentViewDay<TOTAL_DAYS-1){ currentViewDay++; renderDashboard(); }};
window.prevDay=()=>{ if(currentViewDay>0){ currentViewDay--; renderDashboard(); }};

/* ===============================
   CALENDAR GRID
================================ */

async function renderCalendar(){

  const workout=getWorkoutForIndex(currentViewDay);
  const week=workout.week;
  const startDay=(week-1)*7;

  const container=document.getElementById("todayWorkout");

  let grid=`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:15px;">`;

  for(let i=0;i<7;i++){
    const dayIndex=startDay+i;
    const isToday=dayIndex===getTodayIndex();
    const style=isToday?"background:#10b981;":"background:#1f2937;";
    grid+=`<div onclick="jumpToDay(${dayIndex})"
             style="padding:8px;text-align:center;border-radius:6px;cursor:pointer;${style}">
             ${i+1}
           </div>`;
  }

  grid+=`</div>`;

  container.insertAdjacentHTML("afterbegin",grid);
}

window.jumpToDay=(index)=>{
  currentViewDay=index;
  renderDashboard();
};

/* ===============================
   DASHBOARD
================================ */

function renderDashboard(){

  const workout=getWorkoutForIndex(currentViewDay);
  const container=document.getElementById("todayWorkout");
  if(!container) return;

  let exHTML="";

  workout.exercises.forEach((ex,i)=>{

    if(ex.cardio){
      exHTML+=`
      <div class="exercise-card">
        <h3>${ex.name}</h3>
        <input placeholder="Time (sec)" id="ex_${i}_time">
      </div>`;
    }

    else if(ex.unilateral){
      exHTML+=`
      <div class="exercise-card">
        <h3>${ex.name}</h3>
        <input placeholder="Left Weight" id="ex_${i}_lw">
        <input placeholder="Left Reps" id="ex_${i}_lr">
        <input placeholder="Right Weight" id="ex_${i}_rw">
        <input placeholder="Right Reps" id="ex_${i}_rr">
      </div>`;
    }

    else{
      exHTML+=`
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
      <button onclick="prevDay()">⬅</button>
      <button onclick="nextDay()">➡</button>
    </div>

    ${exHTML}

    <button onclick="saveSession()" class="primary">
      Save Session
    </button>

    <div id="progressSuggestion" style="margin-top:15px;"></div>

  </div>`;

  renderCalendar();
}

/* ===============================
   SAVE SESSION
================================ */

window.saveSession=async function(){

  const workout=getWorkoutForIndex(currentViewDay);
  let data=[];

  workout.exercises.forEach((ex,i)=>{
    if(ex.cardio){
      data.push({name:ex.name,time:document.getElementById(`ex_${i}_time`)?.value});
    }
    else if(ex.unilateral){
      data.push({
        name:ex.name,
        lw:document.getElementById(`ex_${i}_lw`)?.value,
        lr:document.getElementById(`ex_${i}_lr`)?.value,
        rw:document.getElementById(`ex_${i}_rw`)?.value,
        rr:document.getElementById(`ex_${i}_rr`)?.value
      });
    }
    else{
      data.push({
        name:ex.name,
        weight:document.getElementById(`ex_${i}_w`)?.value,
        reps:document.getElementById(`ex_${i}_r`)?.value
      });
    }
  });

  const user=auth.currentUser;
  if(user){
    await addDoc(collection(db,"users",user.uid,"sessions"),{
      dayIndex:currentViewDay,
      week:workout.week,
      exercises:data,
      timestamp:Date.now()
    });
  }

  suggestProgression(data);
  alert("Session saved.");
};

/* ===============================
   AUTO PROGRESSION ENGINE
================================ */

function suggestProgression(data){

  let suggestion="";

  data.forEach(ex=>{
    if(ex.weight && ex.reps>=6){
      suggestion+=`Increase ${ex.name} by 2.5kg next week.<br>`;
    }
  });

  if(suggestion==="") suggestion="Maintain current loads.";

  const el=document.getElementById("progressSuggestion");
  if(el) el.innerHTML=suggestion;
}

/* ===============================
   INIT
================================ */

window.onload=function(){
  currentViewDay=getTodayIndex();
  renderDashboard();
};
