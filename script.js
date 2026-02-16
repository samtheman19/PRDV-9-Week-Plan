/* ---------- READINESS & RANK SYSTEM ---------- */

function calculateReadiness() {
  let pushups = parseInt(document.getElementById("pushups").value) || 0;
  let pullups = parseInt(document.getElementById("pullups").value) || 0;
  let fatigue = parseInt(localStorage.getItem("fatigue")) || 5;

  let score = (pushups * 2) + (pullups * 3) - (fatigue * 3);
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  document.getElementById("readinessScore").innerText =
    "Readiness Score: " + score + "%";

  updateRank(score);
  updateSelectionStatus(score);
}

function updateRank(score) {
  let rank = "Recruit";

  if (score > 80) rank = "🪖 Operator";
  else if (score > 65) rank = "🔥 Advanced";
  else if (score > 50) rank = "⚔ Soldier";
  else if (score > 35) rank = "🟢 Trained";
  else rank = "🔰 Recruit";

  document.getElementById("rankDisplay").innerText = rank;
}

function updateSelectionStatus(score) {
  const status = document.getElementById("selectionStatus");

  if (score > 75) {
    status.innerText = "SELECTION READY";
    status.className = "ready";
  } else if (score > 50) {
    status.innerText = "BUILDING CAPACITY";
    status.className = "warning";
  } else {
    status.innerText = "NOT READY";
    status.className = "fail";
  }
}

/* ---------- FATIGUE SYSTEM ---------- */

function saveFatigue() {
  let value = document.getElementById("fatigue").value;
  localStorage.setItem("fatigue", value);

  const display = document.getElementById("fatigueDisplay");
  display.innerText = "Fatigue: " + value + "/10";

  if (value >= 8) display.className = "fail";
  else if (value >= 5) display.className = "warning";
  else display.className = "ready";

  calculateReadiness();
}

/* ---------- SAVE STANDARDS ---------- */

function saveStandards() {
  localStorage.setItem("pushups", document.getElementById("pushups").value);
  localStorage.setItem("pullups", document.getElementById("pullups").value);

  calculateReadiness();
}

/* ---------- 2KM RACE MODE ---------- */

let raceTimer;

function start2kMode() {
  let timeLeft = 480; // 8 minutes baseline

  document.getElementById("raceModeDisplay").innerText = "GO!";

  raceTimer = setInterval(() => {
    timeLeft--;

    let mins = Math.floor(timeLeft / 60);
    let secs = timeLeft % 60;

    document.getElementById("raceModeDisplay").innerText =
      mins + ":" + (secs < 10 ? "0" + secs : secs);

    if (timeLeft === 0) {
      clearInterval(raceTimer);
      document.getElementById("raceModeDisplay").innerText = "FINISH";
    }

  }, 1000);
}

/* ---------- LOAD SAVED DATA ---------- */

window.onload = function() {
  document.getElementById("pushups").value =
    localStorage.getItem("pushups") || "";
  document.getElementById("pullups").value =
    localStorage.getItem("pullups") || "";
  document.getElementById("fatigue").value =
    localStorage.getItem("fatigue") || 5;

  saveFatigue();
};
