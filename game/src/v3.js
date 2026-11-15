// YARD 7 — dressing putaran ketiga: siluet gedung berlapis, bukan kotak datar.
// Lapis dekat (fasad hidup di atas blok v2 + 2 gedung baru di sayap), lapis
// tengah (fasad + parapet + atap di atas kotak skyline world.js), lapis jauh
// (siluet kota berkabut), plus hiasan dinding dalam yard. Semua murni visual:
// tanpa collider, tanpa state gameplay, tanpa mengubah statistik. Diimpor
// PALING AKHIR dari main.js supaya teks dossier yang hampir penuh memotong
// file ini duluan; game tetap merendernya.
import * as THREE from 'three';

function acakBenih(benih) {
  let a = benih | 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lukisKanvas(lebar, tinggi, lukis) {
  const kanvas = document.createElement('canvas');
  kanvas.width = lebar; kanvas.height = tinggi;
  lukis(kanvas.getContext('2d'), lebar, tinggi);
  const tekstur = new THREE.CanvasTexture(kanvas);
  tekstur.colorSpace = THREE.SRGBColorSpace;
  tekstur.anisotropy = 4;
  return tekstur;
}

function matDasar(teks, kasar = 0.9, logam = 0.05) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(teks), roughness: kasar, metalness: logam });
}
function matPolos(teks) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(teks) });
}
function matGambar(peta) {
  return new THREE.MeshBasicMaterial({ map: peta });
}
function teduhHex(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) * f)) | 0;
  const gg = Math.min(255, Math.max(0, ((n >> 8) & 255) * f)) | 0;
  const b = Math.min(255, Math.max(0, (n & 255) * f)) | 0;
  return `rgb(${r},${gg},${b})`;
}

// ---- fasad hidup: dinding (bata / beton / korugasi) + grid jendela yang
// bervariasi (hangat menyala, dingin redup, gelap, tirai, gorden) + noda.
// lebar/tinggi dalam meter; tekstur 512px, jendela ~1,1 x 1,35 m.
function catFasad(lebar, tinggi, benih, gaya, redup = 1) {
  const acak = acakBenih(benih);
  const W = 512;
  const H = Math.max(160, Math.min(512, Math.round((512 * tinggi) / lebar)));
  return lukisKanvas(W, H, (g) => {
    if (gaya === 'bata') {
      g.fillStyle = '#3a3230'; g.fillRect(0, 0, W, H);
      const bh = 22; const bw = 62;
      for (let y = 0; y < H; y += bh) {
        const off = (y / bh) % 2 ? bw / 2 : 0;
        for (let x = -bw; x < W + bw; x += bw) {
          g.fillStyle = teduhHex('#7a4a30', 0.8 + acak() * 0.4);
          g.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
          if (acak() < 0.12) {
            g.fillStyle = 'rgba(20,16,12,0.5)';
            g.fillRect(x + off + 2, y + 2, (bw - 4) * (0.3 + acak() * 0.5), bh - 4);
          }
        }
      }
    } else if (gaya === 'korugasi') {
      g.fillStyle = '#3f6f6a'; g.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 14) {
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, 0, 4, H);
        g.fillStyle = 'rgba(255,255,255,0.09)'; g.fillRect(x + 8, 0, 3, H);
      }
      for (let i = 0; i < 18; i += 1) {
        const x = acak() * W; const y = acak() * H; const rad = 8 + acak() * 34;
        const gr = g.createRadialGradient(x, y, 2, x, y, rad);
        gr.addColorStop(0, 'rgba(140,66,26,0.55)'); gr.addColorStop(1, 'rgba(140,66,26,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
      }
    } else { // beton
      g.fillStyle = '#4a4d55'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 900; i += 1) {
        g.fillStyle = acak() < 0.55 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)';
        g.globalAlpha = 0.05 + acak() * 0.12;
        const s = 1 + acak() * 3;
        g.fillRect(acak() * W, acak() * H, s, s);
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 6; i += 1) {
        const x = acak() * W; const y = acak() * H; const rad = 26 + acak() * 70;
        const gr = g.createRadialGradient(x, y, 4, x, y, rad);
        gr.addColorStop(0, 'rgba(10,10,12,0.4)'); gr.addColorStop(1, 'rgba(10,10,12,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
      }
    }
    // Grid jendela dengan variasi keadaan.
    const kolom = Math.max(2, Math.floor(lebar / 1.15));
    const baris = Math.max(1, Math.floor(tinggi / 1.35));
    const cw = W / kolom; const ch = H / baris;
    for (let r = 0; r < baris; r += 1) {
      for (let c = 0; c < kolom; c += 1) {
        const x = c * cw + cw * 0.18; const y = r * ch + ch * 0.16;
        const w = cw * 0.64; const h = ch * 0.68;
        const roll = acak();
        g.fillStyle = '#101216'; g.fillRect(x - 3, y - 3, w + 6, h + 6);
        if (roll < 0.34 * redup + 0.06) { // hangat menyala
          const grad = g.createLinearGradient(0, y, 0, y + h);
          grad.addColorStop(0, '#ffd9a0'); grad.addColorStop(1, '#e08a2e');
          g.fillStyle = grad; g.fillRect(x, y, w, h);
          g.fillStyle = 'rgba(20,14,8,0.85)';
          g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x, y + h / 2 - 2, w, 4);
          if (acak() < 0.3) { g.fillStyle = '#3a3f47'; g.fillRect(x + 2, y + h + 2, w * 0.6, 7); }
        } else if (roll < 0.5) { // dingin redup
          const grad = g.createLinearGradient(0, y, 0, y + h);
          grad.addColorStop(0, '#5a708a'); grad.addColorStop(1, '#2c3a4a');
          g.fillStyle = grad; g.fillRect(x, y, w, h);
          g.fillStyle = 'rgba(230,235,240,0.35)';
          g.fillRect(x + 4, y + 6, w * 0.5, 3); g.fillRect(x + 4, y + 14, w * 0.35, 3);
        } else if (roll < 0.62) { // tirai
          g.fillStyle = '#2a2f3a'; g.fillRect(x, y, w, h);
          g.fillStyle = 'rgba(200,205,215,0.5)';
          for (let s = 0; s < 4; s += 1) g.fillRect(x + 2, y + 4 + s * (h / 4), w - 4, 2);
        } else if (roll < 0.72) { // gorden setengah tertutup
          g.fillStyle = '#1c2733'; g.fillRect(x, y, w, h);
          g.fillStyle = '#c9b18a'; g.fillRect(x, y, w, h * 0.45);
          g.fillStyle = 'rgba(0,0,0,0.3)';
          for (let s = 0; s < 3; s += 1) g.fillRect(x + s * (w / 3), y, 2, h * 0.45);
        } else { // gelap
          g.fillStyle = '#12141a'; g.fillRect(x, y, w, h);
          g.fillStyle = 'rgba(120,130,150,0.25)'; g.fillRect(x, y, w, 2);
        }
      }
    }
    // Noda bawah + rembesan karat + retak.
    const grBawah = g.createLinearGradient(0, H - 60, 0, H);
    grBawah.addColorStop(0, 'rgba(5,5,8,0)'); grBawah.addColorStop(1, 'rgba(5,5,8,0.55)');
    g.fillStyle = grBawah; g.fillRect(0, H - 60, W, 60);
    for (let i = 0; i < 5; i += 1) {
      const x = acak() * W; const y = acak() * H * 0.5; const len = 20 + acak() * 70;
      const gr = g.createLinearGradient(x, y, x, y + len);
      gr.addColorStop(0, 'rgba(122,62,28,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x, y, 3 + acak() * 6, len);
    }
    g.strokeStyle = 'rgba(8,8,10,0.55)'; g.lineWidth = 1.4;
    for (let i = 0; i < 3; i += 1) {
      let px = acak() * W; let py = acak() * H * 0.4;
      g.beginPath(); g.moveTo(px, py);
      for (let s = 0; s < 5; s += 1) { px += (acak() - 0.5) * 26; py += acak() * 14; g.lineTo(px, py); }
      g.stroke();
    }
  });
}

export function dressV3(scene) {
  const grup = new THREE.Group();
  scene.add(grup);

  const letak = (mesh, x, y, z, putarY = 0) => {
    mesh.position.set(x, y, z);
    if (putarY) mesh.rotation.y = putarY;
    grup.add(mesh);
    return mesh;
  };
  const kotak = (l, t, d, bahan) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(l, t, d), bahan);
    return m;
  };
  const datar = (l, t, bahan) => new THREE.Mesh(new THREE.PlaneGeometry(l, t), bahan);
  const tabung = (rAtas, rBawah, tinggi, bahan, segmen = 12) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rAtas, rBawah, tinggi, segmen), bahan);
    return m;
  };
  const acak = acakBenih(20261115);

  const gelapAtap = matDasar('#1a1e26', 0.9, 0.05);
  const bajaGelap = matDasar('#262a31', 0.6, 0.45);
  const ujungMerah = matPolos('#ff2e1f');
  const lampuHangat = matPolos('#ffd9a0');

  // ---- props atap: tangki air, unit AC, ventilasi, cerobong, antena.
  const tangki = (x, yAtas, z, r = 1.0) => {
    letak(tabung(r, r, 1.8, gelapAtap, 12), x, yAtas + 0.9, z);
    letak(tabung(0.02, r, 0.65, gelapAtap, 12), x, yAtas + 2.1, z);
    letak(tabung(r * 0.25, r * 0.25, 0.3, bajaGelap, 8), x, yAtas + 2.5, z);
  };
  const acUnit = (x, yAtas, z, w = 1.1) => {
    letak(kotak(w, 0.7, 0.8, bajaGelap), x, yAtas + 0.35, z);
    letak(tabung(0.28, 0.28, 0.06, matDasar('#101216', 0.7, 0.2), 12), x, yAtas + 0.72, z).rotation.x = 0;
  };
  const ventilasi = (x, yAtas, z) => {
    letak(tabung(0.28, 0.34, 1.1, bajaGelap, 10), x, yAtas + 0.55, z);
    letak(tabung(0.4, 0.4, 0.1, gelapAtap, 10), x, yAtas + 1.1, z);
  };
  const cerobong = (x, yAtas, z, tinggi = 2.2) => {
    letak(kotak(0.7, tinggi, 0.7, matDasar('#5a3a28', 0.9, 0.05)), x, yAtas + tinggi / 2, z);
    letak(kotak(0.9, 0.16, 0.9, gelapAtap), x, yAtas + tinggi + 0.08, z);
  };
  const antena = (x, yAtas, z, tinggi) => {
    letak(kotak(0.13, tinggi, 0.13, gelapAtap), x, yAtas + tinggi / 2, z);
    const ujung = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), ujungMerah);
    letak(ujung, x, yAtas + tinggi + 0.12, z);
  };
  const parapet = (x, yAtas, z, w, d) => {
    const t = 0.18; const h = 0.35;
    letak(kotak(w, h, t, gelapAtap), x, yAtas + h / 2, z - d / 2 + t / 2);
    letak(kotak(w, h, t, gelapAtap), x, yAtas + h / 2, z + d / 2 - t / 2);
    letak(kotak(t, h, d, gelapAtap), x - w / 2 + t / 2, yAtas + h / 2, z);
    letak(kotak(t, h, d, gelapAtap), x + w / 2 - t / 2, yAtas + h / 2, z);
  };
  const atapBertingkat = (x, yAtas, z, w, d) => {
    const sw = w * (0.5 + acak() * 0.2); const sd = d * (0.6 + acak() * 0.2);
    const sh = 0.8 + acak() * 0.6;
    letak(kotak(sw, sh, sd, matDasar('#20242c', 0.9, 0.05)), x + (acak() - 0.5) * w * 0.2, yAtas + sh / 2, z);
  };

  // ---- fasad hidup di atas muka: bidang datar + lampu dinding + halo.
  // muka: 'S' (menghadap +z, ke yard), 'N' (-z), 'E' (+x), 'W' (-x).
  const fasad = (x, yBawah, yAtas, zMuka, lebar, gaya, benih, muka = 'S', redup = 1) => {
    const tinggi = yAtas - yBawah;
    if (tinggi < 0.4) return;
    const peta = catFasad(lebar, tinggi, benih, gaya, redup);
    const bidang = datar(lebar, tinggi, matGambar(peta));
    const yTengah = yBawah + tinggi / 2;
    if (muka === 'S') letak(bidang, x, yTengah, zMuka + 0.06, 0);
    else if (muka === 'N') letak(bidang, x, yTengah, zMuka - 0.06, Math.PI);
    else if (muka === 'E') letak(bidang, x, yTengah, zMuka, Math.PI / 2);
    else letak(bidang, x, yTengah, zMuka, -Math.PI / 2);
  };
  const lampuDinding = (x, y, z) => {
    letak(kotak(0.3, 0.06, 0.06, bajaGelap), x, y + 0.09, z);
    letak(kotak(0.16, 0.1, 0.12, lampuHangat), x, y, z + 0.02);
    const halo = lukisKanvas(128, 128, (g) => {
      const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, 'rgba(255, 200, 120, 0.5)');
      grad.addColorStop(0.5, 'rgba(255, 180, 90, 0.16)');
      grad.addColorStop(1, 'rgba(255, 180, 90, 0)');
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    });
    const pijar = new THREE.Sprite(new THREE.SpriteMaterial({
      map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    pijar.position.set(x, y, z + 0.14);
    pijar.scale.set(1.5, 1.5, 1);
    grup.add(pijar);
  };

  // ================= LAPIS DEKAT =================
  // Hiasi blok v2 (z -20,5..-22) di tempatnya: fasad hidup di pita yang
  // terlihat di atas tembok yard (y 4,0 ke atas) + parapet + atap bertingkat
  // + props atap. Kotak polos #232936 kini punya muka, atap, dan siluet.
  const dekat = [
    { x: -16, atas: 6.4, muka: -19, lebar: 8, z: -21, d: 4, gaya: 'bata', benih: 301 },
    { x: -9, atas: 5.2, muka: -18.5, lebar: 5, z: -20.5, d: 4, gaya: 'beton', benih: 302 },
    { x: 0, atas: 8.0, muka: -20, lebar: 10, z: -22, d: 4, gaya: 'korugasi', benih: 303 },
    { x: 9, atas: 5.6, muka: -18.5, lebar: 6, z: -20.5, d: 4, gaya: 'bata', benih: 304 },
    { x: 16, atas: 6.8, muka: -19, lebar: 8, z: -21, d: 4, gaya: 'beton', benih: 305 },
  ];
  for (const b of dekat) {
    fasad(b.x, 4.0, b.atas, b.muka, b.lebar, b.gaya, b.benih, 'S', 1);
    parapet(b.x, b.atas, b.z, b.lebar, b.d);
    atapBertingkat(b.x, b.atas, b.z, b.lebar, b.d);
  }
  tangki(-17.5, 6.4, -21, 0.9);
  acUnit(-13, 6.4, -21, 1.0);
  antena(-9, 5.2, -20.5, 2.6);
  cerobong(-2.5, 8.0, -22, 2.0);
  tangki(1.5, 8.0, -22, 1.1);
  ventilasi(4, 8.0, -22);
  acUnit(9, 5.6, -20.5, 0.9);
  antena(13, 6.8, -21, 3.0);
  cerobong(17.5, 6.8, -21, 1.8);
  lampuDinding(-12, 5.0, -18.94);
  lampuDinding(5, 6.6, -19.94);

  // Dua gedung baru di sayap (di luar jangkauan blok v2, x +/-25) supaya
  // lapis dekat tidak berhenti di x +/-20: badan + fasad + atap lengkap.
  const sayap = [
    { x: -25, w: 6, h: 9, gaya: 'bata', benih: 311 },
    { x: 25, w: 6, h: 7.5, gaya: 'korugasi', benih: 312 },
  ];
  for (const s of sayap) {
    const badan = kotak(s.w, s.h, 3, matDasar('#232936', 0.9, 0.05));
    letak(badan, s.x, s.h / 2, -21.5);
    fasad(s.x, 4.0, s.h, -20, s.w, s.gaya, s.benih, 'S', 1);
    parapet(s.x, s.h, -21.5, s.w, 3);
    atapBertingkat(s.x, s.h, -21.5, s.w, 3);
  }
  tangki(-26.5, 9, -21.5, 0.9);
  antena(-23, 9, -21.5, 3.2);
  acUnit(25, 7.5, -21.5, 1.0);
  cerobong(26.5, 7.5, -21.5, 2.0);

  // ================= LAPIS TENGAH =================
  // Hiasi kotak skyline world.js (fasad redup + parapet + atap) supaya
  // bagian atasnya yang muncul di atas lapis dekat tidak lagi polos.
  // Format world.js: [x, yTengah, z, lebar, tinggi, dalam] -> atas = yTengah + tinggi/2.
  const tengah = [
    { x: -30, atas: 12, muka: -24, lebar: 8, z: -26, d: 4, gaya: 'beton', benih: 321 },
    { x: -18, atas: 18, muka: -26, lebar: 10, z: -28, d: 4, gaya: 'bata', benih: 322 },
    { x: -4, atas: 10, muka: -26, lebar: 7, z: -28, d: 4, gaya: 'beton', benih: 323 },
    { x: 10, atas: 16, muka: -26, lebar: 9, z: -28, d: 4, gaya: 'korugasi', benih: 324 },
    { x: 26, atas: 12, muka: -24, lebar: 8, z: -26, d: 4, gaya: 'bata', benih: 325 },
    { x: 0, atas: 22, muka: -32, lebar: 12, z: -34, d: 4, gaya: 'beton', benih: 326 },
  ];
  for (const b of tengah) {
    fasad(b.x, 4.8, b.atas, b.muka, b.lebar, b.gaya, b.benih, 'S', 0.7);
    parapet(b.x, b.atas, b.z, b.lebar, b.d);
    atapBertingkat(b.x, b.atas, b.z, b.lebar, b.d);
  }
  acUnit(-27, 12, -26, 1.2);
  cerobong(-21, 18, -28, 2.6);
  antena(-14, 18, -28, 3.4);
  ventilasi(-6, 10, -28);
  acUnit(7, 16, -28, 1.1);
  cerobong(13, 16, -28, 2.4);
  antena(23, 12, -26, 3.0);
  tangki(-3, 22, -34, 1.2);
  antena(4, 22, -34, 4.0);

  // Sayap barat/timur (kotak world.js di sisi yard): fasad menghadap yard.
  const sisi = [
    { x: -30, yBawah: 0, atas: 14, z: 10, lebar: 8, gaya: 'bata', benih: 331, muka: 'E' },
    { x: 30, yBawah: 0, atas: 18, z: 6, lebar: 8, gaya: 'beton', benih: 332, muka: 'W' },
    { x: -35, yBawah: 0, atas: 10, z: -8, lebar: 6, gaya: 'korugasi', benih: 333, muka: 'E' },
    { x: 35, yBawah: 0, atas: 8, z: -14, lebar: 6, gaya: 'bata', benih: 334, muka: 'W' },
  ];
  for (const b of sisi) {
    const peta = catFasad(b.lebar, b.atas - b.yBawah, b.benih, b.gaya, 0.9);
    const bidang = datar(b.lebar, b.atas - b.yBawah, matGambar(peta));
    const yTengah = b.yBawah + (b.atas - b.yBawah) / 2;
    if (b.muka === 'E') letak(bidang, b.x + 0.06, yTengah, b.z, Math.PI / 2);
    else letak(bidang, b.x - 0.06, yTengah, b.z, -Math.PI / 2);
  }
  // Selatan (terlihat saat pemain menoleh ke spawn): fasad menghadap yard.
  const selatan = [
    { x: -26, atas: 8, muka: 21, lebar: 6, gaya: 'beton', benih: 341 },
    { x: 24, atas: 10, muka: 21, lebar: 7, gaya: 'bata', benih: 342 },
    { x: -12, atas: 14, muka: 28, lebar: 8, gaya: 'korugasi', benih: 343 },
  ];
  for (const b of selatan) {
    fasad(b.x, 0, b.atas, b.muka, b.lebar, b.gaya, b.benih, 'N', 0.8);
  }

  // ================= LAPIS JAUH =================
  // Siluet kota berkabut (z -44..-52, jarak 54-62 m dari kamera -> kabut
  // 0,64-0,82): gelap, jendela redup sedikit, suar merah di yang tertinggi.
  // Zona bulan (x 28..48) dijaga rendah (<=18) supaya bulan tetap bersih.
  const jauh = matPolos('#0f1218');
  const jendelaJauh = matPolos('#6a5a3a');
  const siluet = [
    { x: -52, w: 12, h: 20, z: -48 },
    { x: -38, w: 10, h: 24, z: -50 },
    { x: -20, w: 14, h: 18, z: -46 },
    { x: -4, w: 9, h: 26, z: -52 },
    { x: 12, w: 11, h: 16, z: -44 },
    { x: 26, w: 10, h: 17, z: -47 },
    { x: 44, w: 12, h: 15, z: -49 },
    { x: 56, w: 10, h: 22, z: -50 },
  ];
  for (const s of siluet) {
    letak(kotak(s.w, s.h, 4, jauh), s.x, s.h / 2, s.z);
    letak(kotak(s.w * 0.55, 1.2, 3, jauh), s.x, s.h + 0.6, s.z);
    const nj = 2 + Math.floor(acak() * 3);
    for (let i = 0; i < nj; i += 1) {
      const wx = s.x + (acak() - 0.5) * (s.w - 1.5);
      const wy = 7 + acak() * (s.h - 9);
      letak(datar(0.55, 0.75, jendelaJauh), wx, wy, s.z + 2.06);
    }
  }
  letak(new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), ujungMerah), -4, 27.4, -52);
  letak(new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), ujungMerah), -38, 25.4, -50);

  // ================= HIASAN DINDING DALAM YARD =================
  // Dinding besar yang polos (tembok utara, barat, timur, muka blok tengah).
  const stensil = (teks, x, y, z, putarY, lebar = 2.2) => {
    const peta = lukisKanvas(256, 128, (g) => {
      g.clearRect(0, 0, 256, 128);
      g.fillStyle = 'rgba(233,226,210,0.8)';
      g.font = 'bold 72px system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(teks, 128, 66);
    });
    const bidang = new THREE.Mesh(new THREE.PlaneGeometry(lebar, lebar / 2),
      new THREE.MeshBasicMaterial({ map: peta, transparent: true, depthWrite: false }));
    letak(bidang, x, y, z, putarY);
  };
  const rambu = (teks, sub, x, y, z, putarY, warna = '#f5a623') => {
    const peta = lukisKanvas(512, 128, (g) => {
      g.fillStyle = '#14161c'; g.fillRect(0, 0, 512, 128);
      g.strokeStyle = warna; g.lineWidth = 6; g.strokeRect(6, 6, 500, 116);
      g.fillStyle = warna; g.font = 'bold 52px system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(teks, 256, sub ? 48 : 66);
      if (sub) { g.fillStyle = '#8b95a6'; g.font = '28px system-ui, sans-serif'; g.fillText(sub, 256, 96); }
    });
    const bidang = datar(2.6, 0.65, matGambar(peta));
    letak(bidang, x, y, z, putarY);
  };
  const pipaTegak = (x, y0, y1, z, putarY = 0) => {
    const p = tabung(0.06, 0.06, y1 - y0, bajaGelap, 10);
    p.position.set(x, (y0 + y1) / 2, z);
    if (putarY) p.rotation.y = putarY;
    grup.add(p);
    letak(kotak(0.2, 0.26, 0.08, bajaGelap), x, y0 + 0.5, z, putarY);
    letak(kotak(0.2, 0.26, 0.08, bajaGelap), x, y1 - 0.5, z, putarY);
  };
  const stripHazard = (x, y, z, putarY, panjang = 6) => {
    const peta = lukisKanvas(512, 32, (g) => {
      g.fillStyle = '#c9971f'; g.fillRect(0, 0, 512, 32);
      g.fillStyle = '#14161a';
      for (let xx = -32; xx < 544; xx += 64) {
        g.beginPath(); g.moveTo(xx, 32); g.lineTo(xx + 32, 0); g.lineTo(xx + 64, 0); g.lineTo(xx + 32, 32); g.fill();
      }
    });
    letak(datar(panjang, 0.4, matGambar(peta)), x, y, z, putarY);
  };
  const poster = (judul, sub, warna, x, y, z, putarY) => {
    const peta = lukisKanvas(256, 340, (g) => {
      g.fillStyle = '#d8cdb4'; g.fillRect(0, 0, 256, 340);
      g.fillStyle = warna; g.fillRect(0, 0, 256, 96);
      g.fillStyle = '#efe8d6'; g.font = 'bold 44px system-ui, sans-serif'; g.textAlign = 'center';
      g.fillText(judul, 128, 62);
      g.fillStyle = '#2a2620'; g.font = 'bold 24px system-ui, sans-serif';
      const kata = sub.split(' ');
      let baris = ''; let yy = 140;
      for (const k of kata) {
        if ((baris + ' ' + k).length > 14) { g.fillText(baris, 128, yy); yy += 30; baris = k; }
        else baris = baris ? baris + ' ' + k : k;
      }
      g.fillText(baris, 128, yy);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(70, 0); g.lineTo(0, 52); g.fill();
    });
    letak(datar(1.0, 1.33, matGambar(peta)), x, y, z, putarY);
  };

  // Tembok utara (muka dalam, z -18): stensil + hazard + pipa.
  stensil('07', -14, 2.6, -17.94, 0, 2.4);
  stensil('YARD 7', -6, 2.6, -17.94, 0, 3.0);
  stensil('BAY 3', 13, 2.6, -17.94, 0, 2.6);
  stripHazard(-1, 0.5, -17.94, 0, 5);
  stripHazard(19, 0.5, -17.94, 0, 5);
  pipaTegak(-19.5, 0, 4.1, -17.94);
  pipaTegak(19.5, 0, 4.1, -17.94);
  // Tembok barat (muka dalam, x -22): poster + rambu.
  poster('SCRAP', 'WE BUY IRON COPPER BRASS', '#8a3a22', -21.94, 2.2, -8, Math.PI / 2);
  rambu('NO TRESPASSING', '', -21.94, 2.8, 6, Math.PI / 2, '#e8532f');
  // Tembok timur (muka dalam, x +22): poster + rambu.
  poster('YARD 7', 'OPEN 06:00 — 22:00 CASH PAID', '#2c4a5e', 21.94, 2.2, 2, -Math.PI / 2);
  rambu('HARD HAT AREA', '', 21.94, 2.9, -10, -Math.PI / 2);
  // Muka timur + barat blok tengah (x +/-4, z -4): poster, rambu, pipa.
  poster('YARD 7', 'SCRAPLINE MID CONNECTOR', '#2c4a5e', 4.06, 2.0, -4, Math.PI / 2);
  stripHazard(-4.06, 0.45, -4, -Math.PI / 2, 4);
  pipaTegak(-4.06, 0, 3.3, -4, -Math.PI / 2);
  rambu('BAY 3', 'DANGER KEEP CLEAR', -4.06, 2.9, -4, -Math.PI / 2);
}
