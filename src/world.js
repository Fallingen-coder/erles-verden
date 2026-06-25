import * as THREE from 'three';
import { textures } from './textures.js';
import { createTerrain, getTerrainHeight } from './terrain.js';
import { createSky } from './sky.js';
import { clearColliders, addBoxCollider, addCylinderCollider } from './collision.js';

export const interactables = [];
export let damagedHouseParts = []; // skadede deler som fjernes ved reparasjon
export const resources = { wood: 0, stone: 0 };

function mat(texture, repeat = 1) {
  const t = texture.clone();
  t.repeat.set(repeat, repeat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return new THREE.MeshLambertMaterial({ map: t });
}

function box(scene, w, h, d, material, x, y, z, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// --- Realistiske trær ---
function addTree(scene, x, z) {
  const gh = getTerrainHeight(x, z);
  const isPine = Math.random() > 0.45; // 55% bartrær, 45% løvtrær
  isPine ? addPineTree(scene, x, z, gh) : addDecidousTree(scene, x, z, gh);
  addCylinderCollider(x, z, 0.45);
}

function addPineTree(scene, x, z, gh) {
  const h = 5 + Math.random() * 4;
  const trunkR = 0.13 + Math.random() * 0.06;

  // Stamme — avsmalnende sylinder
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 0.6, trunkR, h * 0.38, 8),
    new THREE.MeshLambertMaterial({ map: textures.wood })
  );
  trunk.position.set(x, gh + h * 0.19, z);
  trunk.castShadow = true;
  scene.add(trunk);

  // Lagdelte kjegler — smalere og kortere oppover
  const layers = Math.floor(4 + Math.random() * 3);
  const leafM = new THREE.MeshLambertMaterial({
    color: new THREE.Color(0x1a5a18).lerp(new THREE.Color(0x2d7a20), Math.random()),
  });
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const coneR = (1.6 - t * 1.0) * (0.8 + Math.random() * 0.25);
    const coneH = h * (0.32 - t * 0.04);
    const yOff  = gh + h * (0.28 + t * 0.52);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(coneR, coneH, 7 + Math.floor(Math.random() * 3), 1),
      leafM
    );
    cone.position.set(
      x + (Math.random() - 0.5) * 0.12,
      yOff,
      z + (Math.random() - 0.5) * 0.12
    );
    cone.rotation.y = Math.random() * Math.PI * 2;
    cone.castShadow = true;
    scene.add(cone);
  }
}

function addDecidousTree(scene, x, z, gh) {
  const h = 4 + Math.random() * 3;
  const trunkH = h * 0.42;
  const trunkR  = 0.14 + Math.random() * 0.07;

  // Stamme med taper og litt kurve
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 0.55, trunkR, trunkH, 8),
    new THREE.MeshLambertMaterial({ map: textures.wood })
  );
  trunk.position.set(x, gh + trunkH / 2, z);
  trunk.rotation.z = (Math.random() - 0.5) * 0.06;
  trunk.castShadow = true;
  scene.add(trunk);

  // Grener (2-3 stk)
  const branchM = new THREE.MeshLambertMaterial({ color: 0x4a2e0a });
  const numBranches = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numBranches; i++) {
    const angle = (i / numBranches) * Math.PI * 2 + Math.random() * 0.5;
    const bLen = 0.7 + Math.random() * 0.6;
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.07, bLen, 6),
      branchM
    );
    branch.position.set(
      x + Math.cos(angle) * bLen * 0.38,
      gh + trunkH * 0.78 + Math.random() * 0.4,
      z + Math.sin(angle) * bLen * 0.38
    );
    branch.rotation.z = Math.cos(angle) * 0.7;
    branch.rotation.x = Math.sin(angle) * 0.7;
    branch.castShadow = true;
    scene.add(branch);
  }

  // Løvverk — klynge av overlappende sfærer
  const canopyR = 1.3 + Math.random() * 0.8;
  const canopyCx = x + (Math.random() - 0.5) * 0.3;
  const canopyCy = gh + trunkH + canopyR * 0.65;
  const canopyCz = z + (Math.random() - 0.5) * 0.3;

  const hue = 95 + Math.random() * 30;
  const sat = 50 + Math.random() * 25;
  const lgt = 22 + Math.random() * 16;
  const leafColor = new THREE.Color(`hsl(${hue},${sat}%,${lgt}%)`);
  const leafM = new THREE.MeshLambertMaterial({ color: leafColor });

  const blobs = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < blobs; i++) {
    const r = canopyR * (0.55 + Math.random() * 0.5);
    const a1 = Math.random() * Math.PI * 2;
    const a2 = (Math.random() - 0.5) * Math.PI;
    const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), leafM);
    blob.position.set(
      canopyCx + Math.cos(a1) * Math.cos(a2) * canopyR * 0.6,
      canopyCy + Math.sin(a2) * canopyR * 0.4,
      canopyCz + Math.sin(a1) * Math.cos(a2) * canopyR * 0.6
    );
    blob.castShadow = true;
    scene.add(blob);
  }
}

// --- Hus (skadet utgave) ---
function addDamagedHouse(scene, x, z) {
  const gh = getTerrainHeight(x, z);
  const W = 7, H = 4;
  const damagedWallM = new THREE.MeshLambertMaterial({ color: 0x6b4a28 });
  const stoneM = mat(textures.stone, 2);
  const damaged = [];

  // Fundament (ok)
  box(scene, W+0.4, 0.4, W+0.4, stoneM, x, gh+0.2, z);

  // Frontvegg med hull
  box(scene, 2.5, H, 0.4, damagedWallM, x-2.2, gh+H/2+0.4, z-W/2);
  box(scene, 2.0, H, 0.4, damagedWallM, x+2.0, gh+H/2+0.4, z-W/2);
  // Dør-åpning + skeiv dør
  const doorM = new THREE.MeshLambertMaterial({ color: 0x3a1a00 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.25), doorM);
  door.position.set(x, gh+1.5, z-W/2-0.1);
  door.rotation.y = 0.5; // halvåpen
  scene.add(door);

  // Bakvegg (delvis hull)
  box(scene, 3.5, H, 0.4, damagedWallM, x-1.5, gh+H/2+0.4, z+W/2);
  const brokenBack = box(scene, 2.0, H*0.55, 0.4, damagedWallM, x+2.0, gh+H*0.28+0.4, z+W/2);
  damaged.push(brokenBack);

  // Sidevegger
  box(scene, 0.4, H, W, damagedWallM, x-W/2, gh+H/2+0.4, z);
  // Høyre vegg med hull
  box(scene, 0.4, H*0.6, W*0.4, damagedWallM, x+W/2, gh+H*0.3+0.4, z-1.5);
  box(scene, 0.4, H, W*0.5, damagedWallM,    x+W/2, gh+H/2+0.4, z+1.5);
  const brokenSide = box(scene, 0.4, H*0.4, W*0.3, damagedWallM, x+W/2, gh+H*0.2+0.4, z-0.5);
  damaged.push(brokenSide);

  // Gulv (slitt)
  box(scene, W-0.4, 0.2, W-0.4, mat(textures.dirt, 2), x, gh+0.5, z);

  // Skeivt tak med hull
  const roofM = new THREE.MeshLambertMaterial({ color: 0x5a1010 });
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(5.8, 3.2, 4), roofM);
  roofMesh.rotation.y = Math.PI/4;
  roofMesh.position.set(x+0.3, gh+H+0.4+1.6, z);
  roofMesh.rotation.z = 0.06; // litt skeivt
  roofMesh.castShadow = true;
  scene.add(roofMesh);
  damaged.push(roofMesh); // tak-skade fjernes ved reparasjon

  // Løse planker rundt huset
  const plankM = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
  [
    [x+3,  gh+0.4, z-2.5, 0.3],
    [x-3.5,gh+0.3, z+1,   0.8],
    [x+1,  gh+0.25,z+3.8, 1.2],
  ].forEach(([px,py,pz,ry]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.22), plankM);
    p.position.set(px, py, pz);
    p.rotation.y = ry;
    p.castShadow = true;
    scene.add(p);
    damaged.push(p);
  });

  // Sprekker i veggen (mørke striper)
  const crackM = new THREE.MeshLambertMaterial({ color: 0x2a1500 });
  [
    [x-1.5, gh+2.5, z-W/2-0.05, 0.08, 1.2, 0.1],
    [x+1,   gh+1.8, z+W/2+0.05, 0.08, 0.9, 0.1],
    [x-W/2-0.05, gh+3, z+0.5,   0.1,  0.7, 0.08],
  ].forEach(([cx,cy,cz,cw,ch,cd]) => {
    const crack = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), crackM);
    crack.position.set(cx, cy, cz);
    scene.add(crack);
    damaged.push(crack);
  });

  return { damaged, roofMesh };
}

// --- Hus (reparert) ---
function addHouse(scene, x, z, wallTex = textures.wall) {
  const gh = getTerrainHeight(x, z);
  const W = 7, H = 4;
  const wallM = mat(wallTex, 2);
  const roofM = mat(textures.roof, 2);
  const stoneM = mat(textures.stone, 2);

  box(scene, W+0.4, 0.4, W+0.4, stoneM, x, gh+0.2, z);
  box(scene, W, H, 0.4, wallM, x,      gh+H/2+0.4, z-W/2);
  box(scene, W, H, 0.4, wallM, x,      gh+H/2+0.4, z+W/2);
  box(scene, 0.4, H, W, wallM, x-W/2,  gh+H/2+0.4, z);
  box(scene, 0.4, H, W, wallM, x+W/2,  gh+H/2+0.4, z);
  box(scene, W-0.4, 0.2, W-0.4, mat(textures.dirt, 2), x, gh+0.5, z);
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(5.8, 3.2, 4), roofM);
  roofMesh.rotation.y = Math.PI/4;
  roofMesh.position.set(x, gh+H+0.4+1.6, z);
  roofMesh.castShadow = true;
  scene.add(roofMesh);
  box(scene, 1.3, 2.5, 0.3, new THREE.MeshLambertMaterial({ color: 0x3a1a00 }), x, gh+1.65, z-W/2-0.1);
  const winM = new THREE.MeshLambertMaterial({ color: 0xaadeff, transparent: true, opacity: 0.7 });
  [[-2.2, 0],[2.2, 0],[0, 2.2]].forEach(([ox, oz]) => {
    const wm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.3), winM);
    wm.position.set(x+ox, gh+H/2+0.4, z+oz);
    scene.add(wm);
  });
}

// --- Gjerde ---
function fenceSegment(scene, x1, z1, x2, z2) {
  const dx = x2-x1, dz = z2-z1;
  const len = Math.sqrt(dx*dx+dz*dz);
  const angle = Math.atan2(dz, dx);
  const cx = (x1+x2)/2, cz = (z1+z2)/2;
  const gh = getTerrainHeight(cx, cz);
  const m = mat(textures.wood);
  [0.95, 0.55].forEach(y => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.1), m);
    rail.position.set(cx, gh+y, cz);
    rail.rotation.y = angle;
    rail.castShadow = true;
    scene.add(rail);
  });
  [[x1,z1],[x2,z2]].forEach(([px,pz]) => {
    box(scene, 0.12, 1.2, 0.12, m, px, getTerrainHeight(px,pz)+0.6, pz);
  });
}

// --- Interaktive objekter ---
function addWoodpile(scene, x, z) {
  const gh = getTerrainHeight(x, z);
  const g = new THREE.Group();
  const wm = mat(textures.wood);
  for (let i = 0; i < 3; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.1, 8), wm);
    l.rotation.z = Math.PI/2;
    l.position.set((i-1)*0.38, 0.17, 0);
    g.add(l);
  }
  for (let i = 0; i < 2; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.1, 8), wm);
    l.rotation.z = Math.PI/2;
    l.position.set((i-0.5)*0.38, 0.48, 0);
    g.add(l);
  }
  g.position.set(x, gh, z);
  g.castShadow = true;
  scene.add(g);
  return g;
}

function addWell(scene, x, z) {
  const gh = getTerrainHeight(x, z);
  const sm = mat(textures.stone, 2);
  const wm = mat(textures.wood);
  // Ring
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.7, 16, 1, true),
    new THREE.MeshLambertMaterial({ map: textures.stone.clone(), side: THREE.DoubleSide })
  );
  ring.position.set(x, gh+0.35, z);
  ring.castShadow = true;
  scene.add(ring);
  // Vann i brønnen
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16),
    new THREE.MeshLambertMaterial({ map: textures.water.clone(), transparent: true, opacity: 0.85 })
  );
  water.position.set(x, gh+0.35, z);
  scene.add(water);
  // Tak-stenger og bjelke
  [[-0.7,-0.7],[0.7,-0.7],[-0.7,0.7],[0.7,0.7]].forEach(([ox,oz]) => {
    box(scene, 0.1, 1.5, 0.1, wm, x+ox, gh+1.1, z+oz);
  });
  box(scene, 1.6, 0.1, 0.1, wm, x, gh+1.9, z-0.7);
  box(scene, 1.6, 0.1, 0.1, wm, x, gh+1.9, z+0.7);
  box(scene, 0.1, 0.1, 1.6, wm, x-0.7, gh+1.9, z);
  box(scene, 0.1, 0.1, 1.6, wm, x+0.7, gh+1.9, z);

  const g = new THREE.Group();
  g.position.set(x, gh, z);
  scene.add(g);
  return g;
}

function addGarden(scene, x, z) {
  const gh = getTerrainHeight(x, z);
  const g = new THREE.Group();
  // Jordbed
  const soil = new THREE.Mesh(new THREE.BoxGeometry(3, 0.18, 2.2), mat(textures.dirt, 1));
  soil.position.set(0, 0.09, 0);
  g.add(soil);
  // Plante-rader
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.35, 6),
        new THREE.MeshLambertMaterial({ color: 0x2d8a2d }));
      stem.position.set(-1.05+col*0.7, 0.26, -0.45+row*0.9);
      g.add(stem);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 5),
        new THREE.MeshLambertMaterial({ color: 0x1a6a1a }));
      top.position.set(-1.05+col*0.7, 0.48, -0.45+row*0.9);
      g.add(top);
    }
  }
  g.position.set(x, gh, z);
  g.castShadow = true;
  scene.add(g);
  return g;
}

function addCampfire(scene, x, z) {
  const gh = getTerrainHeight(x, z);
  const g = new THREE.Group();
  const sm = mat(textures.stone);
  // Steinsirkel
  for (let i = 0; i < 7; i++) {
    const a = (i/7)*Math.PI*2;
    const stone = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), sm);
    stone.scale.y = 0.6;
    stone.position.set(Math.cos(a)*0.6, 0.11, Math.sin(a)*0.6);
    g.add(stone);
  }
  // Vedkubber
  const wm = mat(textures.wood);
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 8), wm);
    log.rotation.z = Math.PI/2;
    log.rotation.y = (i/3)*Math.PI;
    log.position.set(0, 0.09, 0);
    g.add(log);
  }
  // Flammer
  const flameM = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 8), flameM);
  flame.position.set(0, 0.35, 0);
  g.add(flame);
  const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.9 }));
  flame2.position.set(0.05, 0.42, 0.05);
  g.add(flame2);

  const fireLight = new THREE.PointLight(0xff6600, 1.8, 7);
  fireLight.position.set(x, gh+0.8, z);
  scene.add(fireLight);

  g.position.set(x, gh, z);
  scene.add(g);
  return g;
}

function addRepairSpot(scene, x, z) {
  const gh = getTerrainHeight(x, z);
  const g = new THREE.Group();
  const wm = mat(textures.wall);
  // Skadet plank
  const plank = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.35), wm);
  plank.rotation.z = 0.22;
  plank.position.set(0, 0.9, 0);
  g.add(plank);
  // Hammer på bakken
  const hm = new THREE.MeshLambertMaterial({ color: 0x555 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), hm);
  handle.rotation.z = 0.5;
  handle.position.set(0.55, 0.24, 0.35);
  g.add(handle);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.12),
    new THREE.MeshLambertMaterial({ color: 0x888 }));
  head.position.set(0.72, 0.48, 0.35);
  g.add(head);
  g.position.set(x, gh, z);
  scene.add(g);
  return g;
}

function addGlowRing(scene, x, z) {
  const gh = getTerrainHeight(x, z);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1.05, 24),
    new THREE.MeshBasicMaterial({ color: 0xf5c842, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
  );
  ring.rotation.x = -Math.PI/2;
  ring.position.set(x, gh+0.06, z);
  scene.add(ring);
  return ring;
}

// Felte trestammer som kan samles
function addLogOnGround(scene, x, z) {
  const gh = getTerrainHeight(x, z);
  const g = new THREE.Group();
  const logM = mat(textures.wood);
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.4, 10), logM);
  log.rotation.z = Math.PI / 2;
  log.position.set(0, 0.2, 0);
  g.add(log);
  const cap1 = new THREE.Mesh(new THREE.CircleGeometry(0.18, 10), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
  cap1.rotation.y = Math.PI / 2;
  cap1.position.set(-0.7, 0.2, 0);
  g.add(cap1);
  const cap2 = cap1.clone();
  cap2.position.set(0.7, 0.2, 0);
  g.add(cap2);
  g.position.set(x, gh, z);
  g.rotation.y = Math.random() * Math.PI;
  g.castShadow = true;
  scene.add(g);
  return g;
}

function addHouseColliders(cx, cz) {
  const W = 3.7; // halvbredde
  // Fire vegger som tynne bokser
  addBoxCollider(cx,     cz - W, W, 0.5); // front
  addBoxCollider(cx,     cz + W, W, 0.5); // bak
  addBoxCollider(cx - W, cz,     0.5, W); // venstre
  addBoxCollider(cx + W, cz,     0.5, W); // høyre
}

// --- Hovedfunksjon ---
export function buildWorld(scene, loc, repaired = false) {
  while (scene.children.length > 0) scene.remove(scene.children[0]);
  interactables.length = 0;
  damagedHouseParts = [];
  resources.wood = 0;
  resources.stone = 0;
  clearColliders();

  // Lys
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xfff5cc, 1.3);
  sun.position.set(25, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.width = sun.shadow.mapSize.height = 2048;
  Object.assign(sun.shadow.camera, { near: 0.5, far: 180, left: -50, right: 50, top: 50, bottom: -50 });
  scene.add(sun);

  // Tåke og himmel
  scene.background = new THREE.Color(0x87ceeb);
  if (loc.id === 'hule') {
    scene.fog = new THREE.Fog(0x1a1a2e, 8, 35);
    scene.background = new THREE.Color(0x1a1a2e);
  } else if (loc.id === 'skog') {
    scene.fog = new THREE.FogExp2(0x2d5a1a, 0.03);
    scene.background = new THREE.Color(0x2d5a1a);
  } else {
    scene.fog = new THREE.Fog(0xa8d8f0, 40, 90);
    createSky(scene);
  }

  // Terreng
  const terrain = createTerrain(textures.grass);
  scene.add(terrain);

  // Sti mot huset (sand-flate)
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 12),
    new THREE.MeshLambertMaterial({ map: textures.sand })
  );
  path.rotation.x = -Math.PI/2;
  path.position.set(0, 0.02, -2);
  scene.add(path);

  // Hus — skadet i starten, reparert etter reparere-oppgave
  if (loc.id !== 'hule') {
    if (repaired) {
      addHouse(scene, 0, -8);
    } else {
      const { damaged } = addDamagedHouse(scene, 0, -8);
      damagedHouseParts.push(...damaged);
    }
    addHouseColliders(0, -8);
    if (loc.id === 'landsby') {
      addHouse(scene, 15, -5);  addHouseColliders(15, -5);
      addHouse(scene, -14, -6); addHouseColliders(-14, -6);
    }
  }

  // Gjerde
  if (loc.id !== 'hule') {
    fenceSegment(scene, -6, -14, 6, -14);
    fenceSegment(scene, -6, -14, -6, -2);
    fenceSegment(scene,  6, -14,  6, -2);
  }

  // Trær
  const treePoses = loc.id === 'skog'
    ? [[-8,4],[-13,1],[-5,9],[9,-3],[7,7],[-11,10],[14,5],[-3,14],[12,-8],[-15,-4],[5,-13],[-9,-12]]
    : [[9,-3],[-10,-8],[14,2],[-5,12],[18,8],[-3,16],[13,10],[-16,5],[8,14]];
  treePoses.forEach(([x, z]) => addTree(scene, x, z));

  // Vann
  if (loc.id === 'hus' || loc.id === 'landsby') {
    const waterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 5),
      new THREE.MeshLambertMaterial({ map: textures.water, transparent: true, opacity: 0.82 })
    );
    waterMesh.rotation.x = -Math.PI/2;
    waterMesh.position.set(13, 0.08, 9);
    scene.add(waterMesh);
  }

  // Felte trestammer til å samle tre (ressurs)
  if (loc.id !== 'hule') {
    const logSpots = [[6, 8], [-8, 10], [11, -6]];
    logSpots.forEach(([lx, lz]) => {
      const mesh = addLogOnGround(scene, lx, lz);
      addGlowRing(scene, lx, lz);
      interactables.push({ taskId: 'tre', pos: { x: lx, z: lz }, mesh });
    });
  }

  // --- Interaktive oppgave-objekter ---
  const taskObjs = [
    { id: 'ved',      x:  8,   z:  2,   fn: addWoodpile  },
    { id: 'vann',     x: -7,   z:  3,   fn: addWell      },
    { id: 'hage',     x:  4,   z:  6,   fn: addGarden    },
    { id: 'mat',      x: -4,   z:  6,   fn: addCampfire  },
    { id: 'reparere', x:  3.5, z: -4.8, fn: addRepairSpot},
  ];

  taskObjs.forEach(({ id, x, z, fn }) => {
    const mesh = fn(scene, x, z);
    addGlowRing(scene, x, z);
    interactables.push({ taskId: id, pos: { x, z }, mesh });
  });
}
