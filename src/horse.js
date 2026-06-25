import * as THREE from 'three';
import { getTerrainHeight } from './terrain.js';
import { resolveCollision } from './collision.js';

// ── Farger ───────────────────────────────────────────────────────────────────
const COATS = [
  { body: 0xb8860b, mane: 0x3d1f00 }, // Gulbrun
  { body: 0x3d1f00, mane: 0x1a0800 }, // Mørkebrun
  { body: 0x888880, mane: 0x444440 }, // Grå
  { body: 0xf5f0e0, mane: 0xd4c890 }, // Hvit/skimmel
  { body: 0x7a3b10, mane: 0x2a1000 }, // Rødskimmel
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const MAT  = c => new THREE.MeshLambertMaterial({ color: c });
const CAPS = (r, h, m)    => new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 8, 14), m);
const SPH  = (r, m)       => new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m);
const CYL  = (r1, r2, h, m) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 10), m);

// ── Heste-modell ──────────────────────────────────────────────────────────────
function buildHorse(coat) {
  const BM = MAT(coat.body);
  const MM = MAT(coat.mane);
  const HM = MAT(0x111111);      // hov
  const EM = MAT(0x0d0d0d);      // øye
  const WM = MAT(0xffffff);      // øyehvit
  const NM = MAT(coat.body);

  const root = new THREE.Group();
  // Hele modellen roteres -90° rundt Y slik at "fremover" er lokal +Z
  // (modellen er modellert i +X-retning, men bevegelseskoden bruker +Z)
  const body = new THREE.Group();
  body.rotation.y = -Math.PI / 2;
  root.add(body);

  // ── Kropp ──
  const torso = CAPS(0.4, 1.05, BM);
  torso.rotation.z = Math.PI / 2;
  torso.position.set(0, 1.05, 0);
  body.add(torso);

  // Skulderparti (litt høyere foran)
  const shoulder = SPH(0.36, BM);
  shoulder.scale.set(0.7, 0.9, 0.85);
  shoulder.position.set(0.6, 1.15, 0);
  body.add(shoulder);

  // Rumpe
  const rump = SPH(0.34, BM);
  rump.scale.set(0.7, 0.88, 0.88);
  rump.position.set(-0.58, 1.0, 0);
  body.add(rump);

  // ── Hals ──
  const neckGrp = new THREE.Group();
  neckGrp.position.set(0.62, 1.2, 0);
  neckGrp.rotation.z = -0.65;
  const neck = CAPS(0.155, 0.5, BM);
  neckGrp.add(neck);
  body.add(neckGrp);

  // ── Hode-gruppe (brukt for animasjon) ──
  const headGrp = new THREE.Group();
  headGrp.position.set(0.95, 1.7, 0);
  headGrp.rotation.z = 0.18;

  // Hodeskalle
  const skull = SPH(0.215, BM);
  skull.scale.set(1.1, 1.0, 0.92);
  headGrp.add(skull);

  // Snute
  const snout = CAPS(0.11, 0.26, BM);
  snout.rotation.z = Math.PI / 2;
  snout.position.set(0.27, -0.06, 0);
  headGrp.add(snout);

  // Nesebor
  [-0.07, 0.07].forEach(z => {
    const n = SPH(0.032, MAT(0x2a0500));
    n.position.set(0.37, -0.09, z);
    headGrp.add(n);
  });

  // Øyne
  [-0.145, 0.145].forEach(z => {
    const ew = SPH(0.055, WM); ew.position.set(0.14, 0.09, z); headGrp.add(ew);
    const ep = SPH(0.035, EM); ep.position.set(0.185, 0.09, z); headGrp.add(ep);
    // Refleks
    const er = SPH(0.012, WM); er.position.set(0.205, 0.1, z + 0.02); headGrp.add(er);
  });

  // Ører
  [-0.135, 0.135].forEach(z => {
    const ear = CYL(0.03, 0.05, 0.17, BM);
    ear.position.set(-0.05, 0.3, z);
    ear.rotation.z = z > 0 ? -0.3 : 0.3;
    ear.rotation.x = 0.15;
    headGrp.add(ear);
    const earInner = CYL(0.015, 0.03, 0.12, MAT(0xd48060));
    earInner.position.set(-0.04, 0.3, z);
    earInner.rotation.z = z > 0 ? -0.3 : 0.3;
    earInner.rotation.x = 0.15;
    headGrp.add(earInner);
  });

  body.add(headGrp);

  // ── Manke ──
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const m = SPH(0.075 - t * 0.02, MM);
    m.position.set(0.72 - t * 0.85, 1.56 - t * 0.07, 0.04 * (i % 2 === 0 ? 1 : -1));
    body.add(m);
  }

  // ── Hale ──
  const tailGrp = new THREE.Group();
  tailGrp.position.set(-0.65, 1.0, 0);
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const seg = CAPS(0.04 - t * 0.012, 0.2, MM);
    seg.position.set(-t * 0.18, -t * 0.28, (Math.sin(t * 2.5) * 0.07));
    seg.rotation.z = 0.5 + t * 0.25;
    tailGrp.add(seg);
  }
  body.add(tailGrp);

  // ── Ben ──  (lokal +X = fremover i kroppens koordinatsystem)
  const legDefs = [
    { name: 'frontL', lx:  0.52, lz:  0.22 },
    { name: 'frontR', lx:  0.52, lz: -0.22 },
    { name: 'backL',  lx: -0.48, lz:  0.22 },
    { name: 'backR',  lx: -0.48, lz: -0.22 },
  ];

  const legs = {};
  legDefs.forEach(({ name, lx, lz }) => {
    const grp = new THREE.Group();
    grp.position.set(lx, 0.88, lz);

    // Overben
    const upper = CAPS(0.092, 0.32, BM); upper.position.y = -0.16; grp.add(upper);
    // Kne
    const knee  = SPH(0.09, BM); knee.position.y = -0.34; grp.add(knee);
    // Underben
    const lower = CAPS(0.072, 0.3, BM); lower.position.y = -0.52; grp.add(lower);
    // Kode (lavt ledd)
    const fetlock = SPH(0.075, BM); fetlock.position.y = -0.7; grp.add(fetlock);
    // Hov
    const hoof = CYL(0.08, 0.09, 0.12, HM); hoof.position.y = -0.82; grp.add(hoof);

    body.add(grp);
    legs[name] = grp;
  });

  root.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return { root, body, headGrp, tailGrp, legs };
}

// ── Tilstander ────────────────────────────────────────────────────────────────
export const STATE = { GRAZE:'graze', WANDER:'wander', FLEE:'flee', CAUGHT:'caught', TAMED:'tamed' };

const WALK_SPEED  = 1.6;
const TROT_SPEED  = 3.0;
const FLEE_SPEED  = 7.0;
const TURN_RATE   = 1.8;   // rad/s sving

// ── Opprett hest ─────────────────────────────────────────────────────────────
export function createHorse(scene, sx, sz) {
  const coat = COATS[Math.floor(Math.random() * COATS.length)];
  const { root, body, headGrp, tailGrp, legs } = buildHorse(coat);
  const gh = getTerrainHeight(sx, sz);
  root.position.set(sx, gh, sz);
  scene.add(root);

  return {
    root, headGrp, tailGrp, legs,
    pos:        new THREE.Vector3(sx, gh, sz),
    facingYaw:  Math.random() * Math.PI * 2,
    target:     new THREE.Vector3(sx, gh, sz),
    state:      STATE.GRAZE,
    stateTimer: 3 + Math.random() * 5,
    tameProgress: 0,
    isTamed:    false,
    lassoed:    false,
    _justTamed: false,
    _animT:     0,
    flockMates: [],
  };
}

// ── Opprett flokk ────────────────────────────────────────────────────────────
export function createHerd(scene, cx, cz, size) {
  const herd = [];
  for (let i = 0; i < size; i++) {
    const a = (i / size) * Math.PI * 2;
    const r = 2 + Math.random() * 3;
    herd.push(createHorse(scene, cx + Math.cos(a) * r, cz + Math.sin(a) * r));
  }
  herd.forEach(h => { h.flockMates = herd.filter(m => m !== h); });
  return herd;
}

// ── Oppdater hest ─────────────────────────────────────────────────────────────
export function updateHorse(horse, delta, playerPos, playerLassoing) {
  horse._animT += delta;

  if (horse.isTamed) { updateTamed(horse, delta, playerPos); return; }

  const distPlayer = horse.pos.distanceTo(playerPos);

  switch (horse.state) {

    case STATE.GRAZE:
      horse.stateTimer -= delta;
      animGraze(horse);
      if (distPlayer < 8 && !playerLassoing) startFlee(horse);
      else if (horse.stateTimer <= 0) {
        horse.state = STATE.WANDER;
        horse.stateTimer = 10 + Math.random() * 12;
        pickTarget(horse, false);
      }
      break;

    case STATE.WANDER:
      horse.stateTimer -= delta;
      stepForward(horse, delta, WALK_SPEED);
      animWalk(horse, WALK_SPEED);
      if (distPlayer < 8 && !playerLassoing) startFlee(horse);
      else if (horse.pos.distanceTo(horse.target) < 1.2 || horse.stateTimer <= 0) {
        horse.state = STATE.GRAZE;
        horse.stateTimer = 4 + Math.random() * 7;
      }
      break;

    case STATE.FLEE:
      stepForward(horse, delta, FLEE_SPEED);
      animWalk(horse, FLEE_SPEED);
      if (horse.pos.distanceTo(horse.target) < 2) {
        if (distPlayer > 18) { horse.state = STATE.GRAZE; horse.stateTimer = 4; }
        else pickTarget(horse, true);
      }
      break;

    case STATE.CAUGHT:
      horse.tameProgress = Math.min(horse.tameProgress + delta * 0.13, 1);
      // Beveg sakte mot spiller
      {
        const tx = playerPos.x - horse.pos.x, tz = playerPos.z - horse.pos.z;
        const td = Math.sqrt(tx*tx + tz*tz);
        if (td > 2.5) {
          turnToward(horse, Math.atan2(tx, tz), delta, TURN_RATE * 0.4);
          stepForward(horse, delta, WALK_SPEED * 0.5);
        }
      }
      animWalk(horse, WALK_SPEED * 0.5);
      // Risting som avtar
      horse.root.rotation.z = Math.sin(horse._animT * 11) * (1 - horse.tameProgress) * 0.07;
      if (horse.tameProgress >= 1) {
        horse.root.rotation.z = 0;
        horse.isTamed = true;
        horse.state   = STATE.TAMED;
      }
      break;
  }

  // Kollisjon + terreng
  resolveCollision(horse.pos, 0.5);
  horse.pos.x = Math.max(-27, Math.min(27, horse.pos.x));
  horse.pos.z = Math.max(-27, Math.min(27, horse.pos.z));
  const gh = getTerrainHeight(horse.pos.x, horse.pos.z);
  horse.root.position.set(horse.pos.x, gh, horse.pos.z);
  horse.root.rotation.y = horse.facingYaw;
}

// Beveg KUN fremover — hesten snur seg først, så beveger seg
function stepForward(horse, delta, speed) {
  const tx = horse.target.x - horse.pos.x;
  const tz = horse.target.z - horse.pos.z;
  const dist = Math.sqrt(tx*tx + tz*tz);
  if (dist < 0.5) return;

  const targetYaw = Math.atan2(tx, tz);
  turnToward(horse, targetYaw, delta, TURN_RATE);

  // Kun fremover-komponent — 0 hvis hesten peker feil vei
  const diff = yawDiff(targetYaw, horse.facingYaw);
  const fwd  = Math.max(0, Math.cos(diff)); // 1 = rett frem, 0 = 90° til siden
  horse.pos.x += Math.sin(horse.facingYaw) * speed * fwd * delta;
  horse.pos.z += Math.cos(horse.facingYaw) * speed * fwd * delta;
}

function turnToward(horse, targetYaw, delta, rate) {
  const diff = yawDiff(targetYaw, horse.facingYaw);
  const step = Math.min(Math.abs(diff), rate * delta) * Math.sign(diff);
  horse.facingYaw += step;
}

function yawDiff(a, b) {
  let d = a - b;
  while (d >  Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function pickTarget(horse, fleeing) {
  // Nytt mål rett fremfor (± litt vinkel) — aldri rett til siden
  const spread = fleeing ? 0.6 : 1.2;
  const dist   = fleeing ? 14 + Math.random() * 8 : 5 + Math.random() * 8;
  const angle  = horse.facingYaw + (Math.random() - 0.5) * spread;
  horse.target.set(
    Math.max(-26, Math.min(26, horse.pos.x + Math.sin(angle) * dist)),
    0,
    Math.max(-26, Math.min(26, horse.pos.z + Math.cos(angle) * dist))
  );
  horse.target.y = getTerrainHeight(horse.target.x, horse.target.z);
}

function startFlee(horse) {
  horse.state = STATE.FLEE;
  horse.facingYaw += Math.PI + (Math.random() - 0.5) * 0.7;
  pickTarget(horse, true);
  horse.flockMates.forEach(m => {
    if (!m.isTamed && m.state !== STATE.FLEE) {
      m.state = STATE.FLEE;
      m.facingYaw = horse.facingYaw + (Math.random() - 0.5) * 0.5;
      pickTarget(m, true);
    }
  });
}

function updateTamed(horse, delta, playerPos) {
  const dx = playerPos.x - horse.pos.x, dz = playerPos.z - horse.pos.z;
  const dist = Math.sqrt(dx*dx + dz*dz);
  if (dist > 4) {
    const spd = dist > 10 ? TROT_SPEED : WALK_SPEED;
    turnToward(horse, Math.atan2(dx, dz), delta, TURN_RATE);
    horse.pos.x += Math.sin(horse.facingYaw) * spd * delta;
    horse.pos.z += Math.cos(horse.facingYaw) * spd * delta;
    resolveCollision(horse.pos, 0.5);
    animWalk(horse, spd);
  } else {
    animGraze(horse);
  }
  const gh = getTerrainHeight(horse.pos.x, horse.pos.z);
  horse.root.position.set(horse.pos.x, gh, horse.pos.z);
  horse.root.rotation.y = horse.facingYaw;
}

// ── Animasjonar ───────────────────────────────────────────────────────────────
function animWalk(horse, speed) {
  const t = horse._animT * speed * 1.5;
  // Diagonal gange: FL+BR svinger frem, FR+BL svinger tilbake
  horse.legs.frontL.rotation.x =  Math.sin(t) * 0.55;
  horse.legs.frontR.rotation.x = -Math.sin(t) * 0.55;
  horse.legs.backL.rotation.x  = -Math.sin(t) * 0.55;
  horse.legs.backR.rotation.x  =  Math.sin(t) * 0.55;
  // Hodet nicker svakt
  horse.headGrp.rotation.z = 0.18 + Math.sin(t * 0.8) * 0.05;
  // Halen svaier
  horse.tailGrp.rotation.z = Math.sin(horse._animT * 1.4) * 0.18;
  // Kropp bopper veldig lett
  const gh = getTerrainHeight(horse.pos.x, horse.pos.z);
  horse.root.position.y = gh + Math.abs(Math.sin(t * 2)) * 0.022;
}

function animGraze(horse) {
  // Hode ned og nicker sakte mens den spiser
  horse.headGrp.rotation.z = 0.6 + Math.sin(horse._animT * 0.8) * 0.2;
  horse.legs.frontL.rotation.x = 0;
  horse.legs.frontR.rotation.x = 0;
  horse.legs.backL.rotation.x  = 0;
  horse.legs.backR.rotation.x  = 0;
  horse.tailGrp.rotation.z = Math.sin(horse._animT * 0.9) * 0.12;
}

// ── Lasso ─────────────────────────────────────────────────────────────────────
export function createLasso(scene) {
  const pts = Array.from({ length: 21 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5);
  });
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xc8a050, linewidth: 2 })
  );
  line.visible = false;
  scene.add(line);
  return line;
}

export function throwLasso(mesh, from, to, onLand) {
  mesh.visible = true;
  const a = new THREE.Vector3(from.x, from.y + 1.3, from.z);
  const b = new THREE.Vector3(to.x,   to.y   + 1.2, to.z);
  const t0 = performance.now(), dur = 550;
  const tick = () => {
    const t = Math.min((performance.now() - t0) / dur, 1);
    mesh.position.lerpVectors(a, b, t);
    mesh.position.y += Math.sin(t * Math.PI) * 2.0;
    mesh.scale.setScalar(0.5 + t * 0.9);
    mesh.rotation.y += 0.18;
    if (t < 1) requestAnimationFrame(tick);
    else {
      setTimeout(() => { mesh.visible = false; mesh.scale.setScalar(1); }, 350);
      onLand();
    }
  };
  requestAnimationFrame(tick);
}
