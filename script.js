/* PLAN DATA */

const plan = {
  1: { Mon:"Push ladder + Pull-ups", Tue:"6x400m", Wed:"8km 15kg", Fri:"Circuit" },
  2: { Tue:"3x800m", Wed:"10km 18kg", Fri:"5 Rounds Circuit" },
  3: { Tue:"2km TT", Wed:"12km 18kg" },
  4: { Wed:"12km 20kg" },
  5: { Wed:"14km 20kg" },
  6: { Wed:"15km 22kg" },
  7: { Fri:"2km", Sat:"16km 25kg" },
  8: { Wed:"12km 20kg" },
  9: { Wed:"6km 15kg (Taper)" }
};

/* LOAD WEEK */

function loadWeek() {
  const week = document.getElementById("weekSelect").value;
  const daysDiv = document.getElementById("days");
  daysDiv.innerHTML = "";
  let completed = 0;
  let total = Object.keys(plan[week]).length;

  for (const day in plan[week]) {
    const key = `week${week}-${day}`;
    const done = localStorage.getItem(key) === "true";
    if(done) completed++;

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

  document.getElementById("progress").innerText =
    `Completion: ${Math.round((completed/total)*100)}%`;
}

function toggle(key, val) {
  localStorage.setItem(key, val);
  loadWeek();
}

/* INTERVAL TIMER */

let interval;
let currentRound = 0;
let isWork = true;

function startIntervals() {
  let work = parseInt(document.getElementById("workTime").value);
  let rest = parseInt(document.getElementById("restTime").value);
  let rounds = parseInt(document.getElementById("rounds").value);
  currentRound = 0;
  isWork = true;

  interval = setInterval(() => {
    if (currentRound >= rounds*2) {
      clearInterval(interval);
      document.getElementById("intervalDisplay").innerText = "Done";
      return;
    }

    let phaseTime = isWork ? work : rest;
    document.getElementById("intervalDisplay").innerText =
      (isWork ? "WORK" : "REST") + " - Round " + (Math.floor(currentRound/2)+1);

    setTimeout(() => {
      isWork = !isWork;
      currentRound++;
    }, phaseTime * 1000);

  }, (work + rest) * 1000);
}

function stopIntervals() {
  clearInterval(interval);
  document.getElementById("intervalDisplay").innerText = "Stopped";
}

/* STANDARDS */

function saveStandards() {
  const data = {
    pushups: document.getElementById("pushups").value,
    pullups: document.getElementById("pullups").value,
    run2k: document.getElementById("run2k").value,
    tab15k: document.getElementById("tab15k").value
  };
  localStorage.setItem("standards", JSON.stringify(data));
  displayStandards();
}

function displayStandards() {
  const data = JSON.parse(localStorage.getItem("standards"));
  if(!data) return;
  document.getElementById("standardsDisplay").innerText =
    `Push-ups: ${data.pushups} | Pull-ups: ${data.pullups} | 2km: ${data.run2k} | 15km Tab: ${data.tab15k}`;
}

displayStandards();
loadWeek();

/* PWA */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}
