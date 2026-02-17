const TARGET_DATE = new Date("2026-04-27");
let offsetDay = 0;

let loadHistory = JSON.parse(localStorage.getItem("loadHistory")) || [];
let streak = parseInt(localStorage.getItem("streak")) || 0;

const BASE_2KM = 470;

/* ===============================
   PROGRAM ENGINE
================================ */

function getProgramStart(){
  if(!localStorage.getItem("programStart")){
    localStorage.setItem("programStart", Date.now());
  }
  return new Date(parseInt(localStorage.getItem("programStart")));
}

function getCurrentWeek(){
  const start = getProgramStart();
  const diff = Math.floor((new Date()-start)/(1000*60*60*24));
  return Math.min(Math.floor(diff/7)+1,10);
}

function getPhase(week){
  if(week<=3) return "Base";
  if(week<=6) return "Build";
  if(week<=8) return "Peak";
  return "Taper";
}

function get400Split(twoKm){
  return (twoKm/5).toFixed(1);
}

/* ===============================
   WORKOUT GENERATOR
================================ */

function generateWorkout(date){

  const week = getCurrentWeek();
  const phase = getPhase(week);
  const day = date.getDay();
  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM;
  const split = get400Split(twoKm);

  if(day===0) return ["Rest + Mobility 20min"];

  if(day===1) return [
    "Bulgarian Split Squat 4x8",
    "Single Leg RDL 4x8",
    "Pull Ups 4x max"
  ];

  if(day===2){
    const reps = week<=3?6:week<=6?7:8;
    return [`${reps} x 400m @ ${split}s`, "90 sec rest"];
  }

  if(day===3) return [
    "DB Bench 4x8",
    "Barbell Row 4x6",
    "Core Circuit"
  ];

  if(day===4) return ["Tempo 3 x 1km"];

  if(day===5) return ["Conditioning Circuit"];

  if(day===6){
    const mins = week<=3?70:week<=6?80:90;
    return [`Long Zone 2 ${mins}min`];
  }
}

/* ===============================
   LOAD CALCULATION
================================ */

function calculateLoad(){
  const rows = document.querySelectorAll(".exercise-row");
  let total = 0;
  rows.forEach(r=>{
    const inputs = r.querySelectorAll("input");
    const load = parseFloat(inputs[0].value)||0;
    const reps = parseFloat(inputs[1].value)||0;
    total += load*reps;
  });
  return total;
}

/* ===============================
   ADVANCED METRICS
================================ */

function getAcuteLoad(){
  return loadHistory.slice(-7).reduce((a,b)=>a+b,0);
}

function getChronicLoad(){
  if(loadHistory.length===0) return 1;
  return loadHistory.reduce((a,b)=>a+b,0)/loadHistory.length;
}

function getLoadRatio(){
  return getAcuteLoad()/(getChronicLoad()||1);
}

function calculateSRI(){
  const ratio = getLoadRatio();
  return Math.round(100 - Math.abs(1-ratio)*40);
}

/* ===============================
   ADAPTIVE VOLUME ENGINE
================================ */

function volumeAdjustment(){
  const ratio = getLoadRatio();

  if(ratio > 1.6) return "⚠ DELoad Recommended (-20%)";
  if(ratio > 1.3) return "Reduce Volume (-10%)";
  if(ratio < 0.8) return "Increase Volume (+10%)";
  return "Maintain Volume";
}

/* ===============================
   2KM PROJECTION ENGINE
================================ */

function projected2KM(){

  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM;
  const sri = calculateSRI();
  const ratio = getLoadRatio();

  let improvement = 0;

  if(sri > 75) improvement += 5;
  if(ratio >= 0.9 && ratio <= 1.3) improvement += 5;
  if(streak >= 5) improvement += 5;

  return Math.max(twoKm - improvement, 410);
}

/* ===============================
   SELECTION PROBABILITY v2
================================ */

function calculateSelection(){

  const twoKm = projected2KM();
  const ratio = getLoadRatio();

  let prob = 40;

  if(twoKm < 450) prob += 20;
  if(twoKm < 430) prob += 10;
  if(ratio >= 0.9 && ratio <= 1.3) prob += 10;
  if(streak >= 7) prob += 10;

  return Math.min(prob, 98);
}

/* ===============================
   SESSION SAVE
================================ */

function saveSession(){

  const load = calculateLoad();
  loadHistory.push(load);
  if(loadHistory.length > 28) loadHistory.shift();
  localStorage.setItem("loadHistory", JSON.stringify(loadHistory));

  streak++;
  localStorage.setItem("streak", streak);

  updateMetrics();
}

/* ===============================
   UI RENDER
================================ */

function renderWorkout(){
  const today = new Date();
  today.setDate(today.getDate()+offsetDay);

  const week = getCurrentWeek();
  const phase = getPhase(week);
  const exercises = generateWorkout(today);

  dayLabel.innerText =
    today.toDateString() + ` (Week ${week} - ${phase})`;

  todayWorkout.innerHTML = `
    <div class="card">
      <div class="metric-title">Today's Mission</div>
      ${exercises.map(e=>`<div>${e}</div>`).join("")}
    </div>
  `;

  renderInputs(exercises);
}

function renderInputs(exercises){
  exerciseInputs.innerHTML="";
  exercises.forEach(e=>{
    exerciseInputs.innerHTML+=`
      <div class="exercise-row">
        <span>${e}</span>
        <input placeholder="Load">
        <input placeholder="Reps">
      </div>
    `;
  });
}

function updateMetrics(){

  const sri = calculateSRI();
  sriValue.innerText = sri;
  sriBar.style.width = sri+"%";
  sriStatus.innerText = sri>75?"GREEN":
                        sri>55?"AMBER":"RED";

  const selection = calculateSelection();
  selectionValue.innerText = selection+"%";
  selectionBar.style.width = selection+"%";

  const ratio = getLoadRatio();
  loadValue.innerText = ratio.toFixed(2);
  loadBar.style.width = Math.min(ratio*50,100)+"%";

  loadWarning.innerText = volumeAdjustment();

  renderIntelligencePanel();
}

function renderIntelligencePanel(){

  const projection = projected2KM();
  const adjustment = volumeAdjustment();

  todayWorkout.innerHTML += `
    <div class="card">
      <div class="metric-title">Warfighter Intelligence</div>
      <div>Projected 2KM: ${projection}s</div>
      <div>Streak: ${streak} days</div>
      <div>Volume Adjustment: ${adjustment}</div>
    </div>
  `;
}

/* ===============================
   NAVIGATION
================================ */

function changeDay(val){
  offsetDay += val;
  renderWorkout();
}

function toggleOperatorMode(){
  document.body.classList.toggle("operator");
}

function updateCountdown(){
  const diff = TARGET_DATE - new Date();
  const days = Math.ceil(diff/(1000*60*60*24));
  countdown.innerText = days + " days to Selection";
}

/* ===============================
   INIT
================================ */

updateCountdown();
renderWorkout();
updateMetrics();
