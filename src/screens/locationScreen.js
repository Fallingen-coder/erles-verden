import { LOCATIONS } from '../locations.js';

export function drawLocationSelect(ctx, canvas, mousePos, onClick) {
  const W = canvas.width;
  const H = canvas.height;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0d1b2a');
  grad.addColorStop(1, '#1a3a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5c842';
  ctx.font = `bold ${Math.floor(W * 0.05)}px Georgia`;
  ctx.fillText('Velg din startlokasjon', W / 2, H * 0.1);

  ctx.fillStyle = '#c8a96e';
  ctx.font = `${Math.floor(W * 0.025)}px Georgia`;
  ctx.fillText('Hvor vil du begynne eventyret ditt?', W / 2, H * 0.17);

  const cols = 2;
  const rows = 2;
  const padX = W * 0.05;
  const padY = H * 0.22;
  const gapX = W * 0.04;
  const gapY = H * 0.04;
  const cardW = (W - padX * 2 - gapX) / cols;
  const cardH = (H - padY - H * 0.08 - gapY) / rows;

  const buttons = [];

  LOCATIONS.forEach((loc, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padX + col * (cardW + gapX);
    const y = padY + row * (cardH + gapY);

    const hover = mousePos.x > x && mousePos.x < x + cardW &&
                  mousePos.y > y && mousePos.y < y + cardH;

    // Kort bakgrunn
    ctx.fillStyle = hover ? 'rgba(80,60,30,0.95)' : 'rgba(40,30,15,0.9)';
    roundRect(ctx, x, y, cardW, cardH, 12);
    ctx.fill();

    ctx.strokeStyle = hover ? '#f5c842' : '#6b4e2a';
    ctx.lineWidth = hover ? 2.5 : 1.5;
    roundRect(ctx, x, y, cardW, cardH, 12);
    ctx.stroke();

    // Emoji
    ctx.font = `${Math.floor(cardH * 0.25)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(loc.emoji, x + cardW / 2, y + cardH * 0.32);

    // Navn
    ctx.fillStyle = '#f5c842';
    ctx.font = `bold ${Math.floor(cardW * 0.09)}px Georgia`;
    ctx.fillText(loc.name, x + cardW / 2, y + cardH * 0.52);

    // Vanskelighetsgrad
    const diffColor = { 'Lett': '#5cb85c', 'Middels': '#f0ad4e', 'Vanskelig': '#d9534f', 'Ekspert': '#9b59b6' };
    ctx.fillStyle = diffColor[loc.difficulty] || '#aaa';
    ctx.font = `${Math.floor(cardW * 0.07)}px Georgia`;
    ctx.fillText(loc.difficulty, x + cardW / 2, y + cardH * 0.65);

    // Beskrivelse (forkortet)
    ctx.fillStyle = '#c8a96e';
    ctx.font = `${Math.floor(cardW * 0.06)}px Georgia`;
    wrapText(ctx, loc.description, x + cardW / 2, y + cardH * 0.78, cardW * 0.88, cardH * 0.07);

    buttons.push({ x, y, w: cardW, h: cardH, action: 'startGame', location: loc });
  });

  if (onClick) onClick(buttons);
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

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxW && i > 0) {
      ctx.fillText(line, cx, y);
      line = words[i] + ' ';
      y += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, cx, y);
}
