import * as THREE from 'three';

export function createSky(scene) {
  // Gradient-dome via en stor halvkule
  const skyGeo = new THREE.SphereGeometry(150, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  skyGeo.scale(-1, -1, -1); // innsiden

  // Canvas-tekstur med gradient
  const canvas = document.createElement('canvas');
  canvas.width = 4; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0,    '#1a6ec0'); // topp — dyp blå
  grad.addColorStop(0.4,  '#5aaee8'); // midt
  grad.addColorStop(0.75, '#a8d8f0'); // horisont
  grad.addColorStop(1,    '#d4eefc'); // nederst
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  const skyTex = new THREE.CanvasTexture(canvas);

  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.renderOrder = -1;
  scene.add(skyMesh);

  // Sol
  const sunGeo = new THREE.CircleGeometry(4, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffce0 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(60, 70, -80);
  sun.lookAt(0, 0, 0);
  scene.add(sun);

  // Sol-glød (større, gjennomsiktig)
  const glowGeo = new THREE.CircleGeometry(9, 32);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0.18 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.copy(sun.position).multiplyScalar(0.999);
  glow.lookAt(0, 0, 0);
  scene.add(glow);

  // Skyer (hvite bokser i ulike størrelser og høyder)
  addClouds(scene);

  return skyMesh;
}

function addClouds(scene) {
  const cloudData = [
    { x: 30,  y: 45, z: -60, sx: 18, sz: 6  },
    { x: -50, y: 50, z: -40, sx: 22, sz: 7  },
    { x: 10,  y: 55, z: -90, sx: 14, sz: 5  },
    { x: -20, y: 48, z: 70,  sx: 20, sz: 6  },
    { x: 60,  y: 52, z: 30,  sx: 16, sz: 5  },
    { x: -70, y: 46, z: -20, sx: 24, sz: 8  },
    { x: 40,  y: 60, z: -10, sx: 12, sz: 4  },
  ];

  cloudData.forEach(({ x, y, z, sx, sz }) => {
    const group = new THREE.Group();
    // Lag sky av overlappende ellipsoider
    const parts = [
      { ox: 0,        oy: 0,   r: 1.0 },
      { ox: -sx*0.28, oy: -0.5, r: 0.72 },
      { ox:  sx*0.28, oy: -0.4, r: 0.78 },
      { ox: -sx*0.48, oy: -1.0, r: 0.55 },
      { ox:  sx*0.45, oy: -0.9, r: 0.58 },
    ];
    parts.forEach(({ ox, oy, r }) => {
      const geo = new THREE.SphereGeometry(1, 10, 7);
      geo.scale(sx * 0.5 * r, sz * r, sx * 0.38 * r);
      const mat = new THREE.MeshBasicMaterial({ color: 0xfafafa, transparent: true, opacity: 0.88 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox, oy, 0);
      group.add(mesh);
    });
    group.position.set(x, y, z);
    group.lookAt(0, y, 0);
    scene.add(group);
  });
}
