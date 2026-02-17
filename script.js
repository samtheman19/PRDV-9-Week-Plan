const TARGET = new Date("2026-04-27");
let seconds = 0;
let timerInt = null;

let perf = {
  push: 30,
  pull: 8,
  twoKm: 470,
  sleep: 7,
  fatigue: 5
};

let loadHistory = JSON.parse(localStorage.getItem("loadHistory")) || [];
let twoKmHistory = JSON.parse(localStorage.getItem("twoKmHistory")) || [];

/* COUNTDOWN */
function updateCountdown() {
  const diff = TARGET - new Date();
  const days = Math.ceil(diff / (1000*60*60*24));
  countdown.innerText = days + " days to PRDV";
}

/* TIMER */
function startTimer(){
  if(!timerInt)
    timerInt=setInterval(()=>{
      seconds++;
      updateTimer();
    },1000);
}

function pauseTimer(){
  clearInterval(timerInt);
  timerInt=null;
}

function endSession(){
  pauseTimer();
  recordLoad();
  seconds=0;
  updateTimer();
}

function updateTimer(){
  const h=String(Math.floor(seconds/3600)).padStart(2,'0');
  const m=String(Math.floor(seconds%3600/60)).padStart(2,'0');
  const s=String(seconds%60).padStart(2,'0');
  timer.innerText=`${h}:${m}:${s}`;
}

/* UPDATE PERFORMANCE */
function updatePerformance(){
  perf.push=parseInt(pushInput.value)||perf.push;
  perf.pull=parseInt(pullInput.value)||perf.pull;
  perf.twoKm=parseInt(twoKmInput.value)||perf.twoKm;
  perf.sleep=parseFloat(sleepInput.value)||perf.sleep;
  perf.fatigue=parseInt(fatigueInput.value)||perf.fatigue;

  twoKmHistory.push(perf.twoKm);
  localStorage.setItem("twoKmHistory",JSON.stringify(twoKmHistory));

  render();
}

/* SRI */
function calculateSRI(){
  let score=0;
  score+=Math.min((perf.push/60)*25,25);
  score+=Math.min((perf.pull/15)*20,20);
  score+=Math.max(0,((500-perf.twoKm)/100)*25);
  score+=Math.min((perf.sleep/8)*10,10);
  score+=Math.max(0,((10-perf.fatigue)/10)*20);
  return Math.round(Math.min(score,100));
}

/* LOAD MODEL */
function recordLoad(){
  const load=seconds/60 + perf.fatigue*4;
  loadHistory.push(load);
  if(loadHistory.length>28) loadHistory.shift();
  localStorage.setItem("loadHistory",JSON.stringify(loadHistory));
}

function acuteLoad(){
  return loadHistory.slice(-7).reduce((a,b)=>a+b,0);
}

function chronicLoad(){
  return loadHistory.reduce((a,b)=>a+b,0)/loadHistory.length||0;
}

function loadRatio(){
  return acuteLoad()/(chronicLoad()||1);
}

/* AI */
function generateAdvice(){
  const sri=calculateSRI();
  const ratio=loadRatio();

  if(ratio>1.5) return "⚠ Deload recommended – overload detected.";
  if(perf.twoKm>460) return "Increase VO2 + threshold work.";
  if(perf.push<40) return "Increase push-up density.";
  if(perf.pull<10) return "Add weighted pull-ups.";
  if(sri>80) return "Maintain intensity – competitive.";
  return "Build aerobic base.";
}

/* RENDER */
function render(){

  updateCountdown();

  const sri=calculateSRI();
  sriValue.innerText=sri;
  sriBar.style.width=sri+"%";
  sriStatus.innerText=
    sri>75?"GREEN – Competitive":
    sri>55?"AMBER – Building":
    "RED – Below Standard";

  const ratio=loadRatio();
  loadValue.innerText=ratio.toFixed(2);
  loadBar.style.width=Math.min(ratio*50,100)+"%";

  loadWarning.innerText=
    ratio>1.5?"High overload":
    ratio<0.8?"Undertraining":
    "Balanced";

  aiAdvice.innerText=generateAdvice();

  renderCharts();
}

/* CHARTS */
let loadChart,twoKmChart;

function renderCharts(){

  if(loadChart) loadChart.destroy();
  if(twoKmChart) twoKmChart.destroy();

  loadChart=new Chart(loadChartCanvas,{
    type:'line',
    data:{
      labels:loadHistory.map((_,i)=>i+1),
      datasets:[{
        data:loadHistory,
        borderColor:'#1fd38a',
        tension:0.3
      }]
    }
  });

  twoKmChart=new Chart(twoKmChartCanvas,{
    type:'line',
    data:{
      labels:twoKmHistory.map((_,i)=>i+1),
      datasets:[{
        data:twoKmHistory,
        borderColor:'#3b82f6',
        tension:0.3
      }]
    }
  });
}

updateCountdown();
render();
