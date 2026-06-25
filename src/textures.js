import * as THREE from 'three';

function makeCanvas(size, drawFn) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  drawFn(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export const textures = {};

export function loadTextures() {
  // Gress
  textures.grass = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#4a7c2f';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const l = Math.random() * 8 + 2;
      ctx.strokeStyle = `hsl(${100 + Math.random()*30},${50+Math.random()*30}%,${25+Math.random()*20}%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random()-0.5)*3, y - l);
      ctx.stroke();
    }
    // Mørkere flekker
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.08})`;
      ctx.beginPath();
      ctx.ellipse(Math.random()*s, Math.random()*s, Math.random()*12+3, Math.random()*8+2, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
  });

  // Jord/sti
  textures.dirt = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `hsl(25,${40+Math.random()*20}%,${25+Math.random()*25}%)`;
      ctx.beginPath();
      ctx.ellipse(Math.random()*s, Math.random()*s, Math.random()*5+1, Math.random()*3+1, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
  });

  // Stein
  textures.stone = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 60; i++) {
      const x = Math.random()*s, y = Math.random()*s, r = Math.random()*10+3;
      ctx.fillStyle = `hsl(0,0%,${40+Math.random()*30}%)`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r*0.6, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
    // Sprekkjer
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.1+Math.random()*0.15})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.random()*s, Math.random()*s);
      ctx.lineTo(Math.random()*s, Math.random()*s);
      ctx.stroke();
    }
  });

  // Tre (stamme)
  textures.wood = makeCanvas(64, (ctx, s) => {
    ctx.fillStyle = '#5c3d1e';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 4) {
      ctx.fillStyle = `hsl(25,${45+Math.random()*20}%,${20+Math.random()*20}%)`;
      ctx.fillRect(0, y, s, 2);
    }
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.15})`;
      ctx.fillRect(Math.random()*s, Math.random()*s, Math.random()*3+1, Math.random()*6+2);
    }
  });

  // Løvverk
  textures.leaves = makeCanvas(64, (ctx, s) => {
    ctx.fillStyle = '#2d6a1f';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 300; i++) {
      const x = Math.random()*s, y = Math.random()*s;
      ctx.fillStyle = `hsl(${110+Math.random()*30},${50+Math.random()*30}%,${18+Math.random()*20}%)`;
      ctx.beginPath();
      ctx.ellipse(x, y, Math.random()*5+2, Math.random()*4+1, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
  });

  // Mur/vegg (hus)
  textures.wall = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#c8a96e';
    ctx.fillRect(0, 0, s, s);
    // Tømmerstokker / planker
    const h = 12;
    for (let y = 0; y < s; y += h) {
      const offset = ((y / h) % 2 === 0) ? 0 : s/2;
      ctx.fillStyle = `hsl(30,${40+Math.random()*20}%,${55+Math.random()*15}%)`;
      ctx.fillRect(0, y, s, h - 1);
      // Fuger
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, y + h - 1, s, 1);
      ctx.fillRect(offset + s/2 - 0.5, y, 1, h);
    }
  });

  // Tak (shingles)
  textures.roof = makeCanvas(64, (ctx, s) => {
    ctx.fillStyle = '#7a1a1a';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 6) {
      for (let x = (y%2)*8; x < s; x += 16) {
        ctx.fillStyle = `hsl(0,${50+Math.random()*20}%,${25+Math.random()*15}%)`;
        ctx.fillRect(x, y, 14, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x, y+5, 14, 1);
      }
    }
  });

  // Vann
  textures.water = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#3a8fc1';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.05+Math.random()*0.1})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const x = Math.random()*s, y = Math.random()*s;
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x+10, y-5, x+20, y+5, x+30, y);
      ctx.stroke();
    }
  });

  // Sand/sti
  textures.sand = makeCanvas(64, (ctx, s) => {
    ctx.fillStyle = '#c8a050';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `hsl(40,${30+Math.random()*20}%,${55+Math.random()*20}%)`;
      ctx.fillRect(Math.random()*s, Math.random()*s, Math.random()*3, Math.random()*3);
    }
  });
}
