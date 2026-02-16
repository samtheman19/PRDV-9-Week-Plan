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
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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
   RECOVERY MODEL
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
   PERFORMANCE AI
================================ */

function predict2KMTrend(twoKmHistory){
  if(twoKmHistory.length<3) return BASE_2KM;
  const recent = twoKmHistory.slice(-3);
  const avg = recent.reduce((a,b)=>a+b,0)/recent.length;
  return Math.floor(avg-5); // predicts small improvement
}

function detectPlateau(twoKmHistory){
  if(twoKmHistory.length<4) return false;
  const last4 = twoKmHistory.slice(-4);
  return Math.max(...last4)-Math.min(...last4)<5;
}

/* ===============================
   COMMANDER WORKOUT ENGINE
================================ */

async function generateWorkout(){

  const user = auth.currentUser;
  if(!user) return;

  const q = query(
    collection(db,"users",user.uid,"sessions"),
    orderBy("timestamp","asc")
  );

  const snap = await getDocs(q);

  let twoKmHistory=[];
  let fatigueHistory=[];
  let sleepHistory=[];

  snap.forEach(doc=>{
    const d=doc.data();
    twoKmHistory.push(d.twoKm||BASE_2KM);
    fatigueHistory.push(d.fatigue||5);
    sleepHistory.push(d.sleep||7);
  });

  const latest2km = twoKmHistory.at(-1)||BASE_2KM;
  const predicted = predict2KMTrend(twoKmHistory);
  const plateau = detectPlateau(twoKmHistory);

  const avgSleep = sleepHistory.reduce((a,b)=>a+b,0)/sleepHistory.length||7;
  const avgFatigue = fatigueHistory.reduce((a,b)=>a+b,0)/fatigueHistory.length||5;

  const readiness = recoveryScore(
    parseInt(localStorage.getItem("pushups"))||0,
    parseInt(localStorage.getItem("pullups"))||0,
    avgFatigue,
    avgSleep
  );

  const state = recoveryState(readiness);

  let workout = "";

  if(state==="GREEN"){
    workout = `8 x 400m @ ${(latest2km/5-2).toFixed(1)}s`;
  }
  else if(state==="AMBER"){
    workout = `6 x 400m @ ${(latest2km/5).toFixed(1)}s`;
  }
  else{
    workout = "Recovery Run 3km + Mobility";
  }

  if(plateau){
    workout = "Shock Week: 10 x 200m Fast";
  }

  displayCommanderCard(workout,state,predicted);
}

function displayCommanderCard(workout,state,predicted){

  const container = document.getElementById("todayWorkout");
  if(!container) return;

  container.innerHTML=`
    <div class="card">
      <h2>🧠 AI Commander Mission</h2>
      <strong>${workout}</strong>
      <p style="margin-top:10px">Recovery State: ${state}</p>
      <p>Predicted 2KM in 3 weeks: ${predicted}s</p>
    </div>
  `;
}

/* ===============================
   SAVE SESSION
================================ */

window.savePerformance = async function(){

  const push=parseInt(manualPushups.value)||0;
  const pull=parseInt(manualPullups.value)||0;
  const fatigue=parseInt(manualFatigue.value)||5;
  const sleep=parseFloat(sleepHours.value)||7;
  const twoKm=parseInt(twoKmTime.value)||BASE_2KM;

  localStorage.setItem("pushups",push);
  localStorage.setItem("pullups",pull);

  const user=auth.currentUser;
  if(user){
    await addDoc(collection(db,"users",user.uid,"sessions"),{
      push,pull,fatigue,sleep,twoKm,timestamp:Date.now()
    });
  }

  generateWorkout();

  alert("Session Logged");
};

/* ===============================
   SELECTION PROBABILITY
================================ */

window.runSelectionSimulation=function(){

  const push=parseInt(localStorage.getItem("pushups"))||0;
  const pull=parseInt(localStorage.getItem("pullups"))||0;
  const twoKm=parseInt(localStorage.getItem("twoKm"))||BASE_2KM;

  let probability=50;

  if(push>50) probability+=15;
  if(pull>12) probability+=15;
  if(twoKm<450) probability+=20;

  if(probability>95) probability=95;

  alert("Selection Success Probability: "+probability+"%");
};

/* ===============================
   PWA
================================ */

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js');
}

/* ===============================
   INIT
================================ */

window.onload=function(){
  generateWorkout();
};
