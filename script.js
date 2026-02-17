import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyD7sHTLny_kAtTN_xXmkovFC-GSTtFMeNo",
  authDomain: "prdv-platform.firebaseapp.com",
  projectId: "prdv-platform",
  appId: "1:578412239135:web:7680746ea4df63246df82a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* AUTH */
window.register=()=>createUserWithEmailAndPassword(auth,email.value,password.value);
window.login=()=>signInWithEmailAndPassword(auth,email.value,password.value);
window.logout=()=>signOut(auth);

onAuthStateChanged(auth,user=>{
  userStatus.innerText=user?"Logged in":"Not logged in";
});

/* DATE SYSTEM */
const START=new Date();
const END=new Date("2026-04-27");
let currentDate=new Date();

/* TIMER */
let seconds=0,timerInt=null;
window.startTimer=()=>{if(!timerInt)timerInt=setInterval(()=>{seconds++;updateTimer()},1000)};
window.pauseTimer=()=>{clearInterval(timerInt);timerInt=null};
window.endSession=async()=>{
  pauseTimer();
  await saveSession();
  seconds=0;
  updateTimer();
};

function updateTimer(){
  const h=String(Math.floor(seconds/3600)).padStart(2,'0');
  const m=String(Math.floor(seconds%3600/60)).padStart(2,'0');
  const s=String(seconds%60).padStart(2,'0');
  timer.innerText=`${h}:${m}:${s}`;
}

/* PERFORMANCE DATA */
let perf={push:30,pull:8,twoKm:470,sleep:7,fatigue:5};

/* UPDATE INPUT */
window.updatePerformance=function(){
  perf.push=parseInt(pushInput.value)||perf.push;
  perf.pull=parseInt(pullInput.value)||perf.pull;
  perf.twoKm=parseInt(twoKmInput.value)||perf.twoKm;
  perf.sleep=parseFloat(sleepInput.value)||perf.sleep;
  perf.fatigue=parseInt(fatigueInput.value)||perf.fatigue;
  render();
};

/* SELECTION READINESS INDEX */
function selectionIndex(){
  let score=0;

  score+=Math.min(perf.push/60*30,30);
  score+=Math.min(perf.pull/15*20,20);
  score+=Math.max(0,(500-perf.twoKm)/100*30);
  score+=Math.min(perf.sleep/8*10,10);
  score+=Math.max(0,(10-perf.fatigue)/10*10);

  return Math.round(Math.min(score,100));
}

/* TRAINING LOAD */
function trainingLoad(){
  return seconds/60 + (perf.fatigue*5);
}

/* INJURY RISK */
function injuryRisk(){
  const load=trainingLoad();
  if(load>200)return "HIGH";
  if(load>120)return "MODERATE";
  return "LOW";
}

/* FORECAST */
function forecast(){
  const predicted=Math.max(420,perf.twoKm-(perf.push+perf.pull)/15);
  return `Predicted 2KM: ${predicted}s`;
}

/* SAVE SESSION */
async function saveSession(){
  const user=auth.currentUser;
  if(!user)return;
  await setDoc(
    doc(db,"users",user.uid,"sessions",currentDate.toDateString()),
    {
      date:currentDate,
      duration:seconds,
      performance:perf,
      sri:selectionIndex()
    }
  );
}

/* WORKOUT */
function workoutPlan(){
  const day=currentDate.getDay();
  if(day===1)return "Lower Unilateral + Z2";
  if(day===2)return "VO2 Intervals";
  if(day===3)return "Upper Strength";
  if(day===4)return "Tempo";
  if(day===5)return "Conditioning";
  if(day===6)return "Long Z2";
  return "Recovery";
}

/* NAV */
window.changeDay=(o)=>{
  currentDate.setDate(currentDate.getDate()+o);
  if(currentDate<START)currentDate=new Date(START);
  if(currentDate>END)currentDate=new Date(END);
  render();
};

/* RENDER */
function render(){
  currentDateDiv.innerText=currentDate.toDateString();

  const sri=selectionIndex();
  sriScore.innerText=`SRI: ${sri}/100`;
  sriStatus.innerText=
    sri>75?"GREEN – Competitive":
    sri>55?"AMBER – Building":
    "RED – Below Standard";

  loadDisplay.innerText=`Training Load: ${trainingLoad().toFixed(1)}`;
  injuryRisk.innerText=`Injury Risk: ${injuryRisk()}`;

  forecast.innerText=forecast();

  workoutCard.innerText=workoutPlan();
}

render();
