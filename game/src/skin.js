// Dusk skin library: every surface of YARD 7 painted on canvas, no external
// assets. Seeded so the yard looks the same on every load.
import * as THREE from 'three';

function seedRand(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry); t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function speckle(g, w, h, r, n, dark, light) {
  for (let i = 0; i < n; i += 1) {
    g.fillStyle = r() < 0.55 ? dark : light;
    g.globalAlpha = 0.05 + r() * 0.12;
    const s = 1 + r() * 3;
    g.fillRect(r() * w, r() * h, s, s);
  }
  g.globalAlpha = 1;
}
function crack(g, w, h, r, x, y, len, col = 'rgba(8,8,10,0.55)') {
  g.strokeStyle = col; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y);
  let px = x; let py = y;
  for (let s = 0; s < 6; s += 1) { px += (r() - 0.5) * len; py += r() * len * 0.5; g.lineTo(px, py); }
  g.stroke();
}
function streak(g, w, h, r, n, col, ay) {
  for (let i = 0; i < n; i += 1) {
    const x = r() * w; const y = r() * h * 0.6; const len = 20 + r() * 90;
    const gr = g.createLinearGradient(x, y, x, y + len);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.globalAlpha = ay;
    g.fillRect(x, y, 3 + r() * 7, len);
  }
  g.globalAlpha = 1;
}
function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) * f)) | 0;
  const gg = Math.min(255, Math.max(0, ((n >> 8) & 255) * f)) | 0;
  const b = Math.min(255, Math.max(0, (n & 255) * f)) | 0;
  return `rgb(${r},${gg},${b})`;
}

function brickPaint(base, mortar, seed, lit = 0) {
  const r = seedRand(seed);
  const [c, g] = cv(512, 512);
  g.fillStyle = mortar; g.fillRect(0, 0, 512, 512);
  const bh = 26; const bw = 74;
  for (let y = 0; y < 512; y += bh) {
    const off = (y / bh) % 2 ? bw / 2 : 0;
    for (let x = -bw; x < 512 + bw; x += bw) {
      const f = 0.82 + r() * 0.36;
      g.fillStyle = shadeHex(base, f);
      g.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
      if (r() < 0.12) { // chipped brick, dark mortar showing
        g.fillStyle = 'rgba(20,16,12,0.5)';
        g.fillRect(x + off + 2, y + 2, (bw - 4) * (0.3 + r() * 0.5), bh - 4);
      }
    }
  }
  speckle(g, 512, 512, r, 900, 'rgba(0,0,0,0.25)', 'rgba(255,235,200,0.10)');
  streak(g, 512, 512, r, 7, 'rgba(122,62,28,0.5)', 0.5); // rust weep
  if (lit) { // a few lit windows punched into the brick
    for (let i = 0; i < lit; i += 1) {
      const x = 40 + r() * 400; const y = 40 + r() * 380;
      g.fillStyle = '#1a1210'; g.fillRect(x - 4, y - 4, 62, 78);
      g.fillStyle = r() < 0.6 ? '#ffc06a' : '#2a2f3a';
      g.fillRect(x, y, 54, 70);
      g.fillStyle = '#1a1210';
      g.fillRect(x + 25, y, 4, 70); g.fillRect(x, y + 33, 54, 4);
      g.strokeStyle = '#0d0f13'; g.lineWidth = 5; g.strokeRect(x - 4, y - 4, 62, 78);
    }
  }
  for (let i = 0; i < 5; i += 1) crack(g, 512, 512, r, r() * 512, r() * 200, 26);
  return c;
}

function corrugPaint(base, seed, rusty) {
  const r = seedRand(seed);
  const [c, g] = cv(512, 512);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 16) {
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x, 0, 5, 512);
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 9, 0, 4, 512);
  }
  speckle(g, 512, 512, r, 700, 'rgba(0,0,0,0.22)', 'rgba(255,255,255,0.07)');
  if (rusty) {
    for (let i = 0; i < 26; i += 1) {
      const x = r() * 512; const y = r() * 512; const rad = 8 + r() * 42;
      const gr = g.createRadialGradient(x, y, 2, x, y, rad);
      gr.addColorStop(0, 'rgba(140,66,26,0.65)'); gr.addColorStop(1, 'rgba(140,66,26,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    }
    streak(g, 512, 512, r, 9, 'rgba(120,54,20,0.55)', 0.55);
  }
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, 512, 10); g.fillRect(0, 502, 512, 10);
  return c;
}

function concretePaint(base, seed) {
  const r = seedRand(seed);
  const [c, g] = cv(512, 512);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  speckle(g, 512, 512, r, 1600, 'rgba(0,0,0,0.20)', 'rgba(255,255,255,0.06)');
  for (let i = 0; i < 9; i += 1) { // damp stains
    const x = r() * 512; const y = r() * 512; const rad = 30 + r() * 90;
    const gr = g.createRadialGradient(x, y, 4, x, y, rad);
    gr.addColorStop(0, 'rgba(10,10,12,0.4)'); gr.addColorStop(1, 'rgba(10,10,12,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
  }
  streak(g, 512, 512, r, 6, 'rgba(122,62,28,0.45)', 0.45);
  for (let i = 0; i < 6; i += 1) crack(g, 512, 512, r, r() * 512, r() * 300, 30);
  for (let i = 0; i < 4; i += 1) { // peeling paint flakes
    g.fillStyle = 'rgba(233,226,210,0.5)';
    g.fillRect(r() * 480, r() * 480, 8 + r() * 22, 5 + r() * 12);
  }
  return c;
}

function asphaltPaint() {
  const r = seedRand(77);
  const [c, g] = cv(1024, 832);
  g.fillStyle = '#33363e'; g.fillRect(0, 0, 1024, 832);
  speckle(g, 1024, 832, r, 5200, 'rgba(0,0,0,0.16)', 'rgba(255,255,255,0.05)');
  for (let i = 0; i < 7; i += 1) { // tar patches
    g.fillStyle = 'rgba(16,16,20,0.55)';
    const x = r() * 900; const y = r() * 700;
    g.fillRect(x, y, 60 + r() * 140, 40 + r() * 90);
  }
  for (let i = 0; i < 26; i += 1) crack(g, 1024, 832, r, r() * 1024, r() * 832, 34);
  g.strokeStyle = 'rgba(10,10,12,0.5)'; g.lineWidth = 9; // tyre tracks
  for (const x of [150, 300, 700, 870, 500]) {
    g.beginPath(); g.moveTo(x, 20);
    g.lineTo(x + (r() * 24 - 12), 812); g.stroke();
    g.beginPath(); g.moveTo(x + 26, 20);
    g.lineTo(x + 26 + (r() * 24 - 12), 812); g.stroke();
  }
  for (let i = 0; i < 14; i += 1) { // oil stains
    const x = r() * 1024; const y = r() * 832; const rad = 14 + r() * 46;
    const gr = g.createRadialGradient(x, y, 2, x, y, rad);
    gr.addColorStop(0, 'rgba(8,8,10,0.65)'); gr.addColorStop(1, 'rgba(8,8,10,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
  }
  for (let i = 0; i < 22; i += 1) { // footprints in dust
    g.fillStyle = 'rgba(190,180,160,0.28)';
    g.beginPath(); g.ellipse(r() * 1024, r() * 832, 4, 8, r() * 3, 0, 7); g.fill();
  }
  for (let i = 0; i < 40; i += 1) { // dry leaves
    g.fillStyle = r() < 0.5 ? 'rgba(150,110,50,0.7)' : 'rgba(120,80,40,0.7)';
    g.beginPath(); g.ellipse(r() * 1024, r() * 832, 3 + r() * 4, 2 + r() * 2, r() * 3, 0, 7); g.fill();
  }
  for (let i = 0; i < 26; i += 1) { // glass glints
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(r() * 1024, r() * 832, 2, 2);
  }
  // (Unique yard features — manhole, drain, painted bay numbers — live as
  // separate 3D decals in props.js, so this tileable layer stays generic.)
  return c;
}

function hazardPaint() {
  const [c, g] = cv(256, 64);
  g.fillStyle = '#c9971f'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#14161a';
  for (let x = -64; x < 256; x += 64) {
    g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 32, 0); g.lineTo(x + 64, 0); g.lineTo(x + 32, 64); g.fill();
  }
  return c;
}
function meshPaint() {
  const [c, g] = cv(128, 128);
  g.clearRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(120,128,140,0.9)'; g.lineWidth = 2;
  for (let i = 0; i <= 128; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
  }
  return c;
}
function woodPaint(seed, stencil) {
  const r = seedRand(seed);
  const [c, g] = cv(256, 256);
  g.fillStyle = '#6b5a41'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 42) {
    g.fillStyle = shadeHex('#6b5a41', 0.85 + r() * 0.3);
    g.fillRect(0, y + 2, 256, 38);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y, 256, 3);
    for (let i = 0; i < 8; i += 1) {
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y + 6 + r() * 30); g.bezierCurveTo(80, y + r() * 38, 170, y + r() * 38, 256, y + 6 + r() * 30); g.stroke();
    }
  }
  if (stencil) {
    g.fillStyle = 'rgba(233,226,210,0.75)'; g.font = 'bold 34px system-ui, sans-serif';
    g.textAlign = 'center'; g.fillText(stencil, 128, 132);
  }
  return c;
}
function posterPaint(title, sub, hue, seed) {
  const r = seedRand(seed);
  const [c, g] = cv(256, 340);
  g.fillStyle = '#d8cdb4'; g.fillRect(0, 0, 256, 340);
  g.fillStyle = hue; g.fillRect(0, 0, 256, 96);
  g.fillStyle = '#efe8d6'; g.font = 'bold 44px system-ui, sans-serif'; g.textAlign = 'center';
  g.fillText(title, 128, 62);
  g.fillStyle = '#2a2620'; g.font = 'bold 26px system-ui, sans-serif';
  const words = sub.split(' ');
  let line = ''; let y = 140;
  for (const w of words) {
    if ((line + ' ' + w).length > 14) { g.fillText(line, 128, y); y += 32; line = w; }
    else line = line ? line + ' ' + w : w;
  }
  g.fillText(line, 128, y);
  g.fillStyle = 'rgba(60,40,20,0.35)';
  for (let i = 0; i < 8; i += 1) { g.beginPath(); g.arc(r() * 256, 120 + r() * 220, 10 + r() * 40, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(70, 0); g.lineTo(0, 52); g.fill();
  return c;
}
function signPaint(text, color, sub) {
  const [c, g] = cv(512, 128);
  g.fillStyle = '#14161c'; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(6, 6, 500, 116);
  g.fillStyle = color; g.font = 'bold 52px system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, sub ? 48 : 66);
  if (sub) { g.fillStyle = '#8b95a6'; g.font = '28px system-ui, sans-serif'; g.fillText(sub, 256, 96); }
  return c;
}
function skyPaint() {
  const [c, g] = cv(32, 512);
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#141a2c'); gr.addColorStop(0.34, '#2c2c48');
  gr.addColorStop(0.55, '#5a3a4a'); gr.addColorStop(0.7, '#a85c33');
  gr.addColorStop(0.8, '#e08a3c'); gr.addColorStop(0.88, '#f5b25e');
  gr.addColorStop(1, '#3a2f22');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 512);
  g.fillStyle = 'rgba(245,178,94,0.5)';
  for (let i = 0; i < 5; i += 1) g.fillRect(0, 300 + i * 14, 32, 3);
  return c;
}
function dirtPaint(seed) {
  const r = seedRand(seed);
  const [c, g] = cv(256, 256);
  g.fillStyle = '#4a3d2c'; g.fillRect(0, 0, 256, 256);
  speckle(g, 256, 256, r, 500, 'rgba(0,0,0,0.25)', 'rgba(220,200,160,0.12)');
  for (let i = 0; i < 12; i += 1) {
    g.fillStyle = 'rgba(30,24,16,0.5)';
    g.beginPath(); g.arc(r() * 256, r() * 256, 2 + r() * 5, 0, 7); g.fill();
  }
  return c;
}

export function buildSkin() {
  const mat = (map, rough = 0.9, metal = 0.05) => new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: metal });
  const flat = (color, rough = 0.9, metal = 0.05) => new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: metal });
  return {
    sky: tex(skyPaint()),
    brick: mat(tex(brickPaint('#7a4a30', '#3a3230', 11, 3), 4, 2), 0.95, 0.02),
    brickDark: mat(tex(brickPaint('#5a3a28', '#2e2826', 23, 0), 3, 2), 0.95, 0.02),
    corrugated: mat(tex(corrugPaint('#3f6f6a', 31, false), 3, 1), 0.8, 0.25),
    corrugatedRust: mat(tex(corrugPaint('#8a5a3a', 47, true), 3, 1), 0.85, 0.25),
    corrugatedGrey: mat(tex(corrugPaint('#4a5058', 59, true), 3, 1), 0.8, 0.3),
    concrete: mat(tex(concretePaint('#4a4d55', 67), 3, 2), 0.95, 0.03),
    concreteDark: mat(tex(concretePaint('#262a31', 71), 3, 2), 0.95, 0.03),
    rust: mat(tex(corrugPaint('#7a4a26', 83, true), 2, 1), 0.85, 0.3),
    asphalt: mat(tex(asphaltPaint(), 6, 5), 0.96, 0.02),
    dirt: mat(tex(dirtPaint(97), 2, 2), 1, 0),
    hazard: mat(tex(hazardPaint(), 6, 1), 0.85, 0.1),
    mesh: new THREE.MeshStandardMaterial({
      map: tex(meshPaint(), 4, 2), transparent: true, side: THREE.DoubleSide,
      roughness: 0.6, metalness: 0.5, depthWrite: false,
    }),
    wood: mat(tex(woodPaint(103, 'SCRAP'), 1, 1), 0.9, 0.05),
    woodPlain: mat(tex(woodPaint(107, ''), 1, 1), 0.9, 0.05),
    sand: flat('#7a6a4e', 0.95, 0.02),
    rubber: flat('#15161a', 0.9, 0.05),
    steel: flat('#3d4554', 0.6, 0.45),
    darkMetal: flat('#17191f', 0.9, 0.1),
    yellowPaint: flat('#c9971f', 0.7, 0.3),
    brass: flat('#c9971f', 0.35, 0.7),
    posterA: mat(tex(posterPaint('SCRAP', 'WE BUY IRON COPPER BRASS', '#8a3a22', 113)), 0.95, 0),
    posterB: mat(tex(posterPaint('YARD 7', 'OPEN 06:00 — 22:00 CASH PAID', '#2c4a5e', 127)), 0.95, 0),
    makeSign(text, color, sub) { return tex(signPaint(text, color, sub)); },
    makePoster(title, sub, hue, seed) { return tex(posterPaint(title, sub, hue, seed)); },
  };
}
