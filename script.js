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
  collection,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* FIREBASE CONFIG */
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

/* AUTH */
window.register = () =>
  createUserWithEmailAndPassword(auth,email.value,password.value);

window.login = () =>
  signInWithEmailAndPassword(auth,email.value,password.value);

window.logout = () => signOut(auth);

onAuthStateChanged(auth,user=>{
  document.getElementById("userStatus").innerText =
    user ? "Logged in" : "Not logged in";
});

/* DATE SYSTEM */
const START = new Date();
const END = new Date("2026-04-27");
let currentDate = new Date();

/* TIMER */
let seconds = 0;
let timerInt = null;

window.startTimer = ()=>{
  if(timerInt) return;
  timerInt = setInterval(()=>{
    seconds++;
    updateTimer();
  },1000);
};

window.pauseTimer = ()=>{
  clearInterval(timerInt);
  timerInt=null;
};

window.endSession = async ()=>{
  pauseTimer();
  await saveSession();
  seconds=0;
  updateTimer();
};

function updateTimer(){
  const h = String(Math.floor(seconds/3600)).padStart(2,'0');
  const m = String(Math.floor(seconds%3600/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  document.getElementById("timer").innerText=`${h}:${m}:${s}`;
}

/* READINESS ENGINE */
function readiness(){
  const sleep=parseFloat(sleepInput.value)||7;
  const fatigue=parseInt(fatigueInput.value)||5;
  let score = (sleep*10)-(fatigue*5);
  let state = score>40?"GREEN":score>20?"AMBER":"RED";
  document.getElementById("readinessStatus").innerText = state;
  return state;
}

/* WORKOUT STRUCTURE */
function workoutPlan(){
  const day=currentDate.getDay();
  if(day===1) return {title:"Lower – Unilateral",ex:["Bulgarian Split Squat","Single Leg RDL","Lateral Lunge","Soleus Raise"]};
  if(day===2) return {title:"VO2 Intervals",ex:["400m Repeats x6"]};
  if(day===3) return {title:"Upper Strength",ex:["Pull Ups","Barbell Row","DB Bench"]};
  if(day===4) return {title:"Tempo Run",ex:["3 x 1km"]};
  if(day===5) return {title:"Conditioning",ex:["Ski 400m","Wall Balls","Row 400m"]};
  if(day===6) return {title:"Long Zone 2",ex:["70–90min steady"]};
  return {title:"Recovery",ex:[]};
}

/* RENDER */
function render(){
  document.getElementById("currentDate").innerText =
    currentDate.toDateString();

  const w=workoutPlan();
  let html=`<h3>${w.title}</h3>`;
  w.ex.forEach(e=>{
    html+=`<div class="exercise"><strong>${e}</strong>`;
    for(let i=1;i<=3;i++){
      html+=`
      <div class="set-row">
        <input placeholder="Set ${i} reps/load">
        <button onclick="this.classList.toggle('complete')">✓</button>
      </div>`;
    }
    html+=`</div>`;
  });
  document.getElementById("workoutCard").innerHTML=html;
}

/* SAVE TO FIREBASE */
async function saveSession(){
  const user=auth.currentUser;
  if(!user) return;

  await setDoc(
    doc(db,"users",user.uid,"sessions",currentDate.toDateString()),
    {
      date:currentDate,
      duration:seconds,
      readiness:readiness()
    }
  );
}

/* NAV */
window.changeDay=(o)=>{
  currentDate.setDate(currentDate.getDate()+o);
  if(currentDate<START)currentDate=new Date(START);
  if(currentDate>END)currentDate=new Date(END);
  render();
};

render();
