# Eatventure‑lite Starter

Mobile-first HTML5 prototype with tap-to-earn and a single upgrade. Works on desktop (mouse) and phones (touch) using **Pointer Events**.

## Files
- `index.html` — layout + mobile viewport
- `main.js` — game logic (coins, per-tap, upgrade, basic canvas scene)

## Run locally (fastest)
1. Install VS Code + the **Live Server** extension.
2. Open this folder in VS Code.
3. Right-click `index.html` → **Open with Live Server**.
4. On your phone (same Wi‑Fi), open `http://<your-PC-LAN-IP>:<port>`.

## Deploy (GitHub Pages quick steps)
1. Create a GitHub repo and upload these files to the root.
2. On GitHub: **Settings → Pages → Source: `Deploy from a branch` → Branch: `main` (root)**.
3. Wait 1–2 minutes. Open the URL GitHub shows (it ends with `github.io/<repo>`).

## Controls
- Tap/click the canvas or **TAP TO SERVE** button to earn coins.
- Press **Upgrade** to increase coins-per-tap (cost scales).
- Auto-saves every 5s to `localStorage`.

## Next steps (when ready)
- Add **auto-workers** (idle income).
- Add a second upgrade (speed or capacity).
- Daily bonus + simple milestones for retention.
- Sound FX after first user gesture (mobile audio policy).
- Balance goals: 5–10 upgrades in first minute; 3–5 new stages in first session.
