// Enkel AABB-kollisjon. Registrer bokser og sjekk spillerposisjon mot dem.
// Alle mål er i world-space XZ (høyde ignoreres).

const colliders = []; // { x, z, hw, hd } — senter + halvbredde/dybde

export function clearColliders() {
  colliders.length = 0;
}

// Legg til en rektangulær kollisjonsblokk (rotert støttes ikke — bruk konservativ AABB)
export function addBoxCollider(cx, cz, halfW, halfD) {
  colliders.push({ x: cx, z: cz, hw: halfW, hd: halfD });
}

// Legg til sirkulær kollisjon (approksimasjon som kvadrat)
export function addCylinderCollider(cx, cz, radius) {
  colliders.push({ x: cx, z: cz, hw: radius, hd: radius });
}

// Skyv spillerposisjon ut av alle kolliderende bokser
export function resolveCollision(pos, playerRadius = 0.35) {
  for (const c of colliders) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const overlapX = (c.hw + playerRadius) - Math.abs(dx);
    const overlapZ = (c.hd + playerRadius) - Math.abs(dz);

    if (overlapX > 0 && overlapZ > 0) {
      // Skyv ut langs den minste overlappretningen
      if (overlapX < overlapZ) {
        pos.x += overlapX * Math.sign(dx);
      } else {
        pos.z += overlapZ * Math.sign(dz);
      }
    }
  }
}
