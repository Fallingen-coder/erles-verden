import * as THREE from 'three';

// Enkel Simplex-lignende støy via permutasjon
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }
function grad(hash, x, y) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}
const perm = new Uint8Array(512);
const p = new Uint8Array(256);
for (let i = 0; i < 256; i++) p[i] = i;
for (let i = 255; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [p[i], p[j]] = [p[j], p[i]];
}
for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

function noise2d(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const a = perm[X] + Y, b = perm[X + 1] + Y;
  return lerp(v,
    lerp(u, grad(perm[a], x, y), grad(perm[b], x - 1, y)),
    lerp(u, grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1))
  );
}

function fbm(x, y, octaves = 4) {
  let val = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    val += noise2d(x * freq, y * freq) * amp;
    max += amp; amp *= 0.5; freq *= 2;
  }
  return val / max;
}

export function createTerrain(textureMap) {
  const SIZE = 80;
  const SEGS = 80;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const uv  = geo.attributes.uv;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    // Flat sone rundt origo (hus-området), åser lenger ut
    const distFromCenter = Math.sqrt(x * x + z * z);
    const flatFactor = Math.max(0, 1 - distFromCenter / 14);
    const h = fbm(x * 0.04, z * 0.04) * 4.5 * (1 - flatFactor * 0.92);
    pos.setY(i, h);
  }

  geo.computeVertexNormals();

  const mat = new THREE.MeshLambertMaterial({
    map: textureMap,
  });
  mat.map.repeat.set(20, 20);

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// Returnerer terreng-høyde på en gitt (x,z) posisjon
export function getTerrainHeight(x, z) {
  const distFromCenter = Math.sqrt(x * x + z * z);
  const flatFactor = Math.max(0, 1 - distFromCenter / 14);
  return fbm(x * 0.04, z * 0.04) * 4.5 * (1 - flatFactor * 0.92);
}
