const START_DATE = new Date();
const PEAK_DATE = new Date("2026-04-27");

let selectedDate = new Date();

/* =============================
   DATE ENGINE
============================= */

function formatDate(date){
  return date.toDateString();
}

function getDaysBetween(a,b){
  return Math.floor((b-a)/(1000*60*60*24));
}

function getWeekNumber(date){
  const days = getDaysBetween(START_DATE,date);
  return Math.max(1,Math.floor(days/7)+1);
}

function changeDay(offset){
  selectedDate.setDate(selectedDate.getDate()+offset);
  render();
}

function goToToday(){
  selectedDate = new Date();
  render();
}

/* =============================
   PHASE ENGINE
============================= */

function getPhase(week){
  if(week<=4) return "Foundation Phase";
  if(week<=8) return "Build Phase";
  return "Peak Phase";
}

/* =============================
   2KM TARGET ENGINE
============================= */

function getTargetPace(){
  const weeksLeft = 16 - getWeekNumber(selectedDate);
  const base = 470; // 7:50
  return base - (weeksLeft*3);
}

/* =============================
   WORKOUT GENERATOR
============================= */

function getWorkoutForDate(date){

  const week = getWeekNumber(date);
  const day = date.getDay();

  const split = (getTargetPace()/5).toFixed(1);

  if(day===0){
    return {
      type:"Recovery",
      exercises:[
        {name:"Mobility Flow",sets:"20min"},
        {name:"Zone 2 Run",sets:"40min"}
      ]
    };
  }

  if(day===1){
    return {
      type:"Lower Strength",
      exercises:[
        {name:"Bulgarian Split Squat",sets:"4x8"},
        {name:"Single Leg RDL",sets:"4x8"},
        {name:"Skater Squat",sets:"3x8"},
        {name:"Soleus Raise",sets:"3x15"}
      ]
    };
  }

  if(day===2){
    return {
      type:"VO2 Max",
      exercises:[
        {name:`400m Intervals`,sets:`6-8 reps @ ${split}s`}
      ]
    };
  }

  if(day===3){
    return {
      type:"Upper Strength",
      exercises:[
        {name:"Pull Ups",sets:"4xMax"},
        {name:"Barbell Row",sets:"4x6"},
        {name:"DB Bench",sets:"4x8"}
      ]
    };
  }

  if(day===4){
    return {
      type:"Tempo",
      exercises:[
        {name:"3x1km Tempo",sets:"2min float recovery"}
      ]
    };
  }

  if(day===5){
    return {
      type:"Conditioning",
      exercises:[
        {name:"400m Ski",sets:"3 rounds"},
        {name:"20 Wall Balls",sets:"3 rounds"},
        {name:"400m Row",sets:"3 rounds"}
      ]
    };
  }

  if(day===6){
    return {
      type:"Long Run",
      exercises:[
        {name:"Zone 2 Run",sets:"70–90min"}
      ]
    };
  }
}

/* =============================
   RENDER ENGINE
============================= */

function render(){

  document.getElementById("dateDisplay").innerText =
    formatDate(selectedDate);

  const week = getWeekNumber(selectedDate);
  const phase = getPhase(week);

  document.getElementById("phaseBanner").innerHTML =
    `<div class="phase">${phase} • Week ${week}</div>`;

  const workout = getWorkoutForDate(selectedDate);

  const container = document.getElementById("workoutContainer");
  container.innerHTML = "";

  workout.exercises.forEach(ex=>{
    container.innerHTML += `
      <div class="exercise-block">
        <div class="exercise-title">${ex.name}</div>
        <div>${ex.sets}</div>
      </div>
    `;
  });

  buildTrackingInputs(workout);
}

/* =============================
   TRACKING
============================= */

function buildTrackingInputs(workout){

  const box = document.getElementById("exerciseInputs");
  box.innerHTML = "";

  workout.exercises.forEach(ex=>{
    box.innerHTML += `
      <div class="exercise-block">
        <div class="exercise-title">${ex.name}</div>
        <input placeholder="Weight Used">
        <input placeholder="Reps Completed">
        <input placeholder="RPE">
      </div>
    `;
  });
}

function saveSession(){
  alert("Session Saved ✔");
}

/* =============================
   RECOVERY + SELECTION
============================= */

function updateRecovery(){

  const sleep = parseFloat(document.getElementById("sleepInput").value)||7;
  const fatigue = parseInt(document.getElementById("fatigueInput").value)||5;

  const score = (sleep*10)-(fatigue*5);

  document.getElementById("recoveryOutput").innerText =
    "Recovery Score: "+score;

  document.getElementById("selectionScore").innerText =
    "Selection Probability: "+Math.min(95,50+score)+"%";
}

/* =============================
   INIT
============================= */

render();
