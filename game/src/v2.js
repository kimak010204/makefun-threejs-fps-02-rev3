// YARD 7 — dressing putaran kedua: muka selatan blok tengah, lapis kedua
// skyline, bulan + bintang, dan bayangan kontak di bawah props. Semua di sini
// murni visual: tidak ada collider, tidak ada state gameplay, tidak ada yang
// mengubah statistik. Diimpor paling akhir dari main.js supaya teks dossier
// yang hampir penuh memotong file ini duluan; game tetap merendernya.
import * as THREE from 'three';

function gambarLukis(lebar, tinggi, lukis) {
  const kanvas = document.createElement('canvas');
  kanvas.width = lebar;
  kanvas.height = tinggi;
  lukis(kanvas.getContext('2d'), lebar, tinggi);
  const tekstur = new THREE.CanvasTexture(kanvas);
  tekstur.colorSpace = THREE.SRGBColorSpace;
  tekstur.anisotropy = 4;
  return tekstur;
}

function bahanDasar(teks, kasar = 0.9, logam = 0.05) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(teks), roughness: kasar, metalness: logam,
  });
}

function bahanPolos(teks) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(teks) });
}

function bahanGambar(peta, tembus = false) {
  return new THREE.MeshBasicMaterial({
    map: peta, transparent: tembus, depthWrite: false,
  });
}

export function dressV2(scene) {
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
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  const datar = (l, t, bahan) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, t), bahan);
    m.receiveShadow = true;
    return m;
  };
  const tabung = (rAtas, rBawah, tinggi, bahan, segmen = 14) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rAtas, rBawah, tinggi, segmen), bahan);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  // ---- muka selatan blok tengah (z = -1): papan nama, jendela menyala,
  // garis hazard, pipa, lampu dinding. Semua menempel 6 cm di depan dinding.
  const muka = -0.94;
  const papanTeks = gambarLukis(512, 128, (g, w, h) => {
    g.fillStyle = '#14161c';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f5a623';
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#f5a623';
    g.font = 'bold 58px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('SCRAPLINE', w / 2, 48);
    g.fillStyle = '#8b95a6';
    g.font = '26px system-ui, sans-serif';
    g.fillText('YARD 7 — MID CONNECTOR', w / 2, 96);
  });
  letak(datar(3.0, 0.75, bahanGambar(papanTeks, true)), -1.6, 2.3, muka);

  const garisHazard = gambarLukis(512, 32, (g, w, h) => {
    g.fillStyle = '#c9971f';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#14161a';
    for (let x = -32; x < w + 32; x += 64) {
      g.beginPath();
      g.moveTo(x, h);
      g.lineTo(x + 32, 0);
      g.lineTo(x + 64, 0);
      g.lineTo(x + 32, h);
      g.fill();
    }
  });
  letak(datar(8.0, 0.45, bahanGambar(garisHazard)), 0, 0.28, muka);

  const jendelaHangat = gambarLukis(128, 160, (g, w, h) => {
    g.fillStyle = '#17191f';
    g.fillRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffd9a0');
    grad.addColorStop(0.55, '#f5a623');
    grad.addColorStop(1, '#c97a1e');
    g.fillStyle = grad;
    g.fillRect(10, 10, w - 20, h - 20);
    g.fillStyle = 'rgba(20,16,10,0.85)';
    g.fillRect(10, h / 2 - 4, w - 20, 8);
    g.fillRect(w / 2 - 4, 10, 8, h - 20);
    g.fillStyle = 'rgba(20,16,10,0.9)';
    g.beginPath();
    g.moveTo(14, 26);
    g.lineTo(52, 26);
    g.lineTo(30, 120);
    g.lineTo(14, 120);
    g.fill();
  });
  letak(datar(0.9, 1.15, bahanGambar(jendelaHangat)), 2.6, 2.0, muka);

  const jendelaDingin = gambarLukis(96, 128, (g, w, h) => {
    g.fillStyle = '#17191f';
    g.fillRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#5a708a');
    grad.addColorStop(1, '#2c3a4a');
    g.fillStyle = grad;
    g.fillRect(8, 8, w - 16, h - 16);
    g.fillStyle = 'rgba(230,235,240,0.5)';
    g.fillRect(14, 18, 26, 4);
    g.fillRect(14, 30, 18, 4);
  });
  letak(datar(0.7, 0.95, bahanGambar(jendelaDingin)), -3.4, 2.1, muka);

  // Pipa conduit vertikal + kotak sambungan di sisi timur dinding tengah.
  const bajaGelap = bahanDasar('#262a31', 0.6, 0.45);
  letak(tabung(0.06, 0.06, 3.4, bajaGelap, 10), 3.9, 1.7, -0.92);
  letak(kotak(0.2, 0.26, 0.08, bajaGelap), 3.9, 1.0, -0.9);
  letak(kotak(0.2, 0.26, 0.08, bajaGelap), 3.9, 2.6, -0.9);

  // Lampu dinding hangat + halo.
  const kepalaLampu = bahanPolos('#ffd9a0');
  letak(kotak(0.3, 0.06, 0.06, bajaGelap), -3.4, 2.95, -0.9);
  letak(kotak(0.16, 0.1, 0.12, kepalaLampu), -3.4, 2.86, -0.88);
  const halo = gambarLukis(128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255, 200, 120, 0.55)');
    grad.addColorStop(0.5, 'rgba(255, 180, 90, 0.18)');
    grad.addColorStop(1, 'rgba(255, 180, 90, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  });
  const pijar = new THREE.Sprite(new THREE.SpriteMaterial({
    map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  pijar.position.set(-3.4, 2.86, -0.8);
  pijar.scale.set(1.4, 1.4, 1);
  grup.add(pijar);

  // ---- bayangan kontak: strip AO di kaki dinding tengah + blob di bawah props.
  const bayangKaki = gambarLukis(256, 64, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(5,5,8,0.6)');
    grad.addColorStop(1, 'rgba(5,5,8,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
  const stripAO = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 1.2),
    new THREE.MeshBasicMaterial({ map: bayangKaki, transparent: true, depthWrite: false }),
  );
  stripAO.rotation.x = -Math.PI / 2;
  stripAO.position.set(0, 0.04, -0.4);
  grup.add(stripAO);

  const blobBayang = gambarLukis(128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(5,5,8,0.55)');
    grad.addColorStop(0.7, 'rgba(5,5,8,0.28)');
    grad.addColorStop(1, 'rgba(5,5,8,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  });
  const blob = (x, z, w, d) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: blobBayang, transparent: true, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.035, z);
    grup.add(m);
  };
  blob(-5.2, -1.5, 2.4, 1.8);
  blob(5.2, -1.8, 2.2, 1.8);
  blob(-3, 2.8, 1.9, 1.9);
  blob(3, 2.8, 1.9, 1.9);

  // ---- lapis kedua skyline (lebih dekat, lebih terang): siluet bertingkat.
  const siluetDekat = bahanPolos('#232936');
  const jendelaKota = bahanPolos('#ffca7a');
  const blokDekat = [
    [-16, 3.2, -21, 8, 6.4, 4],
    [-9, 2.6, -20.5, 5, 5.2, 4],
    [9, 2.8, -20.5, 6, 5.6, 4],
    [16, 3.4, -21, 8, 6.8, 4],
    [0, 4.0, -22, 10, 8, 4],
  ];
  for (const [x, y, z, w, h, d] of blokDekat) {
    letak(kotak(w, h, d, siluetDekat), x, y, z);
  }
  const jendelaDekat = [
    [-17, 4.2, -18.98], [-14, 2.6, -18.98], [-9, 3.4, -18.48],
    [8, 3.8, -18.48], [11, 2.4, -18.48], [15, 4.4, -18.98],
    [18, 2.8, -18.98], [-2, 5.6, -19.98], [2, 3.4, -19.98],
  ];
  for (const [x, y, z] of jendelaDekat) {
    letak(datar(0.6, 0.8, jendelaKota), x, y, z);
  }

  // ---- detail atap skyline jauh: tangki air, ventilasi, antena + ujung merah.
  const siluetAtap = bahanPolos('#1a1e26');
  const ujungMerah = bahanPolos('#ff2e1f');
  const tangki = (x, y, z, r = 1.1) => {
    letak(tabung(r, r, 2.0, siluetAtap, 12), x, y + 1.0, z);
    letak(tabung(0.02, r, 0.7, siluetAtap, 12), x, y + 2.3, z);
  };
  tangki(-18, 18, -28);
  tangki(0, 22, -34, 1.3);
  tangki(32, 18, 6, 1.0);
  letak(kotak(1.0, 1.5, 1.0, siluetAtap), 3, 22.75, -34);
  letak(kotak(0.9, 1.2, 0.9, siluetAtap), -32, 14.6, 10);
  const antena = (x, y, z, tinggi) => {
    letak(kotak(0.14, tinggi, 0.14, siluetAtap), x, y + tinggi / 2, z);
    const ujung = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), ujungMerah);
    letak(ujung, x, y + tinggi + 0.1, z);
  };
  antena(-15, 18, -28, 4);
  antena(10, 16, -28, 3.5);
  antena(26, 12, -26, 3);

  // ---- bulan + halo + bintang: langit atas tidak lagi kosong.
  const bulan = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8e2d2'), fog: false }),
  );
  bulan.position.set(38, 26, -48);
  bulan.lookAt(0, 2, 10);
  grup.add(bulan);
  const haloBulan = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 32),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#e8e2d2'), transparent: true, opacity: 0.12,
      fog: false, depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  );
  haloBulan.position.set(38, 26, -48.2);
  haloBulan.lookAt(0, 2, 10);
  grup.add(haloBulan);

  const acak = (() => {
    let a = 20261115;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();
  const jumlahBintang = 140;
  const posBintang = new Float32Array(jumlahBintang * 3);
  for (let i = 0; i < jumlahBintang; i += 1) {
    posBintang[i * 3] = -70 + acak() * 140;
    posBintang[i * 3 + 1] = 18 + acak() * 27;
    posBintang[i * 3 + 2] = -70 + acak() * 45;
  }
  const geoBintang = new THREE.BufferGeometry();
  geoBintang.setAttribute('position', new THREE.BufferAttribute(posBintang, 3));
  const bintang = new THREE.Points(geoBintang, new THREE.PointsMaterial({
    color: new THREE.Color('#cdd8ff'), size: 0.35, transparent: true,
    opacity: 0.85, fog: false, depthWrite: false,
  }));
  bintang.frustumCulled = false;
  grup.add(bintang);

  // ---- tong + palet menempel di sisi blok tengah (barat & timur).
  const karat = bahanDasar('#7a4a26', 0.85, 0.3);
  const teal = bahanDasar('#3f6f6a', 0.8, 0.25);
  const kuning = bahanDasar('#c9971f', 0.7, 0.3);
  const gelap = bahanDasar('#17191f', 0.9, 0.1);
  const tong = (x, z, bahan) => {
    letak(tabung(0.45, 0.45, 1.1, bahan, 14), x, 0.55, z);
    letak(tabung(0.46, 0.46, 0.06, gelap, 14), x, 0.95, z);
  };
  tong(-4.8, -2.5, karat);
  tong(-5.6, -1.6, teal);
  tong(-4.9, -0.6, kuning);

  const kayu = bahanDasar('#6b5a41', 0.9, 0.05);
  const palet = kotak(1.4, 0.1, 1.1, kayu);
  palet.position.set(4.6, 0.7, -1.5);
  palet.rotation.set(-0.5, 0.2, 0);
  palet.castShadow = true;
  grup.add(palet);
  letak(kotak(1.0, 1.0, 1.0, kayu), 5.8, 0.5, -2.2, 0.3);
  letak(kotak(0.9, 0.9, 0.9, kayu), 5.8, 1.45, -2.2, -0.2);
}
