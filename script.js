const plan = {
  1: `
  Mon: Push-up ladder 1-12 + Pull-ups 5x max
  Tue: 6x400m @ 1:28-1:30
  Wed: 8km Tab @ 15kg
  Thu: Squats + RDL + Lunges
  Fri: 4 Rounds Circuit
  Sat: 10km steady run
  Sun: Recovery walk
  `,
  2: `
  Mon: Upper volume
  Tue: 3x800m
  Wed: 10km Tab @ 18kg
  Thu: Lower strength
  Fri: 4-5 Rounds Circuit
  Sat: 8km endurance
  Sun: Recovery
  `,
  3: `
  Tue: 2km Time Trial
  Wed: 12km @ 18kg
  Fri: 5 Round Circuit
  `,
  4: `
  Wed: 12km @ 20kg
  Tue: 4x800m
  `,
  5: `
  Wed: 14km @ 20kg
  Tue: Hill sprints
  `,
  6: `
  Wed: 15km @ 22kg
  Tue: 2km Test
  `,
  7: `
  Fri: 2km
  Sat: 16km @ 22-25kg
  Sun: Hills + Circuit
  `,
  8: `
  Wed: 12km @ 20kg
  Tue: 6x400m fast
  `,
  9: `
  Tue: 4x400m
  Wed: 6km @ 15kg
  Taper week
  `
};

function loadWeek() {
  const selectedWeek = document.getElementById("week").value;
  document.getElementById("plan-display").innerText = plan[selectedWeek];
}

loadWeek();
