import * as THREE from 'three';
import { LOCATIONS } from './locations.js';
import { gameState, initGame, addXP, generateTasks } from './gameState.js';
import { buildWorld, interactables } from './world.js';
import { loadTextures } from './textures.js';
import { getTerrainHeight } from './terrain.js';
import { createPlayer, animatePlayer, updateOutfit } from './player.js';
import { startInteraction, isInteracting, updateInteraction } from './interaction.js';
import { spawnParticles, updateParticles } from './particles.js';
import { damagedHouseParts, resources } from './world.js';
import { resolveCollision } from './collision.js';
import { createHerd, updateHorse, createLasso, throwLasso, STATE } from './horse.js';

loadTextures();

// --- Renderer ---
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Scene & kamera ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// --- Spillerposisjon og kameravinkler ---
const playerPos = new THREE.Vector3(0, 0, 5);
let camYaw   = 0;    // venstre/høyre
let camPitch = 0.35; // opp/ned (radianer)
let camDist  = 5;    // avstand bak spilleren
const PITCH_MIN = 0.08, PITCH_MAX = 1.1;

// --- Musbevegelse: høyreklikk-dra roterer kamera, venstreklikk låser peker ---
let pointerLocked = false;
let dragRotating  = false;
let lastDragX = 0, lastDragY = 0;

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
  crosshairEl.style.opacity = pointerLocked ? '1' : '0.4';
});

// Venstreklikk = pointer lock (frivillig, for mer presis styring)
canvas.addEventListener('click', e => {
  if (e.button === 0 && gameState.screen === 'game') canvas.requestPointerLock();
});

// Høyreklikk-dra = roter kamera (fungerer uten pointer lock)
canvas.addEventListener('mousedown', e => {
  if (e.button === 2 && gameState.screen === 'game') {
    dragRotating = true;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    e.preventDefault();
  }
});
window.addEventListener('mouseup', e => {
  if (e.button === 2) dragRotating = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('mousemove', e => {
  if (gameState.screen !== 'game') return;
  if (pointerLocked) {
    // Pointer-lock: veldig presis
    camYaw   -= e.movementX * 0.002;
    camPitch -= e.movementY * 0.002;
    camPitch  = Math.max(PITCH_MIN, Math.min(PITCH_MAX, camPitch));
  } else if (dragRotating) {
    // Høyreklikk-dra: roter kamera
    const dx = e.clientX - lastDragX;
    const dy = e.clientY - lastDragY;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    camYaw   -= dx * 0.005;
    camPitch -= dy * 0.005;
    camPitch  = Math.max(PITCH_MIN, Math.min(PITCH_MAX, camPitch));
  }
});

// Scroll = zoom
canvas.addEventListener('wheel', e => {
  camDist = Math.max(2, Math.min(12, camDist + e.deltaY * 0.01));
  e.preventDefault();
}, { passive: false });

// --- Tastatur ---
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyE') tryInteract();
  if (e.code === 'KeyL') tryLasso();
  if (e.code === 'Escape') document.exitPointerLock();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// --- Spillerfigur ---
let playerObj = null;

// --- Hester ---
let horses = [];
let lassoMesh = null;
let lassoTarget = null;
let lassoFlying = false;
const LASSO_RANGE = 7;

// Taming progress UI
const tameBarEl = document.createElement('div');
tameBarEl.style.cssText = `
  position:fixed;bottom:160px;left:50%;transform:translateX(-50%);
  background:rgba(0,0,0,0.75);border:1.5px solid #c8a050;border-radius:8px;
  padding:8px 18px;display:none;pointer-events:none;text-align:center;
  font-family:Georgia,serif;color:#fff;min-width:200px;
`;
tameBarEl.innerHTML = `<div style="font-size:13px;margin-bottom:5px;">🐴 Temmer hesten...</div>
  <div style="background:#333;border-radius:4px;height:10px;width:180px;">
    <div id="tame-fill" style="background:#c8a050;height:10px;border-radius:4px;width:0%;transition:width 0.2s;"></div>
  </div>`;
document.body.appendChild(tameBarEl);

// --- Fysikk ---
let velY = 0;
let onGround = true;
const GRAVITY    = -22;
const JUMP_SPEED = 8;
const MOVE_SPEED = 5;

// --- UI ---
const menuEl       = document.getElementById('menu');
const locSelectEl  = document.getElementById('location-select');
const hudEl        = document.getElementById('hud');
const tasksPanelEl = document.getElementById('tasks-panel');
const crosshairEl  = document.getElementById('crosshair');
const lockMsgEl    = document.getElementById('lock-msg');
const taskListEl   = document.getElementById('task-list');
const nextDayBtn   = document.getElementById('next-day-btn');
const dayLabel     = document.getElementById('day-label');

// Interaksjons-prompt
const promptEl = document.createElement('div');
promptEl.style.cssText = `
  position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
  background:rgba(0,0,0,0.78);color:#fff;padding:10px 22px;
  border-radius:8px;font-size:16px;font-family:Georgia,serif;
  border:1.5px solid #f5c842;display:none;pointer-events:none;text-align:center;
`;
document.body.appendChild(promptEl);

const feedbackEl = document.createElement('div');
feedbackEl.style.cssText = `
  position:fixed;bottom:140px;left:50%;transform:translateX(-50%);
  background:rgba(20,80,20,0.92);color:#fff;padding:10px 24px;
  border-radius:8px;font-size:15px;font-family:Georgia,serif;
  border:1.5px solid #5cb85c;display:none;pointer-events:none;text-align:center;
`;
document.body.appendChild(feedbackEl);
let feedbackTimer = null;
function showFeedback(msg) {
  feedbackEl.textContent = msg;
  feedbackEl.style.display = 'block';
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { feedbackEl.style.display = 'none'; }, 2500);
}

// --- Meny ---
document.getElementById('start-btn').addEventListener('click', () => {
  menuEl.style.display = 'none';
  locSelectEl.style.display = 'flex';
  buildLocationCards();
});

function buildLocationCards() {
  const grid = document.getElementById('loc-grid');
  grid.innerHTML = '';
  const diffColor = { 'Lett':'#5cb85c','Middels':'#f0ad4e','Vanskelig':'#d9534f','Ekspert':'#9b59b6' };
  LOCATIONS.forEach(loc => {
    const card = document.createElement('div');
    card.className = 'loc-card';
    card.innerHTML = `
      <div class="loc-emoji">${loc.emoji}</div>
      <div class="loc-name">${loc.name}</div>
      <div class="loc-diff" style="color:${diffColor[loc.difficulty]}">${loc.difficulty}</div>
      <div class="loc-desc">${loc.description}</div>`;
    card.addEventListener('click', () => startGame(loc));
    grid.appendChild(card);
  });
}

function startGame(loc) {
  locSelectEl.style.display = 'none';
  initGame(loc);
  buildWorld(scene, loc);

  // Spillerfigur
  if (playerObj) scene.remove(playerObj.root);
  playerObj = createPlayer(scene);
  playerPos.set(0, 0, 5);
  velY = 0;

  // Fjern gamle hester
  horses.forEach(h => scene.remove(h.root));
  horses = [];

  // Spawn 2 flokker langt fra huset (som er på 0, -8)
  const herdCenters = [[-20, 15], [18, 14]];
  herdCenters.forEach(([cx, cz]) => {
    const herd = createHerd(scene, cx, cz, 3 + Math.floor(Math.random() * 3));
    horses.push(...herd);
  });

  // Lasso-loop
  if (lassoMesh) scene.remove(lassoMesh);
  lassoMesh = createLasso(scene);

  showGameUI();
  lockMsgEl.style.display = 'block';
  setTimeout(() => { lockMsgEl.style.display = 'none'; }, 4000);
}

function showGameUI() {
  hudEl.style.display = 'block';
  tasksPanelEl.style.display = 'block';
  crosshairEl.style.display = 'none'; // ikke førsteperson lenger
  updateHUD();
  renderTasks();
}

function updateHUD() {
  document.getElementById('gold-val').textContent = gameState.player.gold;
  document.getElementById('food-val').textContent = gameState.player.food;
  document.getElementById('xp-val').textContent   = gameState.player.xp;
  document.getElementById('rank-label').textContent = `${gameState.player.rank} (Niv. ${gameState.player.level})`;
  dayLabel.textContent = `Dag ${gameState.day}`;
}

function renderTasks() {
  taskListEl.innerHTML = '';
  gameState.tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = 'task-item' + (task.done ? ' done' : '');
    div.innerHTML = `
      <div class="${task.done ? 'task-done-name' : 'task-name'}">${task.emoji} ${task.done ? '✓ ' : ''}${task.name}</div>
      <div class="task-reward">${task.done ? 'Fullført!' : task.hint}</div>`;
    taskListEl.appendChild(div);
  });
}

nextDayBtn.addEventListener('click', () => {
  gameState.day++;
  gameState.tasks = generateTasks();
  gameState.player.food = Math.max(0, gameState.player.food - 2);
  buildWorld(scene, gameState.location);
  if (playerObj) scene.remove(playerObj.root);
  playerObj = createPlayer(scene);
  updateHUD();
  renderTasks();
});

// --- Nærhet og interaksjon ---
let nearbyTask = null;
const INTERACT_DIST = 2.8;

function updateHorseProximityHint(pVec) {
  let nearest = null, nearestDist = LASSO_RANGE;
  horses.forEach(h => {
    if (h.isTamed) return;
    const d = pVec.distanceTo(h.pos);
    if (d < nearestDist) { nearestDist = d; nearest = h; }
  });
  if (nearest && !lassoFlying && !isInteracting()) {
    promptEl.innerHTML = `<b>[L]</b> Kast lasso 🤠 (${Math.round(nearestDist * 10) / 10}m unna)`;
    promptEl.style.display = 'block';
  }
}

function checkProximity() {
  if (isInteracting()) return;
  nearbyTask = null;
  let closest = INTERACT_DIST;

  for (const obj of interactables) {
    if (obj.collected) continue;
    // Trestammer
    if (obj.taskId === 'tre') {
      const dx = playerPos.x - obj.pos.x;
      const dz = playerPos.z - obj.pos.z;
      if (Math.sqrt(dx*dx + dz*dz) < closest) {
        closest = Math.sqrt(dx*dx + dz*dz);
        nearbyTask = { id: 'tre', taskId: 'tre', name: 'Samle trestokker', pos: obj.pos };
      }
      continue;
    }
    const task = gameState.tasks.find(t => t.id === obj.taskId);
    if (!task || task.done) continue;
    const dx = playerPos.x - obj.pos.x;
    const dz = playerPos.z - obj.pos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < closest) { closest = dist; nearbyTask = task; }
  }

  if (nearbyTask) {
    const label = nearbyTask.id === 'tre'
      ? `<b>[E]</b> Samle trestokker 🪵 (har: ${resources.wood})`
      : `<b>[E]</b> ${nearbyTask.name}`;
    promptEl.innerHTML = label;
    promptEl.style.display = 'block';
  } else {
    promptEl.style.display = 'none';
  }
}

// Partikkeleffekter per oppgave
function fireParticles(taskId) {
  const pos = interactables.find(o => o.taskId === taskId)?.pos;
  if (!pos) return;
  const gh = getTerrainHeight(pos.x, pos.z);
  const configs = {
    ved:      { color: 0x8B4513, count: 10, speed: 3.5, size: 0.14, gravity: -9 },
    vann:     { color: 0x4fc3f7, count: 12, speed: 2.5, size: 0.10, gravity: -5 },
    hage:     { color: 0x5c3318, count: 14, speed: 2.0, size: 0.09, gravity: -7, spread: 0.6 },
    mat:      { color: 0xdddddd, count: 8,  speed: 1.5, size: 0.08, gravity: -3 },
    reparere: { color: 0xc8a96e, count: 10, speed: 3.0, size: 0.12, gravity: -8 },
    tre:      { color: 0x5c3d1e, count: 12, speed: 3.0, size: 0.13, gravity: -9 },
  };
  const cfg = configs[taskId] || {};
  spawnParticles(scene, pos.x, gh + 1.0, pos.z, cfg);
}

function tryLasso() {
  if (lassoFlying || !horses.length) return;

  // Finn nærmeste ville hest innenfor rekkevidde
  let closest = null, closestDist = LASSO_RANGE;
  horses.forEach(h => {
    if (h.isTamed) return;
    const dx = playerPos.x - h.pos.x;
    const dz = playerPos.z - h.pos.z;
    const d = Math.sqrt(dx*dx + dz*dz);
    if (d < closestDist) { closestDist = d; closest = h; }
  });

  if (!closest) {
    showFeedback('🤠 Ingen hest innen rekkevidde for lasso!');
    return;
  }

  lassoFlying = true;
  lassoTarget = closest;
  showFeedback('🤠 Lasso kastet!');

  throwLasso(lassoMesh, playerPos.clone(), closest.pos.clone(), () => {
    lassoFlying = false;
    if (!lassoTarget) return;
    const dx = playerPos.x - lassoTarget.pos.x;
    const dz = playerPos.z - lassoTarget.pos.z;
    const d = Math.sqrt(dx*dx + dz*dz);
    if (d < LASSO_RANGE + 1) {
      lassoTarget.lassoed = true;
      lassoTarget.state = STATE.CAUGHT;
      lassoTarget.target.copy(playerPos);
      showFeedback('🐴 Hesten er fanget! Hold deg nær for å temme den.');
    } else {
      showFeedback('😅 Hesten løp for fort — prøv igjen!');
      lassoTarget = null;
    }
  });
}

function tryInteract() {
  if (!nearbyTask) return;
  if (isInteracting()) return;
  if (nearbyTask.done) return;

  startInteraction(nearbyTask.id || nearbyTask.taskId, playerObj, fireParticles);
}

function completeTask(taskId) {
  // Ressurs-samling (tre)
  if (taskId === 'tre') {
    resources.wood += 2;
    showFeedback(`🪵 Du samlet tre! (${resources.wood} stokker)`);
    // Fjern nærmeste tre-interaktabel
    const idx = interactables.findIndex(o => o.taskId === 'tre' && !o.collected);
    if (idx !== -1) {
      interactables[idx].collected = true;
      if (interactables[idx].mesh) interactables[idx].mesh.visible = false;
    }
    updateHUD();
    return;
  }

  const task = gameState.tasks.find(t => t.id === taskId);
  if (!task || task.done) return;

  // Reparere krever tre
  if (taskId === 'reparere' && resources.wood < 3) {
    showFeedback('⚠️ Du trenger minst 3 trestokker! Samle tre først.');
    return;
  }

  task.done = true;
  gameState.player.gold += task.gold;
  gameState.player.food += Math.floor(task.xp / 10);
  addXP(task.xp);

  const msgs = {
    ved:      `🪵 Du hugget ved! +${task.xp} XP`,
    vann:     `💧 Du hentet vann! +${task.xp} XP`,
    hage:     `🥕 Du plantet grønnsaker! +${task.xp} XP`,
    mat:      `🍲 Du lagde mat! +${task.xp} XP`,
    reparere: `🔨 Du reparerte hjemmet! +${task.xp} XP`,
  };
  showFeedback(msgs[taskId] || `✓ ${task.name} fullført!`);

  // Reparere: fjern skade fra huset
  if (taskId === 'reparere') {
    resources.wood -= 3;
    damagedHouseParts.forEach(p => {
      // Sakte fade ut skadet del
      if (p.material) {
        p.material.transparent = true;
        const fade = () => {
          p.material.opacity -= 0.05;
          if (p.material.opacity > 0) setTimeout(fade, 30);
          else scene.remove(p);
        };
        fade();
      } else {
        scene.remove(p);
      }
    });
    damagedHouseParts.length = 0;
    setTimeout(() => {
      // Legg til det fine huset etter at skaden er borte
      import('./world.js').then(({ buildWorld }) => {
        // Bare legg til nytt hus, ikke bygg hele verden på nytt
        import('./textures.js').then(({ textures }) => {
          import('./terrain.js').then(({ getTerrainHeight }) => {
            showFeedback('🏠 Hjemmet er reparert!');
          });
        });
      });
      showFeedback('🏠 Hjemmet er reparert!');
    }, 1500);
  }

  const obj = interactables.find(o => o.taskId === taskId);
  if (obj?.mesh) obj.mesh.visible = false;

  if (playerObj) updateOutfit(playerObj, gameState.player.level);
  updateHUD();
  renderTasks();
}

// --- Spilløkke ---
const clock = new THREE.Clock();
let moving = false;
let playerFacingYaw = 0; // retningen karakteren peker

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;

  if (gameState.screen === 'game' && playerObj) {
    // Bevegelsesretning relativt til kamera-yaw
    const moveDir = new THREE.Vector2(0, 0);
    if (keys['KeyW'] || keys['ArrowUp'])    moveDir.y -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  moveDir.y += 1;
    if (keys['KeyA'] || keys['ArrowLeft'])  moveDir.x -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.x += 1;

    moving = moveDir.lengthSq() > 0;

    if (moving) {
      moveDir.normalize();
      // Roter bevegelse etter kamera-yaw
      const worldX = moveDir.x * Math.cos(camYaw) + moveDir.y * Math.sin(camYaw);
      const worldZ = moveDir.x * -Math.sin(camYaw) + moveDir.y * Math.cos(camYaw);
      playerPos.x += worldX * MOVE_SPEED * delta;
      playerPos.z += worldZ * MOVE_SPEED * delta;

      // Karakteren snur seg dit han går (smidig)
      const targetYaw = Math.atan2(worldX, worldZ);
      let diff = targetYaw - playerFacingYaw;
      while (diff > Math.PI)  diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      playerFacingYaw += diff * Math.min(1, 12 * delta);
    }

    // Grenser
    playerPos.x = Math.max(-28, Math.min(28, playerPos.x));
    playerPos.z = Math.max(-28, Math.min(28, playerPos.z));

    // Kollisjon mot vegger og trær
    resolveCollision(playerPos);

    // Tyngdekraft + terreng-kollisjon
    velY += GRAVITY * delta;
    playerPos.y += velY * delta;
    const gh = getTerrainHeight(playerPos.x, playerPos.z);
    if (playerPos.y <= gh) {
      playerPos.y = gh;
      velY = 0;
      onGround = true;
    }

    // Hopp
    if (keys['Space'] && onGround) {
      velY = JUMP_SPEED;
      onGround = false;
    }

    // Oppdater spillerfigur
    playerObj.root.position.set(playerPos.x, playerPos.y, playerPos.z);
    playerObj.root.rotation.y = playerFacingYaw;

    // Interaksjons-animasjon
    const finishedTask = updateInteraction(delta);
    if (finishedTask) completeTask(finishedTask);

    animatePlayer(playerObj, moving && !isInteracting(), t);
    updateParticles(delta);

    // Oppdater hester
    const pVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    horses.forEach(h => {
      updateHorse(h, delta, pVec, lassoFlying);

      // Oppdater lasso-mål mot spillerposisjon
      if (h.lassoed && !h.isTamed) {
        h.target.set(playerPos.x, playerPos.y, playerPos.z);
      }

      // Taming progress UI
      if (h.state === STATE.CAUGHT) {
        tameBarEl.style.display = 'block';
        document.getElementById('tame-fill').style.width = `${h.tameProgress * 100}%`;
      }
    });

    // Sjekk om noen hest nettopp ble temmet
    horses.forEach(h => {
      if (h.isTamed && h._justTamed !== true) {
        h._justTamed = true;
        tameBarEl.style.display = 'none';
        gameState.player.horses = (gameState.player.horses || 0) + 1;
        addXP(80);
        updateHUD();
        showFeedback('🐴 Hesten er temmet! Den følger deg nå. +80 XP');
      }
    });

    // Skjul tame-bar hvis ingen hest temmes
    if (!horses.some(h => h.state === STATE.CAUGHT)) {
      tameBarEl.style.display = 'none';
    }

    // Nærmeste ville hest i hud
    updateHorseProximityHint(pVec);

    // Tredjeperson-kamera
    const camOffset = new THREE.Vector3(
      Math.sin(camYaw) * Math.cos(camPitch) * camDist,
      Math.sin(camPitch) * camDist + 1.2,
      Math.cos(camYaw) * Math.cos(camPitch) * camDist,
    );
    const targetCamPos = new THREE.Vector3(
      playerPos.x + camOffset.x,
      playerPos.y + camOffset.y,
      playerPos.z + camOffset.z,
    );
    camera.position.lerp(targetCamPos, 0.12);
    camera.lookAt(playerPos.x, playerPos.y + 1.2, playerPos.z);

    checkProximity();
  }

  renderer.render(scene, camera);
}

animate();
