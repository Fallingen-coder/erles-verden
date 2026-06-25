import { gameState } from '../gameState.js';

export function drawMenu(ctx, canvas, mousePos, onClick) {
  const W = canvas.width;
  const H = canvas.height;

  // Bakgrunn
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0d1b2a');
  grad.addColorStop(1, '#1a3a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stjerner
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 60; i++) {
    const x = (i * 137.5) % W;
    const y = (i * 97.3) % (H * 0.6);
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tittel
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5c842';
  ctx.font = `bold ${Math.floor(W * 0.08)}px Georgia`;
  ctx.fillText('Erles Verden', W / 2, H * 0.22);

  ctx.fillStyle = '#c8a96e';
  ctx.font = `${Math.floor(W * 0.03)}px Georgia`;
  ctx.fillText('Bygg ditt hjem, styr ditt rike', W / 2, H * 0.32);

  // Start-knapp
  const btnW = W * 0.35;
  const btnH = H * 0.1;
  const btnX = W / 2 - btnW / 2;
  const btnY = H * 0.5;

  const hover = mousePos.x > btnX && mousePos.x < btnX + btnW &&
                mousePos.y > btnY && mousePos.y < btnY + btnH;

  ctx.fillStyle = hover ? '#e6a020' : '#c8821a';
  roundRect(ctx, btnX, btnY, btnW, btnH, 10);
  ctx.fill();
  ctx.strokeStyle = '#f5c842';
  ctx.lineWidth = 2;
  roundRect(ctx, btnX, btnY, btnW, btnH, 10);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(W * 0.035)}px Georgia`;
  ctx.fillText('Start spill', W / 2, btnY + btnH * 0.63);

  if (onClick) {
    onClick({ x: btnX, y: btnY, w: btnW, h: btnH, action: 'locationSelect' });
  }
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
