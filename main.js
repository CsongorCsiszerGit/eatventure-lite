// Eatventure-lite • Level 1 — v0.9.1 (sprites + safe canvas paths)
const $ = (s)=>document.querySelector(s);
const GAME_VERSION = "v0.9.1";

// Cache-bust CSS only (don’t rewrite running scripts)
if (location.hostname.includes("github.io")) {
  const bust = Date.now();
  document.querySelectorAll('link[rel="stylesheet"]').forEach(el=>{
    el.href += (el.href.includes("?")?"&":"?")+"v="+bust;
  });
}

// --------- helpers ---------
function svgDataUri(svg){ return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim()); }
function roundRectPath(ctx, x, y, w, h, r){
  r = Math.max(0, Math.min(r, Math.min(w,h)/2));
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

// --------- sprites (SVG as images) ---------
const garyFrame1 = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect width="64" height="64" fill="none"/>
  <circle cx="32" cy="22" r="10" fill="#bde0fe"/>
  <rect x="22" y="30" width="20" height="18" rx="6" fill="#60a5fa"/>
  <rect x="18" y="46" width="10" height="6" rx="3" fill="#1e293b"/>
  <rect x="36" y="46" width="10" height="6" rx="3" fill="#1e293b"/>
</svg>`);
const garyFrame2 = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect width="64" height="64" fill="none"/>
  <circle cx="32" cy="21" r="10" fill="#bde0fe"/>
  <rect x="22" y="29" width="20" height="18" rx="6" fill="#60a5fa"/>
  <rect x="16" y="46" width="12" height="6" rx="3" fill="#1e293b"/>
  <rect x="36" y="46" width="12" height="6" rx="3" fill="#1e293b"/>
</svg>`);
const customerIdle = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect width="64" height="64" fill="none"/>
  <circle cx="32" cy="14" r="10" fill="#ef4444"/>
  <circle cx="32" cy="26" r="9" fill="#fde68a"/>
  <rect x="22" y="34" width="20" height="18" rx="6" fill="#64748b"/>
</svg>`);
const machineSprite = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect width="48" height="40" x="8" y="16" rx="6" fill="#334155" stroke="#0f172a" stroke-width="3"/>
  <rect x="16" y="22" width="10" height="10" rx="2" fill="#22d3ee"/>
  <rect x="30" y="22" width="18" height="4" rx="2" fill="#94a3b8"/>
  <rect x="32" y="30" width="14" height="4" rx="2" fill="#94a3b8"/>
  <rect x="26" y="36" width="24" height="4" rx="2" fill="#6366f1"/>
</svg>`);
const counterSprite = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="64">
  <rect x="8" y="8" width="240" height="48" rx="14" fill="#334155" stroke="#0f172a" stroke-width="3"/>
</svg>`);
const bubbleSprite = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="40">
  <rect x="2" y="2" width="60" height="30" rx="10" fill="#111827" stroke="#1f2937" stroke-width="2"/>
  <text x="32" y="20" dominant-baseline="middle" text-anchor="middle" font-size="16">🍹</text>
</svg>`);

const imgGary1 = new Image(); imgGary1.src = garyFrame1;
const imgGary2 = new Image(); imgGary2.src = garyFrame2;
const imgCustomer = new Image(); imgCustomer.src = customerIdle;
const imgMachine = new Image(); imgMachine.src = machineSprite;
const imgCounter = new Image(); imgCounter.src = counterSprite;
const imgBubble = new Image(); imgBubble.src = bubbleSprite;

// --------- state ---------
const state = {
  coins: 0,
  price: 1,
  customers: [],
  gary: { x: 270, y: 520, speed: 140, task: "idle", timer: 0, target: {x:270,y:520}, frame: 0, frameTimer:0 },
  ORDER_TIME: 1.2,
  PREP_TIME: 1.8,
  points: {
    counter: { x: 270, y: 520 },
    queue:   { x: 270, y: 610 },
    machine: { x: 270, y: 650 }
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

// --------- save/load ---------
function load(){ try{ const raw = localStorage.getItem("evlite_flow_0_9"); if(raw) Object.assign(state, JSON.parse(raw)); }catch(e){} }
function save(){ localStorage.setItem("evlite_flow_0_9", JSON.stringify(state)); }
function reset(){ localStorage.removeItem("evlite_flow_0_9"); location.reload(); }

// --------- utils ---------
const fmt = (n)=> n>=1e6 ? (n/1e6).toFixed(1)+"M" : n>=1e3 ? (n/1e3).toFixed(1)+"K" : Math.floor(n).toString();
function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }
function moveTowards(p, target, maxStep){
  const d = dist(p,target); if (d<=maxStep || d===0){ p.x=target.x; p.y=target.y; return true; }
  p.x += (target.x - p.x) * (maxStep/d);
  p.y += (target.y - p.y) * (maxStep/d);
  return false;
}

// --------- customers ---------
function spawnCustomer(){
  if (state.customers.length>0) return; // single customer for now
  state.customers.push({ x: state.points.queue.x, y: state.points.queue.y, state:"waiting" });
}
function activeCustomer(){ return state.customers[0] || null; }
function removeCustomer(){ state.customers.shift(); }

// --------- Gary AI ---------
function updateGary(dt){
  const g = state.gary, cust = activeCustomer();

  // two-frame walk while moving
  if (g.task==="toCustomer"||g.task==="toMachine"||g.task==="toCustomerDeliver"){
    g.frameTimer += dt;
    if (g.frameTimer>0.15){ g.frame = 1-g.frame; g.frameTimer=0; }
  } else { g.frame = 0; }

  switch(g.task){
    case "idle":
      if (cust && cust.state==="waiting"){ g.target = state.points.counter; g.task="toCustomer"; }
      break;
    case "toCustomer":
      if (moveTowards(g, g.target, g.speed*dt)){ g.task="takingOrder"; g.timer=state.ORDER_TIME; }
      break;
    case "takingOrder":
      g.timer -= dt; if (g.timer<=0){ if (cust) cust.state="ordered"; g.target=state.points.machine; g.task="toMachine"; }
      break;
    case "toMachine":
      if (moveTowards(g, g.target, g.speed*dt)){ g.task="prepping"; g.timer=state.PREP_TIME; }
      break;
    case "prepping":
      g.timer -= dt; if (g.timer<=0){ g.target = state.points.counter; g.task="toCustomerDeliver"; }
      break;
    case "toCustomerDeliver":
      if (moveTowards(g, g.target, g.speed*dt)){ g.task="delivering"; g.timer=0.25; }
      break;
    case "delivering":
      g.timer -= dt;
      if (g.timer<=0){ state.coins += state.price; if (cust) cust.state="served"; removeCustomer(); g.task="idle"; }
      break;
  }
}

// --------- UI ---------
function renderUI(){
  el.coins.textContent = fmt(state.coins);
  el.price.textContent = fmt(state.price);
  el.garyState.textContent = state.gary.task[0].toUpperCase()+state.gary.task.slice(1);
}

// --------- draw ---------
function draw(){
  // Scene BG
  ctx.fillStyle = "#0b1228"; ctx.fillRect(0,0,vw,vh);
  // Sidewalk + curb
  ctx.fillStyle = "#1b2848"; ctx.fillRect(20,160,vw-40,520);
  ctx.fillStyle = "#2a365c"; ctx.fillRect(20,140,vw-40,20);

  // Counter
  ctx.drawImage(imgCounter, vw/2-128, 470, 256, 64);

  // Machine pad (rounded)
  ctx.fillStyle = "#2c3568";
  roundRectPath(ctx, state.points.machine.x-40, state.points.machine.y-24, 80, 40, 10); ctx.fill();

  // Machine
  ctx.drawImage(imgMachine, state.points.machine.x-32, state.points.machine.y-56, 64, 64);

  // Customer
  const cust = activeCustomer();
  if (cust){
    ctx.drawImage(imgCustomer, cust.x-32, cust.y-56, 64, 64);
    if (state.gary.task==="takingOrder" || cust.state==="waiting"){
      ctx.drawImage(imgBubble, cust.x-32, cust.y-92, 64, 40);
    }
  }

  // Gary (two-frame)
  const g = state.gary;
  ctx.drawImage(g.frame===0?imgGary1:imgGary2, g.x-32, g.y-56, 64, 64);

  // version
  ctx.textAlign="left"; ctx.textBaseline="top"; ctx.font="14px system-ui, sans-serif"; ctx.fillStyle="#ffffffaa";
  ctx.fillText(GAME_VERSION, 6, 6);

  requestAnimationFrame(draw);
}

// --------- loop ---------
let last = performance.now();
function step(ts){
  const dt = Math.min(0.05, (ts - last)/1000);
  last = ts;
  updateGary(dt);
  renderUI();
  requestAnimationFrame(step);
}

// --------- events ---------
el.spawnBtn.addEventListener("pointerdown", ()=>{ spawnCustomer(); save(); });
el.spawnBtn.addEventListener("click", ()=>{ spawnCustomer(); save(); }); // extra mobile safety
el.resetBtn.addEventListener("pointerdown", reset);
el.saveBtn.addEventListener("pointerdown", ()=>{ save(); flash("Saved"); });

// --------- toast ---------
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

// --------- start ---------
load();
renderUI();
requestAnimationFrame(step);
draw();

// Auto-spawn demo
setInterval(()=>{ if (!activeCustomer()) spawnCustomer(); }, 4500);
