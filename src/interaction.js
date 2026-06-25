// Håndterer oppgave-animasjoner. Returnerer true når animasjonen er ferdig.
// Brukes fra main.js sin game-loop.

const DURATION = 1.6; // sekunder per animasjon

let activeAnim = null;

export function startInteraction(taskId, player, particleFn) {
  if (activeAnim) return false; // allerede i gang
  activeAnim = { taskId, player, t: 0, particleFn, done: false };
  return true;
}

export function isInteracting() {
  return activeAnim !== null;
}

export function updateInteraction(delta) {
  if (!activeAnim) return null;

  activeAnim.t += delta;
  const progress = Math.min(activeAnim.t / DURATION, 1.0);
  const { taskId, player } = activeAnim;

  // --- Oppgave-spesifikke animasjoner ---
  switch (taskId) {
    case 'ved': {
      // Hugge: svinge høyre arm ned gjentatte ganger
      const swing = Math.sin(progress * Math.PI * 5);
      player.armR.rotation.x = -swing * 1.4;
      player.handR.position.y = 0.72 + Math.sin(progress * Math.PI * 5) * -0.15;
      // Bøy litt fremover
      player.root.rotation.x = Math.sin(progress * Math.PI * 5) * 0.12;
      break;
    }
    case 'vann': {
      // Bøye seg ned og opp
      const bend = Math.sin(progress * Math.PI * 2) * 0.5;
      player.root.rotation.x = bend;
      player.armL.rotation.x = -bend * 1.2;
      player.armR.rotation.x = -bend * 1.2;
      break;
    }
    case 'hage': {
      // Grave: veksle armer opp og ned
      const dig = Math.sin(progress * Math.PI * 6);
      player.armL.rotation.x = dig * 0.9;
      player.armR.rotation.x = -dig * 0.9;
      player.root.rotation.x = Math.abs(dig) * 0.15;
      break;
    }
    case 'mat': {
      // Røre: sirkelbevegelse med armene
      const stir = progress * Math.PI * 6;
      player.armL.rotation.x = Math.sin(stir) * 0.7;
      player.armL.rotation.z = 0.18 + Math.cos(stir) * 0.3;
      player.armR.rotation.x = -Math.sin(stir) * 0.4;
      break;
    }
    case 'tre': {
      // Hugge tre: samme som ved men mer voldsom
      const chop = Math.sin(progress * Math.PI * 6);
      player.armR.rotation.x = -Math.abs(chop) * 1.8;
      player.armL.rotation.x = -Math.abs(chop) * 0.6;
      player.root.rotation.x = Math.abs(chop) * 0.15;
      break;
    }
    case 'reparere': {
      // Hamre: rask arm-svingning
      const hammer = Math.sin(progress * Math.PI * 7);
      player.armR.rotation.x = -Math.abs(hammer) * 1.6;
      player.handR.position.y = 0.72 + Math.abs(hammer) * 0.12;
      player.root.rotation.x = Math.abs(hammer) * 0.1;
      break;
    }
  }

  // Partikkel-effekt midt i animasjonen
  if (activeAnim.t >= DURATION * 0.5 && !activeAnim.particleFired) {
    activeAnim.particleFired = true;
    if (activeAnim.particleFn) activeAnim.particleFn(taskId);
  }

  // Animasjonen er ferdig
  if (progress >= 1.0) {
    // Nullstill kroppsstilling
    player.root.rotation.x = 0;
    player.armL.rotation.x = 0;
    player.armR.rotation.x = 0;
    player.armL.rotation.z = 0.18;
    player.armR.rotation.z = -0.18;
    player.handL.position.y = 0.72;
    player.handR.position.y = 0.72;
    const finishedId = activeAnim.taskId;
    activeAnim = null;
    return finishedId; // signal om at oppgaven er fullført
  }

  return null;
}
