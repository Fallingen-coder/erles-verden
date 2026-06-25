import { gameState, addXP, generateTasks } from '../gameState.js';

export function drawGame(ctx, canvas, mousePos, onClick) {
  const W = canvas.width;
  const H = canvas.height;
  const loc = gameState.location;

  // Bakgrunn
  ctx.fillStyle = loc.bgColor;
  ctx.fillRect(0, 0, W, H);

  drawWorld(ctx, W, H, loc);
  drawHUD(ctx, W, H);
  drawTaskPanel(ctx, W, H, mousePos, onClick);
}

function drawWorld(ctx, W, H, loc) {
  // Himmel
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
  sky.addColorStop(0, '#87ceeb');
  sky.addColorStop(1, '#c8e6c9');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.55);

  // Sol
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.arc(W * 0.82, H * 0.1, W * 0.045, 0, Math.PI * 2);
  ctx.fill();

  // Bakke
  ctx.fillStyle = '#4a7c2f';
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  // Hjem-bygning basert på level
  drawHome(ctx, W, H, loc);

  // Dag-teller
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(W * 0.01, H * 0.56, W * 0.12, H * 0.06);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(W * 0.025)}px Georgia`;
  ctx.textAlign = 'center';
  ctx.fillText(`Dag ${gameState.day}`, W * 0.07, H * 0.605);
}

function drawHome(ctx, W, H, loc) {
  const hlvl = gameState.home.level;
  const hx = W * 0.35;
  const hy = H * 0.32;
  const hw = W * 0.18;
  const hh = H * 0.23;

  if (loc.id === 'hule') {
    // Tegn hule
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.ellipse(hx + hw / 2, hy + hh, hw * 0.6, hh * 0.5, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(hx + hw / 2, hy + hh, hw * 0.35, hh * 0.3, 0, Math.PI, 0);
    ctx.fill();
  } else {
    // Vegger
    ctx.fillStyle = hlvl >= 3 ? '#c8a96e' : (hlvl >= 2 ? '#a0784a' : '#8B6914');
    ctx.fillRect(hx, hy, hw, hh);

    // Tak
    ctx.fillStyle = hlvl >= 3 ? '#8b2222' : '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(hx - hw * 0.1, hy);
    ctx.lineTo(hx + hw / 2, hy - hh * 0.4);
    ctx.lineTo(hx + hw * 1.1, hy);
    ctx.closePath();
    ctx.fill();

    // Dør
    ctx.fillStyle = '#3a1a00';
    ctx.fillRect(hx + hw * 0.38, hy + hh * 0.55, hw * 0.24, hh * 0.45);

    // Vindu
    if (hlvl >= 2) {
      ctx.fillStyle = '#aadeff';
      ctx.fillRect(hx + hw * 0.1, hy + hh * 0.2, hw * 0.22, hw * 0.18);
      ctx.fillRect(hx + hw * 0.68, hy + hh * 0.2, hw * 0.22, hw * 0.18);
    }
  }

  // Hjemnavn
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.floor(W * 0.022)}px Georgia`;
  ctx.textAlign = 'center';
  ctx.fillText(gameState.home.name, hx + hw / 2, hy - hh * 0.08);
}

function drawHUD(ctx, W, H) {
  const p = gameState.player;

  // HUD bakgrunn
  ctx.fillStyle = 'rgba(20,10,5,0.85)';
  roundRect(ctx, W * 0.01, H * 0.01, W * 0.98, H * 0.09, 8);
  ctx.fill();
  ctx.strokeStyle = '#6b4e2a';
  ctx.lineWidth = 1.5;
  roundRect(ctx, W * 0.01, H * 0.01, W * 0.98, H * 0.09, 8);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f5c842';
  ctx.font = `bold ${Math.floor(W * 0.03)}px Georgia`;
  ctx.fillText(`${p.rank}  (Nivå ${p.level})`, W * 0.02, H * 0.06);

  // Ressurser
  const items = [
    { emoji: '🪙', val: p.gold,  label: 'Gull',  x: 0.35 },
    { emoji: '🍞', val: p.food,  label: 'Mat',   x: 0.52 },
    { emoji: '⭐', val: p.xp,   label: 'XP',    x: 0.69 },
  ];

  items.forEach(item => {
    ctx.fillStyle = '#c8a96e';
    ctx.font = `${Math.floor(W * 0.025)}px Georgia`;
    ctx.textAlign = 'left';
    ctx.fillText(`${item.emoji} ${item.val} ${item.label}`, W * item.x, H * 0.06);
  });

  // XP bar
  const nextXP = [0,100,300,600,1000,1500,2200,3000];
  const curXP = nextXP[p.level - 1] || 0;
  const nxtXP = nextXP[p.level] || nextXP[nextXP.length-1];
  const prog = Math.min((p.xp - curXP) / (nxtXP - curXP), 1);
  const barX = W * 0.85;
  const barW = W * 0.13;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, H * 0.035, barW, H * 0.025);
  ctx.fillStyle = '#f5c842';
  ctx.fillRect(barX, H * 0.035, barW * prog, H * 0.025);
  ctx.strokeStyle = '#6b4e2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, H * 0.035, barW, H * 0.025);
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.floor(W * 0.018)}px Georgia`;
  ctx.textAlign = 'center';
  ctx.fillText('Neste nivå', barX + barW / 2, H * 0.076);
}

function drawTaskPanel(ctx, W, H, mousePos, onClick) {
  const panelX = W * 0.67;
  const panelY = H * 0.12;
  const panelW = W * 0.31;
  const panelH = H * 0.86;

  ctx.fillStyle = 'rgba(20,10,5,0.88)';
  roundRect(ctx, panelX, panelY, panelW, panelH, 10);
  ctx.fill();
  ctx.strokeStyle = '#6b4e2a';
  ctx.lineWidth = 1.5;
  roundRect(ctx, panelX, panelY, panelW, panelH, 10);
  ctx.stroke();

  ctx.fillStyle = '#f5c842';
  ctx.font = `bold ${Math.floor(W * 0.028)}px Georgia`;
  ctx.textAlign = 'center';
  ctx.fillText('Oppgaver', panelX + panelW / 2, panelY + panelH * 0.065);

  const buttons = [];
  const tasks = gameState.tasks;
  const taskH = panelH * 0.155;
  const taskPad = panelH * 0.02;

  tasks.forEach((task, i) => {
    const ty = panelY + panelH * 0.1 + i * (taskH + taskPad);
    const tx = panelX + panelW * 0.04;
    const tw = panelW * 0.92;

    const hover = !task.done && mousePos.x > tx && mousePos.x < tx + tw &&
                  mousePos.y > ty && mousePos.y < ty + taskH;

    ctx.fillStyle = task.done
      ? 'rgba(30,70,30,0.7)'
      : hover ? 'rgba(80,55,20,0.95)' : 'rgba(50,35,10,0.85)';
    roundRect(ctx, tx, ty, tw, taskH, 7);
    ctx.fill();
    ctx.strokeStyle = task.done ? '#3a8a3a' : (hover ? '#f5c842' : '#6b4e2a');
    ctx.lineWidth = 1.2;
    roundRect(ctx, tx, ty, tw, taskH, 7);
    ctx.stroke();

    // Emoji
    ctx.font = `${Math.floor(taskH * 0.35)}px serif`;
    ctx.textAlign = 'left';
    ctx.fillText(task.emoji, tx + tw * 0.04, ty + taskH * 0.55);

    // Navn
    ctx.fillStyle = task.done ? '#5cb85c' : '#f5c842';
    ctx.font = `bold ${Math.floor(tw * 0.1)}px Georgia`;
    ctx.fillText(task.done ? '✓ ' + task.name : task.name, tx + tw * 0.22, ty + taskH * 0.38);

    // Belønning
    ctx.fillStyle = '#c8a96e';
    ctx.font = `${Math.floor(tw * 0.085)}px Georgia`;
    ctx.fillText(`⭐${task.xp} xp  🪙${task.gold}`, tx + tw * 0.22, ty + taskH * 0.7);

    if (!task.done) {
      buttons.push({ x: tx, y: ty, w: tw, h: taskH, taskId: task.id });
    }
  });

  // Neste dag knapp
  const btnY = panelY + panelH * 0.9;
  const btnX = panelX + panelW * 0.1;
  const btnW = panelW * 0.8;
  const btnH = panelH * 0.075;
  const btnHover = mousePos.x > btnX && mousePos.x < btnX + btnW &&
                   mousePos.y > btnY && mousePos.y < btnY + btnH;

  ctx.fillStyle = btnHover ? '#2d8a2d' : '#1a6a1a';
  roundRect(ctx, btnX, btnY, btnW, btnH, 8);
  ctx.fill();
  ctx.strokeStyle = '#5cb85c';
  ctx.lineWidth = 1.5;
  roundRect(ctx, btnX, btnY, btnW, btnH, 8);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(btnH * 0.5)}px Georgia`;
  ctx.textAlign = 'center';
  ctx.fillText('Neste dag ➡', btnX + btnW / 2, btnY + btnH * 0.67);

  if (onClick) onClick({ taskButtons: buttons, nextDay: { x: btnX, y: btnY, w: btnW, h: btnH } });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
