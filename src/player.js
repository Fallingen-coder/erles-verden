import * as THREE from 'three';

// ── Farger ────────────────────────────────────────────────────────────────────
const C = {
  skin:        0xc8845a,
  skinDark:    0xa86840,
  hair:        0x1e0e00,
  eye:         0x1a0e00,
  eyeWhite:    0xf0ece0,
  stubble:     0x6a3820,
  lip:         0x8a4030,
  shirtLight:  0xd8cdb0,
  shirtShadow: 0xb8a890,
  vest:        0x2e1a08,
  vestEdge:    0x4a2e10,
  vestBtn:     0x7a5020,
  pants:       0x28282e,
  pantsFold:   0x1e1e24,
  belt:        0x1a0e00,
  buckle:      0xb08020,
  glove:       0x150900,
  gloveEdge:   0x2a1200,
  boot:        0x140900,
  bootLight:   0x2e1408,
  bootSole:    0x0a0500,
  spur:        0x909090,
  bandolier:   0x2a1800,
  bullet:      0xb89020,
  holster:     0x100800,
  gunMetal:    0x555560,
  gunWood:     0x3a1800,
  hatDark:     0x100c06,
  hatMid:      0x1e160a,
  hatBand:     0x6a3808,
  hatBandMetal:0xa07820,
};

const M = {};
for (const [k, v] of Object.entries(C)) M[k] = new THREE.MeshLambertMaterial({ color: v });

function caps(r, h, m)         { return new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 10, 18), m); }
function sph(r, m, sx=1,sy=1,sz=1) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 14), m); o.scale.set(sx,sy,sz); return o; }
function cyl(rt,rb,h,m,seg=12) { return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), m); }
function box(w,h,d,m)          { return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m); }
function tor(R,r,m,seg=18)     { return new THREE.Mesh(new THREE.TorusGeometry(R,r,6,seg), m); }

function put(parent, o, x=0,y=0,z=0,rx=0,ry=0,rz=0) {
  o.position.set(x,y,z); o.rotation.set(rx,ry,rz); o.castShadow=true; parent.add(o); return o;
}

// ── Hode ─────────────────────────────────────────────────────────────────────
function buildHead() {
  const g = new THREE.Group();
  // Hodeskalle
  put(g, sph(0.24, M.skin, 0.88, 1.0, 0.92));
  // Kinn
  put(g, sph(0.16, M.skin, 0.7, 0.6, 0.65), -0.17,-0.06, 0.10);
  put(g, sph(0.16, M.skin, 0.7, 0.6, 0.65),  0.17,-0.06, 0.10);
  // Kjeve + hake
  put(g, sph(0.12, M.skin, 0.75,0.55,0.7), -0.13,-0.17, 0.04);
  put(g, sph(0.12, M.skin, 0.75,0.55,0.7),  0.13,-0.17, 0.04);
  put(g, sph(0.10, M.skin, 0.7, 0.5, 0.65),    0,-0.22, 0.10);
  // Panne
  put(g, sph(0.22, M.skin, 0.9, 0.6, 0.85),    0, 0.11, 0.06);
  // Skjeggstubbs
  put(g, sph(0.235, M.stubble, 0.88,0.55,0.9), 0,-0.10, 0.07);
  // Nese
  put(g, sph(0.045, M.skin, 0.6,1.0,0.7),   0, 0.01, 0.22);
  put(g, sph(0.055, M.skin, 0.9,0.75,0.85), 0,-0.04, 0.24);
  put(g, sph(0.035, M.skin, 1,0.7,0.9), -0.05,-0.05,0.225);
  put(g, sph(0.035, M.skin, 1,0.7,0.9),  0.05,-0.05,0.225);
  put(g, sph(0.022, M.skinDark), -0.04,-0.07, 0.245);
  put(g, sph(0.022, M.skinDark),  0.04,-0.07, 0.245);
  // Øyne
  [-0.1, 0.1].forEach(x => {
    put(g, sph(0.075, M.skin, 0.9,0.75,0.6),  x, 0.05, 0.18);
    put(g, sph(0.058, M.eyeWhite, 1,0.85,0.7),x, 0.05, 0.21);
    put(g, sph(0.038, M.eye),                  x, 0.05, 0.238);
    put(g, sph(0.012, M.eyeWhite), x+0.014,   0.064, 0.248);
    put(g, sph(0.060, M.skinDark, 1,0.3,0.65),x, 0.075,0.218);
  });
  // Øyenbryn
  [-0.1, 0.1].forEach(x => {
    const eb = sph(0.065, M.hair, 1.15,0.22,0.5);
    put(g, eb, x, 0.115, 0.20, 0, 0, x<0?0.18:-0.18);
  });
  // Lepper
  put(g, sph(0.075, M.lip, 1.1,0.45,0.7),  0,-0.105,0.228);
  put(g, sph(0.070, M.lip, 1.0,0.40,0.72), 0,-0.135,0.224);
  // Ører
  [-0.235, 0.235].forEach(x => {
    put(g, sph(0.065, M.skin,    0.45,0.8,0.7), x, 0.0, 0.02);
    put(g, sph(0.035, M.skinDark,0.40,0.6,0.5), x, 0.0, 0.02);
  });
  // Hår (bak)
  const hairBack = new THREE.Mesh(
    new THREE.SphereGeometry(0.245, 16, 12, 0, Math.PI*2, 0, Math.PI*0.55), M.hair);
  put(g, hairBack, 0, 0.02,-0.01);
  // Sidelokker
  [-0.2, 0.2].forEach(x => {
    const s = caps(0.04, 0.12, M.hair);
    put(g, s, x,-0.10,-0.05, 0,0, x<0?0.3:-0.3);
  });
  return g;
}

// ── Cowboyhatt ────────────────────────────────────────────────────────────────
function buildHat() {
  const g = new THREE.Group();
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.46,0.44,0.055,24), M.hatMid));
  const brimEdge = tor(0.44,0.028, M.hatDark, 24); brimEdge.rotation.x=Math.PI/2; g.add(brimEdge);
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.21,0.26,0.32,20), M.hatDark), 0,0.18,0);
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.21,0.05,20), M.hatDark), 0,0.345,0);
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.18,0.08,16), M.hatDark), 0,0.310,0);
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.265,0.265,0.08,20), M.hatBand), 0,0.04,0);
  put(g, box(0.06,0.055,0.04, M.hatBandMetal), 0,0.04,0.267);
  return g;
}

// ── Vest ─────────────────────────────────────────────────────────────────────
function buildVest(root) {
  put(root, box(0.17,0.48,0.09, M.vest), -0.075,1.06,0.165);
  put(root, box(0.17,0.48,0.09, M.vest),  0.075,1.06,0.165);
  [-0.21,0.21].forEach(x => put(root, box(0.12,0.10,0.12, M.vest), x,1.32,0.10));
  put(root, box(0.025,0.46,0.04, M.vestEdge), 0,1.06,0.205);
  [-0.10,0.10].forEach(x => {
    put(root, box(0.10,0.085,0.05, M.vestEdge), x,1.12,0.215);
    put(root, box(0.10,0.030,0.04, M.vest),     x,1.155,0.220);
  });
  for (let i=0;i<4;i++) put(root, sph(0.020, M.vestBtn), 0,1.22-i*0.10,0.215);
}

// ── Hylster + pistol ─────────────────────────────────────────────────────────
function buildHolster(root) {
  put(root, box(0.095,0.20,0.072, M.holster), 0.28,0.56,0.08);
  put(root, box(0.060,0.08,0.055, M.holster), 0.28,0.42,0.07);
  put(root, box(0.160,0.04,0.040, M.holster), 0.20,0.45,0.04);
  put(root, box(0.050,0.12,0.048, M.gunWood), 0.275,0.62,0.13);
  const chmb = cyl(0.032,0.032,0.065, M.gunMetal, 8);
  put(root, chmb, 0.275,0.59,0.10, 0,0,Math.PI/2);
  const barrel = cyl(0.018,0.018,0.17, M.gunMetal, 8);
  put(root, barrel, 0.275,0.54,0.10, -0.3,0,Math.PI/2);
}

// ── Bandolær ──────────────────────────────────────────────────────────────────
function buildBandolier(root) {
  for (let i=0;i<8;i++) {
    const t=i/7;
    const s=box(0.055,0.09,0.038, M.bandolier);
    put(root,s,-0.22+t*0.34,1.30-t*0.52,0.19+t*0.02,0,0,-0.52);
  }
  for (let i=0;i<7;i++) {
    const t=i/6;
    const b=cyl(0.014,0.014,0.07,M.bullet,6);
    put(root,b,-0.18+t*0.28,1.25-t*0.43,0.22,0,0,-0.52);
  }
}

// ── Hovud-funksjon ────────────────────────────────────────────────────────────
export function createPlayer(scene) {
  const root = new THREE.Group();

  // Kropp
  const body = caps(0.215, 0.54, M.shirtLight);
  body.position.y=1.04; root.add(body);
  put(root, box(0.12,0.10,0.05, M.shirtLight), -0.05,1.37,0.16, 0,0,-0.25);
  put(root, box(0.12,0.10,0.05, M.shirtLight),  0.05,1.37,0.16, 0,0, 0.25);

  buildVest(root);
  buildBandolier(root);

  // Nakke
  put(root, cyl(0.10,0.105,0.14, M.skin,10), 0,1.41,0);

  // Hode
  const headGroup = buildHead();
  headGroup.position.set(0,1.64,0);
  root.add(headGroup);

  // Hatt
  const hatGroup = buildHat();
  hatGroup.position.set(0,1.88,0);
  root.add(hatGroup);

  // Armer
  const armL = caps(0.092,0.36, M.shirtLight);
  put(root, armL, -0.325,1.02,0, 0,0, 0.22);
  const armR = caps(0.092,0.36, M.shirtLight);
  put(root, armR,  0.325,1.02,0, 0,0,-0.22);
  put(root, cyl(0.09,0.095,0.06, M.shirtShadow,10), -0.35,0.74,0);
  put(root, cyl(0.09,0.095,0.06, M.shirtShadow,10),  0.35,0.74,0);

  // Hansker
  const handL = sph(0.095, M.glove, 0.95,0.85,0.88);
  put(root, handL, -0.355,0.675,0);
  const handR = sph(0.095, M.glove, 0.95,0.85,0.88);
  put(root, handR,  0.355,0.675,0);
  put(root, cyl(0.100,0.105,0.07, M.gloveEdge,10), -0.355,0.715,0);
  put(root, cyl(0.100,0.105,0.07, M.gloveEdge,10),  0.355,0.715,0);
  [-0.06,0,0.06].forEach(dx => {
    put(root, sph(0.022, M.gloveEdge), -0.355+dx,0.640,0.07);
    put(root, sph(0.022, M.gloveEdge),  0.355+dx,0.640,0.07);
  });

  // Belte
  put(root, cyl(0.225,0.225,0.062, M.belt,18), 0,0.77,0);
  put(root, box(0.10,0.068,0.065, M.buckle),   0,0.77,0.23);
  for (let i=0;i<8;i++) {
    const a=(i/8)*Math.PI*1.1-Math.PI*0.05;
    put(root, cyl(0.013,0.013,0.075,M.bullet,6), Math.sin(a)*0.235,0.81,Math.cos(a)*0.235);
  }

  buildHolster(root);

  // Bukser
  const legL = caps(0.108,0.44, M.pants); put(root, legL, -0.115,0.50,0);
  const legR = caps(0.108,0.44, M.pants); put(root, legR,  0.115,0.50,0);
  put(root, box(0.012,0.44,0.012, M.pantsFold), -0.225,0.50,0);
  put(root, box(0.012,0.44,0.012, M.pantsFold),  0.225,0.50,0);

  // Støvler
  const bootShaftL = cyl(0.108,0.112,0.26, M.boot,12); put(root, bootShaftL, -0.115,0.22,0);
  const bootShaftR = cyl(0.108,0.112,0.26, M.boot,12); put(root, bootShaftR,  0.115,0.22,0);
  put(root, sph(0.115, M.boot, 0.85,0.60,1.35), -0.115,0.10,0.08);
  put(root, sph(0.115, M.boot, 0.85,0.60,1.35),  0.115,0.10,0.08);
  put(root, box(0.10,0.10,0.09, M.boot),  -0.115,0.06,-0.10);
  put(root, box(0.10,0.10,0.09, M.boot),   0.115,0.06,-0.10);
  put(root, box(0.14,0.03,0.35, M.bootSole), -0.115,0.015,0.01);
  put(root, box(0.14,0.03,0.35, M.bootSole),  0.115,0.015,0.01);
  put(root, box(0.020,0.24,0.025, M.bootLight), -0.115,0.22, 0.112);
  put(root, box(0.020,0.24,0.025, M.bootLight),  0.115,0.22, 0.112);
  // Sporer
  [-0.115,0.115].forEach(x => {
    const sw = tor(0.038,0.010, M.spur,8); sw.rotation.y=Math.PI/2;
    put(root, sw, x,0.07,-0.15);
    put(root, box(0.01,0.01,0.05, M.spur), x,0.07,-0.13);
  });

  root.traverse(c => { if (c.isMesh) c.castShadow=true; });
  scene.add(root);

  const player = {
    root, headGroup, hatGroup,
    body, armL, armR, handL, handR, legL, legR,
    bootL: bootShaftL, bootR: bootShaftR,
    accessories: [],
    currentLevel: 0,
  };
  updateOutfit(player, 1);
  return player;
}

// ── Rang-antrekk ──────────────────────────────────────────────────────────────
export function updateOutfit(player, level) {
  if (level === player.currentLevel) return;
  player.currentLevel = level;
  player.accessories.forEach(o => player.root.remove(o));
  player.accessories = [];
  function acc(o) { o.traverse(c => { if (c.isMesh) c.castShadow=true; }); player.root.add(o); player.accessories.push(o); return o; }

  if (level >= 2) { // Sheriff-stjerne
    const s = new THREE.Group();
    s.add(new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.02,5), new THREE.MeshLambertMaterial({color:0xffd700})));
    s.position.set(-0.13,1.18,0.24); s.rotation.x=Math.PI/2; acc(s);
  }
  if (level >= 3) { // Forkle
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.32,0.50,0.065), new THREE.MeshLambertMaterial({color:0x8a6a30}));
    a.position.set(0,0.90,0.22); acc(a);
  }
  if (level >= 4) { // Lang frakk + skjerf
    const sc = new THREE.Mesh(new THREE.TorusGeometry(0.13,0.038,7,16), new THREE.MeshLambertMaterial({color:0x8a1a1a}));
    sc.position.set(0,1.35,0.07); sc.rotation.x=Math.PI/2; acc(sc);
    const ct = new THREE.Mesh(new THREE.BoxGeometry(0.58,0.90,0.08), new THREE.MeshLambertMaterial({color:0x1a1008}));
    ct.position.set(0,0.88,-0.22); ct.rotation.x=0.14; acc(ct);
  }
  if (level >= 5) { // Støvfrakk
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.64,1.10,0.08), new THREE.MeshLambertMaterial({color:0x4a3018}));
    d.position.set(0,0.80,-0.24); d.rotation.x=0.12; acc(d);
  }
  if (level >= 6) { // Rød vest + kjede
    const fv = new THREE.Mesh(new THREE.BoxGeometry(0.33,0.46,0.09), new THREE.MeshLambertMaterial({color:0x8a1818}));
    fv.position.set(0,1.06,0.18); acc(fv);
    const ch = new THREE.Mesh(new THREE.TorusGeometry(0.09,0.012,6,16), new THREE.MeshLambertMaterial({color:0xffd700}));
    ch.position.set(0.08,1.18,0.26); ch.rotation.x=Math.PI/2; acc(ch);
  }
  if (level >= 7) { // Militærjakke
    const jk = new THREE.Mesh(new THREE.BoxGeometry(0.56,0.62,0.13), new THREE.MeshLambertMaterial({color:0x2a3a2a}));
    jk.position.set(0,1.04,0.05); acc(jk);
    [-0.31,0.31].forEach(x => {
      const ep = new THREE.Mesh(new THREE.BoxGeometry(0.19,0.055,0.15), new THREE.MeshLambertMaterial({color:0xc8a030}));
      ep.position.set(x,1.30,0.04); acc(ep);
      for (let i=0;i<3;i++) {
        const fr = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,0.09,6), new THREE.MeshLambertMaterial({color:0xc8a030}));
        fr.position.set(x-0.05+i*0.05,1.22,0.04); acc(fr);
      }
    });
  }
  if (level >= 8) { // Legende-frakk + krone
    const lc = new THREE.Mesh(new THREE.BoxGeometry(0.66,1.15,0.09), new THREE.MeshLambertMaterial({color:0x08080e}));
    lc.position.set(0,0.78,-0.24); lc.rotation.x=0.12; acc(lc);
    const cp = new THREE.Mesh(new THREE.BoxGeometry(0.70,0.95,0.07), new THREE.MeshLambertMaterial({color:0x6a0808}));
    cp.position.set(0,0.92,-0.27); acc(cp);
    const cr = new THREE.Mesh(new THREE.TorusGeometry(0.23,0.03,8,20), new THREE.MeshLambertMaterial({color:0xffd700}));
    cr.rotation.x=Math.PI/2; cr.position.set(0,1.96,0); acc(cr);
    for (let i=0;i<5;i++) {
      const a=(i/5)*Math.PI*2;
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.025,0.14,5), new THREE.MeshLambertMaterial({color:0xffd700}));
      sp.position.set(Math.cos(a)*0.23,2.02,Math.sin(a)*0.23); acc(sp);
    }
  }
}

// ── Gange-animasjon ───────────────────────────────────────────────────────────
export function animatePlayer(player, moving, t) {
  const swing    = moving ? Math.sin(t*7.5)*0.40 : 0;
  const legSwing = moving ? Math.sin(t*7.5)*0.46 : 0;
  const bob      = moving ? Math.abs(Math.sin(t*15))*0.008 : 0;
  player.armL.rotation.x =  swing;
  player.armR.rotation.x = -swing;
  player.legL.rotation.x = -legSwing;
  player.legR.rotation.x =  legSwing;
  player.root.position.y = bob;
  if (player.headGroup) player.headGroup.rotation.x = moving ? Math.sin(t*7.5)*0.022 : 0;
  if (player.hatGroup)  player.hatGroup.position.y  = 1.88 + bob*0.5;
}
