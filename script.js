const startDate = new Date("2026-02-17");
const endDate = new Date("2026-04-29");
let currentDate = new Date(startDate);

const BASE_2KM = 470;

function formatDate(d){
  return d.toDateString();
}

function daysBetween(a,b){
  return Math.floor((b-a)/(1000*60*60*24));
}

function getWeek(date){
  return Math.floor(daysBetween(startDate,date)/7)+1;
}

function getPhase(w){
  if(w<=3) return "Foundation";
  if(w<=7) return "Build";
  if(w<=9) return "Peak";
  return "Taper";
}

function getSplit(){
  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM;
  return Math.round(twoKm/5);
}

function renderWorkout(){

  const week = getWeek(currentDate);
  const phase = getPhase(week);
  const split = getSplit();
  const day = currentDate.getDay();

  document.getElementById("dateDisplay").innerText = formatDate(currentDate);
  document.getElementById("phaseInfo").innerHTML =
    `<strong>Week ${week}/10</strong><br>Phase: ${phase}`;

  let html = "";

  if(day===2){
    html += `
    <div class="card">
      <h3>VO2 Intervals</h3>
      6-8 x 400m @ ${split}s<br>
      Rest 90s
      ${exerciseLog("400m")}
    </div>`;
  }

  if(day===1){
    html += `
    <div class="card">
      <h3>Lower Strength</h3>
      Bulgarian Split Squat 4x8
      ${exerciseLog("Bulgarian")}
      Single Leg RDL 4x8
      ${exerciseLog("RDL")}
    </div>`;
  }

  if(day===4){
    html += `
    <div class="card">
      <h3>Threshold</h3>
      3 x 1km<br>
      Rest 2min
      ${exerciseLog("Threshold")}
    </div>`;
  }

  if(day===6){
    html += `
    <div class="card">
      <h3>Long Z2</h3>
      70-90min steady
      ${exerciseLog("Z2")}
    </div>`;
  }

  if(day===0){
    html += `
    <div class="card">
      <h3>Recovery</h3>
      Mobility 20-30min
    </div>`;
  }

  document.getElementById("workoutContainer").innerHTML = html;

  renderCalendar();
  renderSelection();
  renderChart();
}

function exerciseLog(name){
  return `
  <div class="exercise">
    <input placeholder="Sets">
    <input placeholder="Reps">
    <input placeholder="Weight">
    <input placeholder="RPE">
    <div class="timer" id="timer-${name}">00:00</div>
    <button onclick="startTimer('timer-${name}',60)">Start Timer</button>
  </div>`;
}

function startTimer(id,seconds){
  let time = seconds;
  const el = document.getElementById(id);
  const interval = setInterval(()=>{
    let mins=Math.floor(time/60);
    let secs=time%60;
    el.innerText =
      String(mins).padStart(2,"0")+":"+String(secs).padStart(2,"0");
    time--;
    if(time<0) clearInterval(interval);
  },1000);
}

function changeDay(dir){
  currentDate.setDate(currentDate.getDate()+dir);
  if(currentDate<startDate) currentDate=new Date(startDate);
  if(currentDate>endDate) currentDate=new Date(endDate);
  renderWorkout();
}

function update2km(){
  const val=document.getElementById("twoKmInput").value;
  localStorage.setItem("twoKm",val);
  renderWorkout();
}

function renderCalendar(){
  const grid=document.getElementById("calendarGrid");
  grid.innerHTML="";
  const week=getWeek(currentDate);
  for(let i=0;i<7;i++){
    let box=document.createElement("div");
    box.className="dayBox";
    if(i===currentDate.getDay()) box.classList.add("today");
    box.innerText=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i];
    grid.appendChild(box);
  }
}

function renderSelection(){
  const twoKm=parseInt(localStorage.getItem("twoKm"))||BASE_2KM;
  let score=50;
  if(twoKm<460) score+=10;
  if(twoKm<440) score+=10;
  if(twoKm<420) score+=15;
  document.getElementById("selectionScore").innerText=
    score+"% Selection Probability";
}

function renderChart(){
  const ctx=document.getElementById("progressChart");
  const twoKm=parseInt(localStorage.getItem("twoKm"))||BASE_2KM;
  new Chart(ctx,{
    type:"line",
    data:{
      labels:["Start","Current"],
      datasets:[{
        label:"2KM Time (sec)",
        data:[470,twoKm]
      }]
    }
  });
}

renderWorkout();
