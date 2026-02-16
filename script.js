/* ---------------- GLOBAL DATA ---------------- */

let runDistance = 0;
let watchId;
let startTime;

/* ---------------- GPS TRACKING ---------------- */

function startGPS() {
  runDistance = 0;
  startTime = Date.now();

  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(updatePosition);
  }
}

function stopGPS() {
  navigator.geolocation.clearWatch(watchId);
}

function updatePosition(position) {
  if (!window.lastPosition) {
    window.lastPosition = position;
    return;
  }

  const R = 6371;
  let dLat = (position.coords.latitude - window.lastPosition.coords.latitude) * Math.PI/180;
  let dLon = (position.coords.longitude - window.lastPosition.coords.longitude) * Math.PI/180;

  let a = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(window.lastPosition.coords.latitude*Math.PI/180) *
    Math.cos(position.coords.latitude*Math.PI/180) *
    Math.sin(dLon/2)*Math.sin(dLon/2);

  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  let distance = R * c;

  runDistance += distance;
  window.lastPosition = position;

  let elapsed = (Date.now() - startTime)/1000/60;
  let pace = elapsed > 0 ? (elapsed/runDistance).toFixed(2) : 0;

  document.getElementById("gpsDisplay").innerText =
    "Distance: " + runDistance.toFixed(2) + " km | Pace: " + pace + " min/km";
}

/* ---------------- PRDV SIMULATION ---------------- */

function simulatePRDV() {
  let pushups = parseInt(localStorage.getItem("pushups")) || 0;
  let pullups = parseInt(localStorage.getItem("pullups")) || 0;
  let fatigue = parseInt(localStorage.getItem("fatigue")) || 5;

  let score = pushups + (pullups * 2) - fatigue;

  let result;

  if (score > 70) result = "🟢 PASS – Strong Candidate";
  else if (score > 50) result = "🟡 BORDERLINE – Improve";
  else result = "🔴 FAIL – Below Standard";

  document.getElementById("simulationResult").innerText = result;

  updateDashboard(score);
}

/* ---------------- DASHBOARD ---------------- */

function updateDashboard(score) {
  const dash = document.getElementById("dashboard");

  dash.innerHTML = `
    Push-ups: ${localStorage.getItem("pushups") || 0}<br>
    Pull-ups: ${localStorage.getItem("pullups") || 0}<br>
    Fatigue: ${localStorage.getItem("fatigue") || 5}<br>
    Simulation Score: ${score}
  `;
}

/* ---------------- ADAPTIVE TRAINING ---------------- */

function adaptiveAdvice() {
  let pushups = parseInt(localStorage.getItem("pushups")) || 0;
  let pullups = parseInt(localStorage.getItem("pullups")) || 0;

  if (pushups < 35)
    return "Increase push-up volume 3x per week.";
  if (pullups < 10)
    return "Add weighted pull-ups twice weekly.";
  return "Maintain intensity. Focus on tab endurance.";
}

/* ---------------- AUTO LOAD ---------------- */

window.onload = function() {
  updateDashboard(0);
};
