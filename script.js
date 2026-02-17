const START_DATE = new Date();
const END_DATE = new Date("2026-04-27");

let currentDate = new Date();
let eliteMode = false;

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
  const diff = Math.floor((currentDate - START_DATE) / (1000 * 60 * 60 * 24));
  return Math.floor(diff / 7) + 1;
}

function getPhase(week) {
  if (week <= 3) return "Base";
  if (week <= 6) return "Build";
  if (week <= 9) return "Peak";
  return "Elite Taper";
}

function formatDate(date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function getWorkout() {
  const day = currentDate.getDay();
  const week = getWeek();
  const phase = getPhase(week);

  if (day === 0)
    return { title: "Recovery / Mobility", exercises: [] };

  if (day === 1)
    return {
      title: "Lower Body – Unilateral Strength",
      exercises: [
        "Bulgarian Split Squat",
        "Single Leg RDL",
        "Lateral Lunge",
        "Soleus Raise"
      ]
    };

  if (day === 2)
    return {
      title: "VO2 Intervals",
      exercises: ["400m Repeats"]
    };

  if (day === 3)
    return {
      title: "Upper Strength",
      exercises: ["Pull Ups", "Barbell Row", "DB Bench"]
    };

  if (day === 4)
    return {
      title: "Tempo Run",
      exercises: ["3 x 1km Tempo"]
    };

  if (day === 5)
    return {
      title: "Conditioning",
      exercises: ["Ski 400m", "Wall Balls", "Row 400m"]
    };

  if (day === 6)
    return {
      title: "Long Zone 2",
      exercises: ["70–90 min steady"]
    };
}

function saveSession() {
  const key = currentDate.toDateString();
  localStorage.setItem(key, "completed");
  alert("Session saved");
}

function render() {
  document.getElementById("currentDate").innerText =
    formatDate(currentDate);

  const workout = getWorkout();
  const week = getWeek();
  const phase = getPhase(week);

  const card = document.getElementById("workoutCard");

  let html = `
    <div class="phase">
      Week ${week}/10 • ${phase}
    </div>

    <h2>${workout.title}</h2>
  `;

  workout.exercises.forEach(ex => {
    html += `
      <div class="exercise">
        <h4>${ex}</h4>
        <input placeholder="Set 1 – reps / load / time">
        <input placeholder="Set 2 – reps / load / time">
        <input placeholder="Set 3 – reps / load / time">
      </div>
    `;
  });

  html += `
    <button class="save-btn" onclick="saveSession()">Save Session</button>
  `;

  if (eliteMode) {
    html += `
      <button class="save-btn complete">
        Elite Mode Active
      </button>
    `;
  }

  card.innerHTML = html;
}

render();
