const TARGET_DATE = new Date("2026-04-27");
let offsetDay = 0;
let loadHistory = JSON.parse(localStorage.getItem("loadHistory")) || [];

const BASE_2KM = 470;

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

function generateWorkout(date){

  const week = getCurrentWeek();
  const phase = getPhase(week);
  const day = date.getDay();
  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM;
  const split = get400Split(twoKm);

  if(day===0) return ["Rest + Mobility"];

  if(day===1) return [
    "Bulgarian Split Squat 4x8",
    "Single Leg RDL 4x8",
    "Pull Ups 4x max"
  ];

  if(day===2){
    const reps = week<=3?6:week<=6?7:8;
    return [`${reps} x 400m @ ${split}s`, "90s rest"];
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

function renderWorkout(){
  const today = new Date();
  today.setDate(today.getDate()+offsetDay);

  const week = getCurrentWeek();
  const phase = getPhase(week);
  const exercises = generateWorkout(today);

  document.getElementById("dayLabel").innerText =
    today.toDateString() + ` (Week ${week} - ${phase})`;

  const container = document.getElementById("todayWorkout");

  container.innerHTML = `
    <div class="card">
      <div class="metric-title">Today's Mission</div>
      ${exercises.map(e=>`<div>${e}</div>`).join("")}
    </div>
  `;

  renderInputs(exercises);
}

function renderInputs(exercises){
  const container = document.getElementById("exerciseInputs");
  container.innerHTML = "";

  exercises.forEach(e=>{
    container.innerHTML += `
      <div class="exercise-row">
        <span>${e}</span>
        <input placeholder="Load">
        <input placeholder="Reps">
      </div>
    `;
  });
}

function changeDay(val){
  offsetDay += val;
  renderWorkout();
}

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

function saveSession(){
  const load = calculateLoad();
  loadHistory.push(load);
  if(loadHistory.length>28) loadHistory.shift();
  localStorage.setItem("loadHistory",JSON.stringify(loadHistory));
  updateMetrics();
}

function calculateSRI(){
  if(loadHistory.length<7) return 70;
  const acute = loadHistory.slice(-7).reduce((a,b)=>a+b,0);
  const chronic = loadHistory.reduce((a,b)=>a+b,0)/loadHistory.length;
  const ratio = acute/(chronic||1);
  return Math.round(100 - Math.abs(1-ratio)*40);
}

function calculateSelection(){
  const twoKm = parseInt(localStorage.getItem("twoKm"))||BASE_2KM;
  let prob = 40;
  if(twoKm<450) prob+=20;
  if(twoKm<430) prob+=10;
  return Math.min(prob,95);
}

function updateMetrics(){

  const sri = calculateSRI();
  sriValue.innerText = sri;
  sriBar.style.width = sri+"%";
  sriStatus.innerText =
    sri>75?"GREEN":
    sri>55?"AMBER":"RED";

  const selection = calculateSelection();
  selectionValue.innerText = selection+"%";
  selectionBar.style.width = selection+"%";

  const acute = loadHistory.slice(-7).reduce((a,b)=>a+b,0);
  const chronic = loadHistory.reduce((a,b)=>a+b,0)/loadHistory.length||1;
  const ratio = acute/chronic;

  loadValue.innerText = ratio.toFixed(2);
  loadBar.style.width = Math.min(ratio*50,100)+"%";
  loadWarning.innerText =
    ratio>1.5?"Overload":
    ratio<0.8?"Underload":"Balanced";

  renderChart();
}

let chart;

function renderChart(){
  const ctx = document.getElementById("loadChart");
  if(chart) chart.destroy();
  chart = new Chart(ctx,{
    type:'line',
    data:{
      labels:loadHistory.map((_,i)=>i+1),
      datasets:[{
        data:loadHistory,
        borderColor:'#1fd38a',
        tension:0.3
      }]
    }
  });
}

function toggleOperatorMode(){
  document.body.classList.toggle("operator");
}

function updateCountdown(){
  const diff = TARGET_DATE - new Date();
  const days = Math.ceil(diff/(1000*60*60*24));
  countdown.innerText = days + " days to Selection";
}

updateCountdown();
renderWorkout();
updateMetrics();
