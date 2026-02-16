const plan = {
  1: {
    Mon: "Push-up ladder 1-12 + Pull-ups 5x max",
    Tue: "6x400m @ 1:28",
    Wed: "8km Tab @ 15kg",
    Thu: "Squats + RDL + Lunges",
    Fri: "4 Round Circuit",
    Sat: "10km steady run",
    Sun: "Recovery walk"
  },
  2: {
    Mon: "Upper volume",
    Tue: "3x800m",
    Wed: "10km @ 18kg",
    Thu: "Lower strength",
    Fri: "5 Round Circuit",
    Sat: "8km endurance",
    Sun: "Recovery"
  },
  3: {
    Tue: "2km Time Trial",
    Wed: "12km @ 18kg",
    Fri: "5 Round Circuit"
  },
  4: {
    Wed: "12km @ 20kg",
    Tue: "4x800m",
    Fri: "Circuit"
  },
  5: {
    Wed: "14km @ 20kg",
    Tue: "Hill sprints",
    Fri: "Brutal circuit"
  },
  6: {
    Wed: "15km @ 22kg",
    Tue: "2km Test"
  },
  7: {
    Fri: "2km effort",
    Sat: "16km @ 22-25kg",
    Sun: "Hills + Circuit"
  },
  8: {
    Wed: "12km @ 20kg",
    Tue: "6x400m fast"
  },
  9: {
    Tue: "4x400m",
    Wed: "6km @ 15kg",
    Fri: "Light circuit"
  }
};

function loadWeek() {
  const week = document.getElementById("weekSelect").value;
  const daysDiv = document.getElementById("days");
  daysDiv.innerHTML = "";

  for (const day in plan[week]) {
    const key = `week${week}-${day}`;
    const completed = localStorage.getItem(key) === "true";

    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <h3>${day}</h3>
      <p>${plan[week][day]}</p>
      <label>
        <input type="checkbox" ${completed ? "checked" : ""}
          onchange="toggleComplete('${key}', this.checked)">
        Completed
      </label>
    `;
    daysDiv.appendChild(card);
  }
}

function toggleComplete(key, value) {
  localStorage.setItem(key, value);
}

/* TIMER */

let timer;
let seconds = 0;

function startTimer() {
  if (!timer) {
    timer = setInterval(() => {
      seconds++;
      document.getElementById("time").innerText = formatTime(seconds);
    }, 1000);
  }
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function resetTimer() {
  stopTimer();
  seconds = 0;
  document.getElementById("time").innerText = "00:00";
}

function formatTime(sec) {
  let mins = Math.floor(sec / 60);
  let secs = sec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

loadWeek();
