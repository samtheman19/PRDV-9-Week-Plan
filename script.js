const START_DATE = new Date();
const END_DATE = new Date("2026-04-27");

let currentDate = new Date();
let eliteMode = false;

/* TIMER */
let seconds = 0;
let timerInterval = null;

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    seconds++;
    updateTimer();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function endSession() {
  pauseTimer();
  saveSession();
  seconds = 0;
  updateTimer();
}

function updateTimer() {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2,'0');
  const mins = String(Math.floor((seconds % 3600)/60)).padStart(2,'0');
  const secs = String(seconds % 60).padStart(2,'0');
  document.getElementById("timer").innerText = `${hrs}:${mins}:${secs}`;
}

/* NAVIGATION */

function toggleElite() {
  eliteMode = !eliteMode;
  render();
}

function changeDay(offset) {
  currentDate.setDate(currentDate.getDate() + offset);
  if (currentDate < START_DATE) currentDate = new Date(START_DATE);
  if (currentDate > END_DATE) currentDate = new Date(END_DATE);
  render();
}

function getWeek() {
  const diff = Math.floor((currentDate - START_DATE)/(1000*60*60*24));
  return Math.floor(diff/7)+1;
}

function getPhase(week) {
  if (week <= 3) return "Base";
  if (week <= 6) return "Build";
  if (week <= 9) return "Peak";
  return "Elite";
}

function formatDate(date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/* WORKOUT ENGINE */

function getWorkout() {
  const day = currentDate.getDay();
  if (day === 0) return {title:"Recovery", exercises:[]};

  if (day === 1)
    return {title:"Lower – Unilateral", exercises:[
      {name:"Bulgarian Split Squat", sets:4},
      {name:"Single Leg RDL", sets:3},
      {name:"Lateral Lunge", sets:3},
      {name:"Soleus Raise", sets:3}
    ]};

  if (day === 2)
    return {title:"VO2 Intervals", exercises:[
      {name:"400m Repeats", sets:6}
    ]};

  if (day === 3)
    return {title:"Upper Strength", exercises:[
      {name:"Pull Ups", sets:4},
      {name:"Barbell Row", sets:4},
      {name:"DB Bench", sets:3}
    ]};

  if (day === 4)
    return {title:"Tempo Run", exercises:[
      {name:"1km Tempo", sets:3}
    ]};

  if (day === 5)
    return {title:"Conditioning", exercises:[
      {name:"Ski 400m", sets:3},
      {name:"Wall Balls", sets:3},
      {name:"Row 400m", sets:3}
    ]};

  if (day === 6)
    return {title:"Long Zone 2", exercises:[
      {name:"Zone 2 Run", sets:1}
    ]};
}

/* SAVE SESSION */

function saveSession() {
  const key = currentDate.toDateString();
  localStorage.setItem(key, JSON.stringify({completed:true,time:seconds}));
}

/* RENDER */

function render() {

  document.getElementById("currentDate").innerText =
    formatDate(currentDate);

  const week = getWeek();
  const phase = getPhase(week);
  const workout = getWorkout();
  const card = document.getElementById("workoutCard");

  let html = `
    <div style="opacity:.6;margin-bottom:10px;">
      Week ${week}/10 • ${phase}
    </div>
    <h2>${workout.title}</h2>
  `;

  workout.exercises.forEach(ex => {
    html += `<div class="exercise"><h4>${ex.name}</h4>`;

    for (let i=1;i<=ex.sets;i++) {
      html += `
        <div class="set-row">
          <input placeholder="Set ${i} – reps / load / time">
          <button onclick="startRest(90)">⏱</button>
          <button onclick="this.classList.toggle('complete')">✓</button>
        </div>
      `;
    }

    html += `</div>`;
  });

  card.innerHTML = html;
}

/* REST TIMER */

function startRest(sec) {
  let remaining = sec;
  const interval = setInterval(()=>{
    remaining--;
    if(remaining<=0){
      clearInterval(interval);
      alert("Rest complete");
    }
  },1000);
}

render();
