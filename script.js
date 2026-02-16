/* ---------------- PLAN DATA ---------------- */

const plan = {
  1: { Mon:"Push ladder + Pull-ups", Tue:"6x400m", Wed:"8km 15kg" },
  2: { Tue:"3x800m", Wed:"10km 18kg" },
  3: { Tue:"2km TT", Wed:"12km 18kg" },
  4: { Wed:"12km 20kg" },
  5: { Wed:"14km 20kg" },
  6: { Wed:"15km 22kg" },
  7: { Fri:"2km", Sat:"16km 25kg" },
  8: { Wed:"12km 20kg" },
  9: { Wed:"6km 15kg (Taper)" }
};

/* ---------------- LOAD WEEK ---------------- */

function loadWeek() {
  const week = document.getElementById("weekSelect").value;
  const daysDiv = document.getElementById("days");
  daysDiv.innerHTML = "";

  for (const day in plan[week]) {
    const key = `week${week}-${day}`;
    const done = localStorage.getItem(key) === "true";

    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <strong>${day}</strong><br>
      ${plan[week][day]}<br>
      <input type="checkbox" ${done ? "checked":""}
      onchange="toggle('${key}', this.checked)">
    `;
    daysDiv.appendChild(card);
  }
}

function toggle(key, val) {
  localStorage.setItem(key, val);
}

/* ---------------- INTERVAL TIMER WITH BEEP ---------------- */

let interval;
let audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

function startIntervals() {
  let work = parseInt(document.getElementById("workTime").value);
  let rest = parseInt(document.getElementById("restTime").value);
  let rounds = parseInt(document.getElementById("rounds").value);

  let currentRound = 1;
  let isWork = true;

  function runPhase() {
    if (currentRound > rounds) {
      document.getElementById("intervalDisplay").innerText = "Done";
      return;
    }

    let time = isWork ? work : rest;
    document.getElementById("intervalDisplay").innerText =
      (isWork ? "WORK" : "REST") + " - Round " + currentRound;

    audio.play();

    setTimeout(() => {
      if (!isWork) currentRound++;
      isWork = !isWork;
      runPhase();
    }, time * 1000);
  }

  runPhase();
}

/* ---------------- PUSH-UP GRAPH ---------------- */

function saveStandards() {
  const pushups = document.getElementById("pushups").value;

  let history = JSON.parse(localStorage.getItem("pushupHistory")) || [];
  history.push({ date: new Date().toLocaleDateString(), value: pushups });
  localStorage.setItem("pushupHistory", JSON.stringify(history));

  updateGraph();
  calculateReadiness();
}

function updateGraph() {
  let history = JSON.parse(localStorage.getItem("pushupHistory")) || [];

  const ctx = document.getElementById("pushupChart").getContext("2d");
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.map(h => h.date),
      datasets: [{
        label: 'Push-ups',
        data: history.map(h => h.value),
        borderColor: '#d4ff00'
      }]
    }
  });
}

updateGraph();

/* ---------------- FATIGUE TRACKER ---------------- */

function saveFatigue() {
  let value = document.getElementById("fatigue").value;
  localStorage.setItem("fatigue", value);
  document.getElementById("fatigueDisplay").innerText =
    "Fatigue Level: " + value + "/10";
  calculateReadiness();
}

function calculateReadiness() {
  let pushups = document.getElementById("pushups").value || 0;
  let fatigue = localStorage.getItem("fatigue") || 5;

  let score = (pushups * 2) - (fatigue * 3);

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  document.getElementById("readinessScore").innerText =
    "Readiness Score: " + score + "%";
}

loadWeek();
