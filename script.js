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
  orderBy
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

const BASE_2KM = 470;

/* ===============================
   AUTH
================================ */

window.register = async () =>
  createUserWithEmailAndPassword(auth,email.value,password.value);

window.login = async () =>
  signInWithEmailAndPassword(auth,email.value,password.value);

window.logout = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  const status = document.getElementById("userStatus");
  if (!status) return;
  status.innerHTML = user
    ? `<span style="color:#10b981;">Logged in as ${user.email}</span>`
    : `<span style="color:#ef4444;">Not logged in</span>`;
});

/* ===============================
   UTILITIES
================================ */

function parseTimeToSeconds(t){
  if(!t) return BASE_2KM;
  if(t.includes(":")){
    const p=t.split(":");
    return parseInt(p[0])*60+parseInt(p[1]);
  }
  return parseInt(t);
}

function getWeek(){
  const start=new Date("2026-01-01");
  const now=new Date();
  const diff=Math.floor((now-start)/(1000*60*60*24));
  return Math.min(10,Math.max(1,Math.floor(diff/7)+1));
}

/* ===============================
   VO2 MAX ESTIMATOR
================================ */

function estimateVO2(twoKm){
  const timeMin = twoKm / 60;
  return (483 / timeMin) + 3.5;
}

/* ===============================
   XP + RANK + LEVEL UNLOCK
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

function unlockedTier(xp){
  if(xp<400) return 1;
  if(xp<800) return 2;
  return 3;
}

/* ===============================
   RECOVERY ENGINE
================================ */

function recoveryScore(push,pull,fatigue,sleep){
  const base=(push*1.5)+(pull*2.5);
  const penalty=fatigue*4;
  const sleepBonus=sleep>=8?20:sleep>=7?15:sleep>=6?5:-20;
  return base-penalty+sleepBonus+40;
}

function recoveryState(score){
  if(score>=110) return "GREEN";
  if(score>=75) return "AMBER";
  return "RED";
}

/* ===============================
   AI WEEKLY AUTO ADJUST
================================ */

function adjustIntensity(twoKm){
  const last=localStorage.getItem("last2km");
  if(!last) return twoKm;
  const improvement = last - twoKm;
  if(improvement>5) return twoKm-2;
  if(improvement<-5) return twoKm+2;
  return twoKm;
}

/* ===============================
   PROGRAM ENGINE
================================ */

function generateWeeklyPlan(twoKm,state,xp){

  const week=getWeek();
  const pace=twoKm/5;
  const tier=unlockedTier(xp);

  const advancedBlock = tier>=2 ? " + Loaded carries finisher" : "";
  const eliteBlock = tier>=3 ? " + Threshold finisher" : "";

  const plan=[
    `Intervals: ${6+week} x 400m @ ${(pace-2).toFixed(1)}s`,
    `Tempo 3-4km steady`,
    `Upper Strength circuit${advancedBlock}`,
    `Speed 8x200m fast`,
    `Lower Strength + Plyometrics${eliteBlock}`,
    `Long aerobic 6-8km`,
    `Mobility + Core`
  ];

  if(state==="RED")
    return plan.map(()=> "Recovery 30min + Stretch");

  if(state==="AMBER")
    return plan.map(w=>w+" (Reduced volume)");

  return plan;
}

/* ===============================
   SELECTION PROBABILITY
================================ */

function selectionProbability(push,pull,twoKm){
  let p=40;
  if(push>50)p+=15;
  if(pull>12)p+=15;
  if(twoKm<450)p+=20;
  if(twoKm<430)p+=10;
  return Math.min(p,95);
}

/* ===============================
   STREAK
================================ */

function updateStreak(){
  const today=new Date().toDateString();
  const last=localStorage.getItem("lastWorkout");
  let streak=parseInt(localStorage.getItem("streak"))||0;
  if(last!==today){
    streak++;
    localStorage.setItem("streak",streak);
    localStorage.setItem("lastWorkout",today);
  }
  return streak;
}

/* ===============================
   DASHBOARD RENDER
================================ */

function renderDashboard(data){

  const container=document.getElementById("todayWorkout");
  if(!container)return;

  container.innerHTML=`
  <div class="card">
    <h2>🔥 TODAY'S MISSION</h2>
    <p style="font-size:18px;font-weight:600;">${data.today}</p>
    <hr>
    <p><strong>Rank:</strong> ${data.rank}</p>
    <p><strong>XP:</strong> ${data.xp}</p>
    <p><strong>VO2:</strong> ${data.vo2.toFixed(1)}</p>
    <p><strong>Recovery:</strong> ${data.state}</p>
    <p><strong>Selection:</strong> ${data.selection}%</p>
    <p><strong>Streak:</strong> ${data.streak} days</p>
  </div>
  `;

  const rec=document.getElementById("recoveryInsight");
  if(rec){
    rec.innerHTML=`
      <div class="readiness ${data.state.toLowerCase()}">
        ${data.state} — Training Status
      </div>
    `;
  }

  renderCalendar(data.weekPlan);
}

/* ===============================
   WEEK CALENDAR
================================ */

function renderCalendar(plan){

  const out=document.getElementById("programOutput");
  if(!out)return;

  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  let html="<div class='card'><h3>📅 Weekly Plan</h3>";

  plan.forEach((w,i)=>{
    html+=`<p><strong>${days[i]}:</strong> ${w}</p>`;
  });

  html+="</div>";
  out.innerHTML=html;
}

/* ===============================
   SAVE PERFORMANCE
================================ */

window.savePerformance=async function(){

  const push=parseInt(manualPushups.value)||0;
  const pull=parseInt(manualPullups.value)||0;
  const fatigue=parseInt(manualFatigue.value)||5;
  const sleep=parseFloat(sleepHours.value)||7;
  let twoKm=parseTimeToSeconds(twoKmTime.value);

  twoKm=adjustIntensity(twoKm);

  localStorage.setItem("pushups",push);
  localStorage.setItem("pullups",pull);
  localStorage.setItem("twoKm",twoKm);
  localStorage.setItem("last2km",twoKm);

  const xp=calculateXP(push,pull,twoKm);
  const rank=getRank(xp);
  const recScore=recoveryScore(push,pull,fatigue,sleep);
  const state=recoveryState(recScore);
  const selection=selectionProbability(push,pull,twoKm);
  const vo2=estimateVO2(twoKm);
  const weekPlan=generateWeeklyPlan(twoKm,state,xp);
  const today=weekPlan[new Date().getDay()];
  const streak=updateStreak();

  const user=auth.currentUser;
  if(user){
    await addDoc(collection(db,"users",user.uid,"sessions"),{
      push,pull,fatigue,sleep,twoKm,xp,rank,state,selection,vo2,
      timestamp:Date.now()
    });
  }

  renderDashboard({xp,rank,state,selection,vo2,weekPlan,today,streak});
};

/* ===============================
   INIT
================================ */

window.onload=function(){

  const push=parseInt(localStorage.getItem("pushups"))||0;
  const pull=parseInt(localStorage.getItem("pullups"))||0;
  const twoKm=parseInt(localStorage.getItem("twoKm"))||BASE_2KM;

  const xp=calculateXP(push,pull,twoKm);
  const rank=getRank(xp);
  const state="GREEN";
  const selection=selectionProbability(push,pull,twoKm);
  const vo2=estimateVO2(twoKm);
  const weekPlan=generateWeeklyPlan(twoKm,state,xp);
  const today=weekPlan[new Date().getDay()];
  const streak=parseInt(localStorage.getItem("streak"))||1;

  renderDashboard({xp,rank,state,selection,vo2,weekPlan,today,streak});
};
