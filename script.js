const TARGET = new Date("2026-04-27");
let loadHistory = JSON.parse(localStorage.getItem("loadHistory")) || [];

const program = {
  monday: ["Bulgarian Split Squat","Single Leg RDL","Pull Ups"],
  tuesday: ["6 x 400m"],
  wednesday: ["DB Bench","Barbell Row","Core Circuit"],
  thursday: ["Tempo 3 x 1km"],
  friday: ["Conditioning Circuit"],
  saturday: ["Long Zone 2"],
  sunday: ["Rest + Mobility"]
};

function getTodayKey(){
  const d = new Date().getDay();
  return ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][d];
}

function renderWorkout(){
  const dayKey = getTodayKey();
  const exercises = program[dayKey];
  const container = document.getElementById("todayWorkout");

  container.innerHTML = `
    <div class="card">
      <div class="metric-title">Today – ${dayKey.toUpperCase()}</div>
      ${exercises.map(e=>`<div>${e}</div>`).join("")}
    </div>
  `;

  renderExerciseInputs(exercises);
}

function renderExerciseInputs(exercises){
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

function saveSession(){
  const rows = document.querySelectorAll(".exercise-row");
  let totalLoad = 0;

  rows.forEach(r=>{
    const inputs = r.querySelectorAll("input");
    const load = parseFloat(inputs[0].value)||0;
    const reps = parseFloat(inputs[1].value)||0;
    totalLoad += load * reps;
  });

  loadHistory.push(totalLoad);
  if(loadHistory.length>28) loadHistory.shift();

  localStorage.setItem("loadHistory",JSON.stringify(loadHistory));

  updateMetrics();
}

function calculateSRI(){
  if(loadHistory.length<7) return 50;
  const acute = loadHistory.slice(-7).reduce((a,b)=>a+b,0);
  const chronic = loadHistory.reduce((a,b)=>a+b,0)/loadHistory.length;
  const ratio = acute/(chronic||1);
  return Math.round(100 - Math.abs(1-ratio)*50);
}

function updateMetrics(){
  const sri = calculateSRI();
  sriValue.innerText = sri;
  sriBar.style.width = sri+"%";

  sriStatus.innerText =
    sri>75?"GREEN":
    sri>55?"AMBER":
    "RED";

  const acute = loadHistory.slice(-7).reduce((a,b)=>a+b,0);
  const chronic = loadHistory.reduce((a,b)=>a+b,0)/loadHistory.length||1;
  const ratio = acute/chronic;

  loadValue.innerText = ratio.toFixed(2);
  loadBar.style.width = Math.min(ratio*50,100)+"%";

  loadWarning.innerText =
    ratio>1.5?"Overload":
    ratio<0.8?"Undertraining":
    "Balanced";

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

function updateCountdown(){
  const diff = TARGET - new Date();
  const days = Math.ceil(diff/(1000*60*60*24));
  countdown.innerText = days+" days to PRDV";
}

updateCountdown();
renderWorkout();
updateMetrics();
