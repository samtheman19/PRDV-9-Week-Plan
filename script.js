/* ===============================
   GLOBAL STATE
================================ */

let runDistance = 0;
let watchId;
let startTime;
let splitTimer;

/* ===============================
   3-DAY MOCK PRDV MODE
================================ */

function startMockDay(day) {
  const display = document.getElementById("mockDisplay");

  if (day === 1)
    display.innerText = "Day 1: 2KM + Push/Pull Test";
  if (day === 2)
    display.innerText = "Day 2: 15KM Loaded Tab Simulation";
  if (day === 3)
    display.innerText = "Day 3: Hills + Circuit Under Fatigue";

  localStorage.setItem("mockDay", day);
}

/* ===============================
   SPLIT COACH (400m Beep)
================================ */

function startSplitCoach() {
  let splits = 5; // 2km = 5 x 400m
  let targetTime = 480; // 8 min
  let splitTime = targetTime / splits;

  let current = 1;

  splitTimer = setInterval(() => {
    if (current > splits) {
      clearInterval(splitTimer);
      document.getElementById("splitDisplay").innerText = "2KM COMPLETE";
      return;
    }

    document.getElementById("splitDisplay").innerText =
      "400m Split " + current;

    beep();
    current++;

  }, splitTime * 1000);
}

function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  audio.play();
}

/* ===============================
   FATIGUE + INJURY RISK MODEL
================================ */

function riskAnalysis() {
  let fatigue = parseInt(localStorage.getItem("fatigue")) || 5;
  let pushups = parseInt(localStorage.getItem("pushups")) || 0;

  let injuryRisk = fatigue > 7 ? "HIGH" : fatigue > 5 ? "MODERATE" : "LOW";
  let overtraining = (fatigue > 8 && pushups < 30) ? "YES" : "NO";

  document.getElementById("riskDisplay").innerHTML = `
    Injury Risk: ${injuryRisk}<br>
    Overtraining Risk: ${overtraining}
  `;
}

/* ===============================
   ADAPTIVE ENGINE
================================ */

function adaptiveEngine() {
  let fatigue = parseInt(localStorage.getItem("fatigue")) || 5;
  let pushups = parseInt(localStorage.getItem("pushups")) || 0;
  let pullups = parseInt(localStorage.getItem("pullups")) || 0;

  if (fatigue > 8)
    return "Reduce volume 20% this week.";
  if (pushups < 35)
    return "Add push-up density sessions.";
  if (pullups < 10)
    return "Add weighted pull-ups twice weekly.";
  return "Maintain intensity. Focus on tab speed.";
}

/* ===============================
   CLOUD READY STRUCTURE
================================ */

function exportData() {
  const data = {
    pushups: localStorage.getItem("pushups"),
    pullups: localStorage.getItem("pullups"),
    fatigue: localStorage.getItem("fatigue"),
    mockDay: localStorage.getItem("mockDay")
  };

  console.log("Export Ready:", JSON.stringify(data));
}

/* ===============================
   AUTO LOAD
================================ */

window.onload = function() {
  riskAnalysis();
  console.log("Adaptive Advice:", adaptiveEngine());
};
