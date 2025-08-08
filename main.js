// Eatventure-lite Starter (no libs). Mobile-first. Pointer Events.
const $ = (s)=>document.querySelector(s);

// Consistent burger icon (SVG as data URI), same on all devices
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

const state = {
  coins: 0,
  perTap: 1,
  upgradeCost: 10,
  stageIdx: 0,
  stages: [
    { name: "Stand", color: "#26325f" },
    { name: "Food Truck", color: "#2b3e6e" },
    { name: "Cafe", color: "#314a7d" },
    { name: "Diner", color: "#37568c" },
    { name: "Restaurant", color: "#3d629b" },
  ]
};

const el = {
  coins: $("#coins"),
  perTap: $("#perTap"),
  stage: $("#stage"),
  tapBtn: $("#tapBtn"),
  upgradeBtn: $("#upgradeBtn"),
  saveBtn: $("#saveBtn"),
  resetBtn: $("#resetBtn"),
  canvas: $("#game"),
};

const ctx = el.canvas.getContext("2d");
let vw = el.canvas.width, vh = el.canvas.height;

// --- Utils
const fmt = (n)=> n>=1e6 ? (n/1e6).toFixed(1)+"M" : n>=1e3 ? (n/1e3).toFixed(1)+"K" : Math.floor(n).toString();
const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));

function load() {
  try {
    const raw = localStorage.getItem("evlite");
    if (raw) {
      const saved = JSON.parse(raw);
      Object.assign(state, saved);
    }
  } catch(e){ console.warn("No save"); }
}
function save() {
  localStorage.setItem("evlite", JSON.stringify({
    coins: state.coins,
    perTap: state.perTap,
    upgradeCost: state.upgradeCost,
    stageIdx: state.stageIdx,
    stages: state.stages,
  }));
}

function reset() {
  state.coins = 0;
  state.perTap = 1;
  state.upgradeCost = 10;
  state.stageIdx = 0;
  save();
  flash("Reset!");
}

function renderUI(){
  el.coins.textContent = fmt(state.coins);
  el.perTap.textContent = fmt(state.perTap);
  el.stage.textContent = state.stages[state.stageIdx].name;
  el.upgradeBtn.textContent = `Upgrade (+${fmt(Math.max(1, Math.floor(state.perTap*0.5)))}) — ${fmt(state.upgradeCost)} 💰`;
}

// --- Input
function onTap(){
  state.coins += state.perTap;
  pops.push({x: vw/2, y: vh*0.55, text: `+${fmt(state.perTap)}`, t: 0});
  pulse = 1.0;
}

function canUpgrade() { return state.coins >= state.upgradeCost; }

function doUpgrade(){
  if (!canUpgrade()) { flash("Not enough coins"); return; }
  state.coins -= state.upgradeCost;
  const inc = Math.max(1, Math.floor(state.perTap * 0.5));
  state.perTap += inc;
  state.upgradeCost = Math.ceil(state.upgradeCost * 1.45);
  if (state.perTap >= (5 * (state.stageIdx+1)) && state.stageIdx < state.stages.length-1) {
    state.stageIdx++;
    flash("New stage unlocked!");
  }
  save();
}

// --- Canvas simple scene
let pulse = 0;
let pops = [];

function draw(){
  const st = state.stages[state.stageIdx];
  // bg
  ctx.fillStyle = st.color;
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

  // burger button (visual) in center
  const r = Math.floor(vw*0.22 * (1 + 0.08*pulse));
  const cx2 = vw/2, cy2 = vh*0.62;
  ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI*2); ctx.closePath();
  ctx.fillStyle = "#1c2250"; ctx.fill();
  ctx.strokeStyle = "#0c0f24"; ctx.lineWidth = 6; ctx.stroke();

  // burger image (consistent across devices)
  const size = r * 1.6;
  ctx.drawImage(burgerImg, cx2 - size/2, cy2 - size/2, size, size);

  // floating pops
  for (let i=pops.length-1;i>=0;i--){
    const p = pops[i];
    p.t += 0.016;
    const a = clamp(1 - p.t/0.8, 0, 1);
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

// Pointer Events on canvas + button
el.canvas.addEventListener("pointerdown", onTap, { passive: true });
el.tapBtn.addEventListener("pointerdown", onTap, { passive: true });
el.upgradeBtn.addEventListener("pointerdown", ()=>{ doUpgrade(); renderUI(); }, { passive: true });
el.saveBtn.addEventListener("pointerdown", ()=>{ save(); flash("Saved"); }, { passive: true });
el.resetBtn.addEventListener("pointerdown", ()=>{ reset(); renderUI(); }, { passive: true });

// Resize handling (keeps internal resolution steady for simplicity)
function onResize(){
  // Keep canvas internal size fixed (540x720) for now; CSS scales for device.
}
window.addEventListener("resize", onResize);

// Toasts
let toastTimer = null;
function flash(msg){
  if (!document.getElementById("toast")){
    const t = document.createElement("div");
    t.id = "toast";
    Object.assign(t.style, {
      position:"fixed", left:"50%", top:"12px", transform:"translateX(-50%)",
      background:"#11162f", color:"#e8ecff", padding:"10px 14px", borderRadius:"12px",
      border:"1px solid #202645", zIndex:9999, fontWeight:"700"
    });
    document.body.appendChild(t);
  }
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ t.style.opacity = "0"; }, 1200);
}

// Loop & init
function tick(){
  renderUI();
}
setInterval(tick, 250); // lightweight UI sync

load();
renderUI();
draw();
// Auto-save
setInterval(save, 5000);
