const GAME_VERSION = "v0.9";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const elCoins = document.getElementById("coins");
const elPerDrink = document.getElementById("perDrink");
const elGaryState = document.getElementById("garyState");

let coins = 0;
let perDrink = 1;
let garyState = "Idle";

let customer = null;
let gary = { x: 180, y: 400, speed: 2 };
let lemonadeMachine = { x: 180, y: 200 };

// Draw simple placeholder graphics
function drawGary() {
  ctx.fillStyle = "red";
  ctx.fillRect(gary.x - 15, gary.y - 15, 30, 30);
}

function drawCustomer() {
  if (customer) {
    ctx.fillStyle = "blue";
    ctx.fillRect(customer.x - 15, customer.y - 15, 30, 30);
  }
}

function drawMachine() {
  ctx.fillStyle = "yellow";
  ctx.fillRect(lemonadeMachine.x - 20, lemonadeMachine.y - 20, 40, 40);
}

// Spawn a new customer
function spawnCustomer() {
  if (!customer) {
    customer = { x: 180, y: 100, state: "waiting" };
  }
}

// Reset game
function resetGame() {
  coins = 0;
  customer = null;
  gary.x = 180;
  gary.y = 400;
  garyState = "Idle";
}

// Simple movement AI for Gary
function updateGary() {
  if (customer && customer.state === "waiting" && garyState === "Idle") {
    garyState = "Going to Customer";
  }

  if (garyState === "Going to Customer") {
    moveTowards(gary, customer, () => {
      garyState = "Going to Machine";
      customer.state = "served";
    });
  }

  if (garyState === "Going to Machine") {
    moveTowards(gary, lemonadeMachine, () => {
      coins += perDrink;
      garyState = "Returning";
    });
  }

  if (garyState === "Returning") {
    moveTowards(gary, { x: 180, y: 400 }, () => {
      garyState = "Idle";
      customer = null;
    });
  }
}

function moveTowards(obj, target, onArrive) {
  let dx = target.x - obj.x;
  let dy = target.y - obj.y;
  let dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < obj.speed) {
    obj.x = target.x;
    obj.y = target.y;
    if (onArrive) onArrive();
  } else {
    obj.x += (dx / dist) * obj.speed;
    obj.y += (dy / dist) * obj.speed;
  }
}

function renderUI() {
  elCoins.textContent = coins;
  elPerDrink.textContent = perDrink;
  elGaryState.textContent = garyState;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw machine, customer, and Gary
  drawMachine();
  drawCustomer();
  drawGary();

  // Update logic
  updateGary();
  renderUI();

  requestAnimationFrame(gameLoop);
}

document.getElementById("spawnBtn").addEventListener("click", spawnCustomer);
document.getElementById("resetBtn").addEventListener("click", resetGame);

gameLoop();
