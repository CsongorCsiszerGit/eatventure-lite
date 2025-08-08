// Eatventure-lite Level 1 — core mechanics only.
const $ = (s)=>document.querySelector(s);

// Consistent burger icon (SVG as data URI)
const burgerImg = new Image();
burgerImg.src =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="16" y="70" width="96" height="16" rx="8" fill="#7a3e2d"/>
  <rect x="12" y="58" width="104" height="12" rx="6" fill="#3b7420"/>
  <rect x="10" y="44" width="108" height="14" rx="8" fill="#e8b04b"/>
  <rect x="8"  y="28" width="112" height="18" rx="9" fill="#f5c26b"/>
  <circle cx="28" cy="34" r="2" fill="#fff6c7"/>
  <circle cx="44" cy="31" r="2" fill="#fff6c7"/>
  <circle cx="64" cy="35" r="2" fill="#fff6c7"/>
  <circle cx="84" cy="32" r="2" fill="#fff6c7"/>
  <circle cx="100" cy="36" r="2" fill="#fff6c7"/>
</svg>`);

// ---- Game State ----
const state = {
  coins: 0,
  price: 1,            // coins earned per serve
  tapPower: 1,         // serves per tap
  worker: {            // auto serves per second
    count: 0,          // 0 or 1 for L1
    rate: 0,           // serves per second
  },
  costs: {
    tapUpgrade: 10,
    hire: 100,
    speed: 80,
    price: 30,
  },
  upgradesBought: 0,
  goals: { earn500:false, hire1:false, buy3:false },
};

// ---- Elements ----
const el = {
  coins: $("#coins"),
  perTap: $("#perTap"),
  price: $("#price"),
  worker: $("#worker"),
  tapBtn: $("#tapBtn"),
  upgradeTapBtn: $("#upgradeTapBtn"),
  hireBtn: $("#hireBtn"),
  speedBtn: $("#speedBtn"),
  priceBtn: $("#priceBtn"),
  saveBtn: $("#saveBtn"),
  resetBtn: $("#resetBtn"),
  canvas: $("#game"),
  g1: $("#g1"), g2: $("#g2"), g3: $("#g3"),
  winModal: $("#winModal"),
  closeModal: $("#closeModal"),
};

const ctx = el.canvas.getContext("2d");
let vw = el.canvas.width, vh = el.canvas.height;

// ---- Save/Load ----
function load(){
  try {
    const raw = localStorage.getItem("evlite_l1");
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch(e){}
}
function save(){
  localStorage.setItem("evlite_l1", JSON.stringify(state));
}
function reset(){
  localStorage.removeItem("evlite_l1");
  location.reload();
}

// ---- UI ----
const fmt = (n)=> n>=1e6 ? (n/1e6).toFixed(1)+"M" : n>=1e3 ? (n/1e3).toFixed(1)+"K" : Math.floor(n).toString();
function renderUI(){
  el.coins.textContent = fmt(state.coins);
  el.perTap.textContent = fmt(state.tapPower);
  el.price.textContent = fmt(state.price);
  el.worker.textContent = `${state.worker.rate.toFixed(1)}/s`;

  el.upgradeTapBtn.textContent = `Upgrade Tap (+1) — ${fmt(state.costs.tapUpgrade)}`;
  el.hireBtn.textContent = state.worker.count === 0 ? `Hire Worker — ${fmt(state.costs.hire)}` : `Worker Hired`;
  el.hireBtn.disabled = state.worker.count > 0;
  el.speedBtn.textContent = `Worker Speed (+0.5/s) — ${fmt(state.costs.speed)}`;
  el.priceBtn.textContent = `Increase Price (+1) — ${fmt(state.costs.price)}`;

  el.g1.textContent = state.goals.earn500 ? "✅" : "❌";
  el.g2.textContent = state.goals.hire1 ? "✅" : "❌";
  el.g3.textContent = state.goals.buy3 ? "✅" : "❌";
}

// ---- Core Actions ----
function serve(times){
  const serves = Math.max(0, times);
  state.coins += serves * state.price;
}

function onTap(){
  serve(state.tapPower);
  pops.push({x: vw/2, y: vh*0.55, text: `+${(state.tapPower*state.price).toFixed(0)}`, t: 0});
  pulse = 1.0;
  checkGoals();
}

function buyTapUpgrade(){
  if (state.coins < state.costs.tapUpgrade) { flash("Not enough coins"); return; }
  state.coins -= state.costs.tapUpgrade;
  state.tapPower += 1;
  state.costs.tapUpgrade = Math.ceil(state.costs.tapUpgrade * 1.5);
  state.upgradesBought++;
  checkGoals(); save();
}

function hireWorker(){
  if (state.worker.count > 0) return;
  if (state.coins < state.costs.hire) { flash("Not enough coins"); return; }
  state.coins -= state.costs.hire;
  state.worker.count = 1;
  state.worker.rate = 1.0; // 1 serve/sec to start
  checkGoals(); save();
}

function upgradeSpeed(){
  if (state.coins < state.costs.speed) { flash("Not enough coins"); return; }
  state.coins -= state.costs.speed;
  state.worker.rate += 0.5;
  state.costs.speed = Math.ceil(state.costs.speed * 1.6);
  state.upgradesBought++;
  checkGoals(); save();
}

function upgradePrice(){
  if (state.coins < state.costs.price) { flash("Not enough coins"); return; }
  state.coins -= state.costs.price;
  state.price += 1;
  state.costs.price = Math.ceil(state.costs.price * 1.7);
  state.upgradesBought++;
  checkGoals(); save();
}

// ---- Goals & Level Complete ----
function checkGoals(){
  if (state.coins >= 500) state.goals.earn500 = true;
  if (state.worker.count >= 1) state.goals.hire1 = true;
  if (state.upgradesBought >= 3) state.goals.buy3 = true;

  if (state.goals.earn500 && state.goals.hire1 && state.goals.buy3){
    if (el.winModal.style.display !== "grid"){
      el.winModal.style.display = "grid";
    }
  }
  renderUI();
}

// ---- Loop ----
let pulse = 0;
let pops = [];

function draw(){
  // bg
  ctx.fillStyle = "#2b3e6e";
  ctx.fillRect(0,0,vw,vh);

  // counter card
  const cardW = vw*0.8, cardH = vh*0.22;
  const cx = (vw-cardW)/2, cy = vh*0.12;
  ctx.fillStyle = "#12142a";
  ctx.strokeStyle = "#202645";
  ctx.lineWidth = 4;
  roundRect(ctx, cx, cy, cardW, cardH, 18, true, true);

  // coins text
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e8ecff";
  ctx.font = "700 42px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(fmt(state.coins), vw/2, cy + cardH/2);

  // burger button (visual)
  const r = Math.floor(vw*0.22 * (1 + 0.08*pulse));
  const cx2 = vw/2, cy2 = vh*0.62;
  ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI*2); ctx.closePath();
  ctx.fillStyle = "#1c2250"; ctx.fill();
  ctx.strokeStyle = "#0c0f24"; ctx.lineWidth = 6; ctx.stroke();

  // burger image
  const size = r * 1.6;
  ctx.drawImage(burgerImg, cx2 - size/2, cy2 - size/2, size, size);

  // floating pops
  for (let i=pops.length-1;i>=0;i--){
    const p = pops[i];
    p.t += 0.016;
    const a = Math.max(0, 1 - p.t/0.8);
    ctx.globalAlpha = a;
    ctx.font = "700 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = "#6ee7a0";
    ctx.fillText(p.text, p.x, p.y - p.t*60);
    ctx.globalAlpha = 1;
    if (a <= 0) pops.splice(i,1);
  }

  pulse = Math.max(0, pulse - 0.05);
  requestAnimationFrame(draw);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke){
  if (w < 2*r) r = w/2;
  if (h < 2*r) r = h/2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// ---- Timers ----
let last = performance.now();
function step(ts){
  const dt = Math.min(0.25, (ts - last) / 1000);
  last = ts;
  if (state.worker.rate > 0){
    serve(state.worker.rate * dt);
  }
  requestAnimationFrame(step);
}

function flash(msg){
  if (!document.getElementById("toast")){
    const t = document.createElement("div");
    t.id = "toast";
    Object.assign(t.style, { position:"fixed", left:"50%", top:"12px", transform:"translateX(-50%)",
      background:"#11162f", color:"#e8ecff", padding:"10px 14px", borderRadius:"12px",
      border:"1px solid #202645", zIndex:9999, fontWeight:"700" });
    document.body.appendChild(t);
  }
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.opacity = "1";
  setTimeout(()=>{ t.style.opacity = "0"; }, 1200);
}

// ---- Events ----
$("#game").addEventListener("pointerdown", onTap, { passive:true });
$("#tapBtn").addEventListener("pointerdown", onTap, { passive:true });
$("#upgradeTapBtn").addEventListener("pointerdown", ()=>{ buyTapUpgrade(); renderUI(); }, { passive:true });
$("#hireBtn").addEventListener("pointerdown", ()=>{ hireWorker(); renderUI(); }, { passive:true });
$("#speedBtn").addEventListener("pointerdown", ()=>{ upgradeSpeed(); renderUI(); }, { passive:true });
$("#priceBtn").addEventListener("pointerdown", ()=>{ upgradePrice(); renderUI(); }, { passive:true });
$("#saveBtn").addEventListener("pointerdown", ()=>{ save(); flash("Saved"); }, { passive:true });
$("#resetBtn").addEventListener("pointerdown", reset, { passive:true });
$("#closeModal").addEventListener("pointerdown", ()=>{ $("#winModal").style.display="none"; }, { passive:true });

// ---- Init ----
load();
renderUI();
requestAnimationFrame(step);
draw();
setInterval(()=>{ save(); checkGoals(); }, 2000);
