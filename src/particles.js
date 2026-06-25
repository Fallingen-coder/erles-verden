import * as THREE from 'three';

// Enkel partikkel-system: liste av aktive partikler
const particles = [];

export function spawnParticles(scene, x, y, z, opts = {}) {
  const {
    count  = 8,
    color  = 0xffffff,
    size   = 0.12,
    speed  = 2.5,
    life   = 0.8,
    gravity = -6,
    spread  = 1.0,
  } = opts;

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size * (0.5 + Math.random() * 0.5), 5, 4),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);

    const angle  = Math.random() * Math.PI * 2;
    const upward = 0.4 + Math.random() * 0.6;
    particles.push({
      mesh,
      vx: Math.cos(angle) * speed * spread * (0.3 + Math.random() * 0.7),
      vy: upward * speed,
      vz: Math.sin(angle) * speed * spread * (0.3 + Math.random() * 0.7),
      gravity,
      life,
      maxLife: life,
      scene,
    });
  }
}

export function updateParticles(delta) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= delta;
    if (p.life <= 0) {
      p.scene.remove(p.mesh);
      particles.splice(i, 1);
      continue;
    }
    p.vy += p.gravity * delta;
    p.mesh.position.x += p.vx * delta;
    p.mesh.position.y += p.vy * delta;
    p.mesh.position.z += p.vz * delta;
    const t = p.life / p.maxLife;
    p.mesh.scale.setScalar(t);
    p.mesh.material.opacity = t;
    p.mesh.material.transparent = true;
  }
}
