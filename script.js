import { initializeApp } from 
"https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

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

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "prdv-platform.firebaseapp.com",
  projectId: "prdv-platform"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const BASE_2KM = 470;

/* AUTH */

window.register = async () => {
  await createUserWithEmailAndPassword(auth, email.value, password.value);
};

window.login = async () => {
  await signInWithEmailAndPassword(auth, email.value, password.value);
};

window.logout = () => signOut(auth);

/* RECOVERY */

function calculateRecovery(pushups, pullups, fatigue, sleep) {
  const sleepScore = sleep >= 8 ? 15 :
                     sleep >= 7 ? 10 :
                     sleep >= 6 ? 5 : -15;

  return (pushups*2)+(pullups*3)-(fatigue*3)+sleepScore;
}

function getRecoveryState(score) {
  if (score >= 100) return "GREEN";
  if (score >= 60) return "AMBER";
  return "RED";
}

function estimateVO2max(twoKm) {
  const velocity = 2000 / twoKm;
  return ((velocity * 3.5 * 60) / 1000 * 100).toFixed(1);
}

function calculatePRDVScore(pushups, pullups, twoKm) {
  let score = pushups*1.5 + pullups*3;
  if (twoKm <= 440) score += 30;
  else if (twoKm <= 460) score += 20;
  else if (twoKm <= 480) score += 10;
  return Math.floor(score);
}

/* SAVE */

window.savePerformance = async function() {

  const pushups = parseInt(manualPushups.value) || 0;
  const pullups = parseInt(manualPullups.value) || 0;
  const fatigue = parseInt(manualFatigue.value) || 5;
  const sleep = parseFloat(sleepHours.value) || 7;
  const twoKm = parseInt(twoKmTime.value) || BASE_2KM;

  localStorage.setItem("twoKm", twoKm);

  const readiness = calculateRecovery(pushups,pullups,fatigue,sleep);
  const vo2 = estimateVO2max(twoKm);
  const prdv = calculatePRDVScore(pushups,pullups,twoKm);

  const user = auth.currentUser;
  if (user) {
    await addDoc(collection(db,"users",user.uid,"sessions"),{
      pushups,pullups,fatigue,sleep,twoKm,readinessScore:readiness,
      timestamp:Date.now()
    });
  }

  document.getElementById("recoveryInsight").innerText =
    "Recovery: "+getRecoveryState(readiness);

  alert("Saved\nVO2: "+vo2+"\nPRDV Score: "+prdv);
};

/* ANALYTICS */

window.loadAnalytics = async function() {

  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db,"users",user.uid,"sessions"),
    orderBy("timestamp","asc")
  );

  const snap = await getDocs(q);

  let labels=[],vo2=[]; let count=1;

  snap.forEach(doc=>{
    const d=doc.data();
    labels.push("S"+count++);
    vo2.push(estimateVO2max(d.twoKm));
  });

  new Chart(vo2Trend,{
    type:"line",
    data:{labels,datasets:[{label:"VO2",data:vo2}]}
  });
};

/* SELECTION */

window.showSelectionDashboard=function(){
  const pushups=parseInt(localStorage.getItem("pushups"))||0;
  const pullups=parseInt(localStorage.getItem("pullups"))||0;
  const twoKm=parseInt(localStorage.getItem("twoKm"))||BASE_2KM;
  const score=calculatePRDVScore(pushups,pullups,twoKm);
  alert("PRDV Score: "+score);
};

window.runSelectionSimulation=function(){
  alert("Simulation complete.");
};

/* CALENDAR */

window.showCalendar=function(){
  alert("10 Week Tactical Program Active");
};

/* PWA */

if('serviceWorker'in navigator){
  navigator.serviceWorker.register('service-worker.js');
}
