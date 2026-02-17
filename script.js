/* =========================================================
   PARATROOPER ENGINE – FINAL BUILD
   10 Week Progressive Program
   Tracks from first load → April 27 2026
========================================================= */

const PROGRAM_END = new Date("2026-04-27")
const BASE_2KM = 470

let selectedDate = new Date()

/* =========================================================
   INITIALISE PROGRAM
========================================================= */

function initProgram() {
  if (!localStorage.getItem("programStart")) {
    localStorage.setItem("programStart", new Date().toISOString())
  }
}

function getStartDate() {
  return new Date(localStorage.getItem("programStart"))
}

function getDayIndex(date) {
  const diff = date - getStartDate()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getWeek(date) {
  return Math.floor(getDayIndex(date) / 7) + 1
}

function formatFullDate(d) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}

/* =========================================================
   READINESS ENGINE
========================================================= */

function getReadiness() {
  const sleep = parseInt(localStorage.getItem("sleep")) || 7
  const fatigue = parseInt(localStorage.getItem("fatigue")) || 3
  const stress = parseInt(localStorage.getItem("stress")) || 3

  const score = sleep * 2 - fatigue * 1.5 - stress
  if (score >= 10) return "GREEN"
  if (score >= 5) return "AMBER"
  return "RED"
}

function volumeModifier(state) {
  if (state === "GREEN") return 1
  if (state === "AMBER") return 0.8
  return 0.6
}

/* =========================================================
   PERFORMANCE PROJECTION
========================================================= */

function projected2km(date) {
  const base = parseInt(localStorage.getItem("twoKm")) || BASE_2KM
  const week = getWeek(date)
  const gain = week * 2
  return Math.max(base - gain, 390)
}

/* =========================================================
   WORKOUT STRUCTURE
========================================================= */

function buildWorkout(date) {

  const week = getWeek(date)
  const day = ((getDayIndex(date) % 7) + 7) % 7
  const readiness = getReadiness()
  const volume = volumeModifier(readiness)

  const twoKm = parseInt(localStorage.getItem("twoKm")) || BASE_2KM
  const split = (twoKm / 5).toFixed(1)

  const vo2Reps = week <= 3 ? 6 : week <= 6 ? 7 : 8
  const longMinutes = week <= 3 ? 70 : week <= 6 ? 80 : 90

  const program = [

    {
      title: "Lower Body – Unilateral Strength",
      exercises: [
        { name: "Bulgarian Split Squat", sets: 4 },
        { name: "Single Leg RDL", sets: 4 },
        { name: "Lateral Lunge", sets: 3 },
        { name: "Soleus Raise", sets: 4 }
      ]
    },

    {
      title: `VO2 Max – ${vo2Reps} x 400m @ ${split}s`,
      exercises: [
        { name: "400m Intervals", sets: vo2Reps }
      ]
    },

    {
      title: "Upper Strength",
      exercises: [
        { name: "Pull Ups", sets: 4 },
        { name: "Barbell Row", sets: 4 },
        { name: "DB Bench Press", sets: 4 },
        { name: "Face Pull", sets: 3 }
      ]
    },

    {
      title: "Tempo Run – 3 x 1km",
      exercises: [
        { name: "1km Tempo Efforts", sets: 3 }
      ]
    },

    {
      title: "Conditioning Circuit",
      exercises: [
        { name: "400m Ski", sets: 3 },
        { name: "20 Wall Balls", sets: 3 },
        { name: "400m Row", sets: 3 }
      ]
    },

    {
      title: `Long Zone 2 – ${longMinutes} min`,
      exercises: [
        { name: "Zone 2 Run", sets: 1 }
      ]
    },

    {
      title: "Recovery + Mobility",
      exercises: [
        { name: "Mobility Flow", sets: 1 }
      ]
    }

  ]

  const today = program[day]

  today.exercises.forEach(ex => {
    ex.sets = Math.round(ex.sets * volume)
  })

  return {
    week,
    readiness,
    workout: today
  }
}

/* =========================================================
   SESSION STORAGE
========================================================= */

function sessionKey(date) {
  return "session_" + date.toDateString()
}

function saveSession() {
  const inputs = document.querySelectorAll(".setInput")
  const data = {}
  inputs.forEach(i => data[i.id] = i.value)
  localStorage.setItem(sessionKey(selectedDate), JSON.stringify(data))
  localStorage.setItem("lastSession", new Date().toDateString())
  alert("Session saved.")
}

function loadSession() {
  const data = JSON.parse(localStorage.getItem(sessionKey(selectedDate)))
  if (!data) return
  Object.keys(data).forEach(id => {
    const el = document.getElementById(id)
    if (el) el.value = data[id]
  })
}

/* =========================================================
   RENDER CALENDAR
========================================================= */

function renderCalendar() {

  const container = document.getElementById("calendarStrip")
  if (!container) return

  container.innerHTML = ""

  const start = getStartDate()
  let d = new Date(start)

  while (d <= PROGRAM_END) {

    const btn = document.createElement("button")
    btn.innerText = d.getDate()

    if (d.toDateString() === selectedDate.toDateString()) {
      btn.style.background = "#10b981"
    }

    btn.onclick = () => {
      selectedDate = new Date(d)
      renderCalendar()
      renderWorkout()
    }

    container.appendChild(btn)
    d.setDate(d.getDate() + 1)
  }
}

/* =========================================================
   RENDER WORKOUT
========================================================= */

function renderWorkout() {

  const data = buildWorkout(selectedDate)

  const container = document.getElementById("todayWorkout")
  if (!container) return

  let html = `
    <div class="card">
      <h2>${formatFullDate(selectedDate)}</h2>
      <h3>Week ${data.week}</h3>
      <h3>${data.workout.title}</h3>
      <p>Readiness: ${data.readiness}</p>
      <p>Projected 2KM: ${projected2km(selectedDate)} sec</p>
  `

  data.workout.exercises.forEach((ex, i) => {

    html += `<h4>${ex.name}</h4>`

    for (let s = 1; s <= ex.sets; s++) {

      const id = `ex_${i}_${s}`

      html += `
        <input
          id="${id}"
          class="setInput"
          placeholder="Reps / Load / Time"
          style="margin-bottom:6px;"
        />
      `
    }
  })

  html += `
      <button onclick="saveSession()" class="success">Save Session</button>
    </div>
  `

  container.innerHTML = html
  loadSession()
}

/* =========================================================
   INIT
========================================================= */

window.onload = function () {
  initProgram()
  selectedDate = new Date()
  renderCalendar()
  renderWorkout()
}
