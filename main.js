// Eatventure-lite • Level 1 — v0.8 (Gary + Customer + Machine loop)
const $ = (s)=>document.querySelector(s);
const GAME_VERSION = "v0.8";

// Auto cache-bust on GitHub Pages while we iterate
if (location.hostname.includes("github.io")) {
  const bust = Date.now();
  document.querySelectorAll('script[src],link[rel="stylesheet"]').forEach(el=>{
    const k = el.tagName==="SCRIPT" ? "src" : "href";
    el[k] += (el[k].includes("?")?"&":"?")+"v="+bust;
  });
}

// --- State ---
const state = {
  coins: 0,
  price: 1,               // coins per lemonade
  customers: [],          // queue (max 1 visible for v0.8)
  gary: {
    x: 270, y: 520,       // start near counter
    speed: 140,           // px/s
    task: "idle",         // idle|toCustomer|takingOrder|toMachine|prepping|toCustomerDeliver|delivering
    timer: 0,             // for actions
    target: {x:270, y:520}
  },
  // timings (seconds)
  ORDER_TIME: 1.5,
  PREP_TIME: 2.0,
  // positions
  points: {
    counter: { x: 270, y: 520 },       // where customer stands
    queue:   { x: 270, y: 600 },       // spawn point
    machine: { x: 270, y: 640 },       // lemonade machine (red arrow area)
  }
};

const el = {
  coins: $("#coins"),
  price: $("#price"),
  garyState: $("#garyState"),
  canvas: $("#game"),
  spawnBtn: $("#spawnBtn"),
  resetBtn: $("#resetBtn"),
  saveBtn: $("#saveBtn"),
};

const ctx = el.canvas.getContext("2d");
let vw = el.canvas.width, vh = el.canvas.height;

// --- Save/Load ---
function load(){
  try {
    const raw = localStorage.getItem("evlite_flow");
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch(e){}
}
function save(){ localStorage.setItem("evlite_flow", JSON.stringify(state)); }
function reset(){ localStorage.removeItem("evlite_flow"); location.reload(); }

// --- Utils ---
const fmt = (n)=> n>=1e6 ? (n/1e6).toFixed(1)+"M" : n>=1e3 ? (n/1e3).toFixed(1)+"K" : Math.floor(n).toString();
function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }
function moveTowards(p, target, maxStep){
  const d = dist(p,target); if (d<=maxStep || d===0){ p.x=target.x; p.y=target.y; return true; }
  p.x += (target.x - p.x) * (maxStep/d);
  p.y += (target.y - p.y) * (maxStep/d);
  return false;
}

// --- Customer logic ---
function spawnCustomer(){
  // Only one visible customer for v0.8 (simple)
  if (state.customers.length>0) return;
  state.customers.push({ x: state.points.queue.x, y: state.points.queue.y, state:"waiting" });
}
function activeCustomer(){ return state.customers[0] || null; }
function removeCustomer(){ state.customers.shift(); }

// --- Gary state machine ---
function updateGary(dt){
  const g = state.gary;
  const cust = activeCustomer();
  switch(g.task){
    case "idle":
      if (cust && cust.state==="waiting"){
        g.target = state.points.counter;
        g.task = "toCustomer";
      }
      break;
    case "toCustomer":
      if (moveTowards(g, g.target, g.speed*dt)){
        g.task = "takingOrder";
        g.timer = state.ORDER_TIME;
      }
      break;
    case "takingOrder":
      g.timer -= dt;
      if (g.timer<=0){
        if (cust) cust.state="ordered";
        g.target = state.points.machine;
        g.task = "toMachine";
      }
      break;
    case "toMachine":
      if (moveTowards(g, g.target, g.speed*dt)){
        g.task = "prepping";
        g.timer = state.PREP_TIME;
      }
      break;
    case "prepping":
      g.timer -= dt;
      if (g.timer<=0){
        g.target = state.points.counter;
        g.task = "toCustomerDeliver";
      }
      break;
    case "toCustomerDeliver":
      if (moveTowards(g, g.target, g.speed*dt)){
        g.task = "delivering";
        g.timer = 0.3; // quick handover
      }
      break;
    case "delivering":
      g.timer -= dt;
      if (g.timer<=0){
        // complete order
        state.coins += state.price;
        if (cust) cust.state="served";
        removeCustomer();
        g.task = "idle";
      }
      break;
  }
}

// --- UI ---
function renderUI(){
  el.coins.textContent = fmt(state.coins);
  el.price.textContent = fmt(state.price);
  el.garyState.textContent = state.gary.task[0].toUpperCase()+state.gary.task.slice(1);
}

// --- Draw ---
function draw(){
  // background scene
  ctx.fillStyle = "#2b3e6e";
  ctx.fillRect(0,0,vw,vh);

  // counter area
  ctx.fillStyle = "#1b2448";
  ctx.fillRect(60, 460, vw-120, 160);

  // counter table
  ctx.fillStyle = "#283060";
  ctx.beginPath(); ctx.roundRect(120, 490, vw-240, 60, 18); ctx.fill();
  ctx.strokeStyle = "#0c0f24"; ctx.lineWidth = 4; ctx.stroke();

  // machine pad
  ctx.fillStyle = "#2c3568";
  ctx.beginPath(); ctx.roundRect(state.points.machine.x-40, state.points.machine.y-24, 80, 40, 10); ctx.fill();

  // machine box
  ctx.fillStyle = "#33407a";
  ctx.fillRect(state.points.machine.x-22, state.points.machine.y-50, 44, 40);

  // customer (simple circle)
  const cust = activeCustomer();
  if (cust){
    ctx.fillStyle = "#e6a5b4"; // hat
    ctx.beginPath(); ctx.arc(cust.x, cust.y-28, 14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#f3d2a2"; // head
    ctx.beginPath(); ctx.arc(cust.x, cust.y-10, 12, 0, Math.PI*2); ctx.fill();
    // speech bubble "🍹"
    ctx.fillStyle = "#11162f"; ctx.beginPath(); ctx.roundRect(cust.x-18, cust.y-56, 36, 24, 8); ctx.fill();
    ctx.fillStyle = "#e8ecff"; ctx.font = "16px system-ui, sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("🍹", cust.x, cust.y-44);
  }

  // Gary
  const g = state.gary;
  ctx.fillStyle = "#6ee7ff";
  ctx.beginPath(); ctx.arc(g.x, g.y-10, 14, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#0c0f24"; ctx.fillRect(g.x-12, g.y+2, 24, 6); // feet/shadow

  // version label
  ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.font = "14px system-ui, sans-serif";
  ctx.fillStyle = "#ffffffaa"; ctx.fillText(GAME_VERSION, 6, 6);

  requestAnimationFrame(draw);
}

// --- Loop ---
let last = performance.now();
function step(ts){
  const dt = Math.min(0.05, (ts - last)/1000); // clamp dt
  last = ts;

  updateGary(dt);
  renderUI();
  requestAnimationFrame(step);
}

// --- Events ---
el.spawnBtn.addEventListener("pointerdown", ()=>{ spawnCustomer(); save(); });
el.resetBtn.addEventListener("pointerdown", reset);
el.saveBtn.addEventListener("pointerdown", ()=>{ save(); flash("Saved"); });

// --- Toast ---
function flash(msg){
  if (!document.getElementById("toast")){
    const t = document.createElement("div");
    t.id = "toast";
    Object.assign(t.style,{position:"fixed",left:"50%",top:"12px",transform:"translateX(-50%)",
      background:"#11162f",color:"#e8ecff",padding:"10px 14px",borderRadius:"12px",
      border:"1px solid #202645",zIndex:9999,fontWeight:"700"});
    document.body.appendChild(t);
  }
  const t = document.getElementById("toast");
  t.textContent = msg; t.style.opacity="1"; setTimeout(()=> t.style.opacity="0", 1200);
}

// --- Start ---
load();
renderUI();
requestAnimationFrame(step);
draw();

// Optional: auto-spawn a customer every 4–7s for demo
setInterval(()=>{ if (!activeCustomer()) spawnCustomer(); }, 4500);
