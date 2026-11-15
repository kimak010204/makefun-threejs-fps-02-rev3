// YARD 7 — dressing putaran keempat: pencahayaan lampu yang rapi dan
// konsisten, bukan sekadar titik terang. Semua murni visual: tanpa collider,
// tanpa state gameplay, tanpa mengubah statistik. Diimpor PALING AKHIR dari
// main.js (setelah dressV3) supaya teks dossier yang hampir penuh memotong
// file ini duluan; game tetap merendernya.
//
// Prinsip suhu warna: lampu yard = hangat amber (#ffc27a / #ffb45e), cahaya
// bulan/langit = dingin biru (sudah ada di fill light #5f7ea8). Semua halo,
// kolam cahaya, dan kerucut di v4 memakai amber yang sama — tidak ada lampu
// putih/biru baru yang mengacaukan palet dusk.
import * as THREE from 'three';

function lukisKanvas(lebar, tinggi, lukis) {
  const kanvas = document.createElement('canvas');
  kanvas.width = lebar; kanvas.height = tinggi;
  lukis(kanvas.getContext('2d'), lebar, tinggi);
  const tekstur = new THREE.CanvasTexture(kanvas);
  tekstur.colorSpace = THREE.SRGBColorSpace;
  return tekstur;
}

// Halo radial hangat: inti terang, jatuh halus ke nol. Dipakai sprite lampu.
const TEKS_HALO = lukisKanvas(128, 128, (g) => {
  const grad = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255, 214, 140, 0.95)');
  grad.addColorStop(0.25, 'rgba(255, 190, 100, 0.55)');
  grad.addColorStop(0.6, 'rgba(255, 170, 70, 0.16)');
  grad.addColorStop(1, 'rgba(255, 170, 70, 0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
});
// Inti bohlam: putih-kuning pekat, untuk pusat lampu yang menyala.
const TEKS_INTI = lukisKanvas(64, 64, (g) => {
  const grad = g.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 246, 220, 1)');
  grad.addColorStop(0.45, 'rgba(255, 214, 140, 0.85)');
  grad.addColorStop(1, 'rgba(255, 190, 100, 0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
});
// Kolam cahaya di tanah: terang di tengah, memudar rapi ke tepi.
const TEKS_KOLAM = lukisKanvas(256, 256, (g) => {
  const grad = g.createRadialGradient(128, 128, 6, 128, 128, 126);
  grad.addColorStop(0, 'rgba(255, 196, 110, 0.55)');
  grad.addColorStop(0.45, 'rgba(255, 180, 80, 0.28)');
  grad.addColorStop(0.8, 'rgba(255, 165, 60, 0.08)');
  grad.addColorStop(1, 'rgba(255, 165, 60, 0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
});

function spriteHalus(peta, skala, opasitas = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: peta, transparent: true, opacity: opasitas,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  s.scale.set(skala, skala, 1);
  return s;
}

export function dressV4(scene) {
  const grup = new THREE.Group();
  scene.add(grup);
  const gelap = new THREE.MeshStandardMaterial({ color: new THREE.Color('#14161a'), roughness: 0.6, metalness: 0.4 });

  // ---- Lampu tiang yard: halo berlapis + kolam cahaya + kerucut + kap. ----
  // Posisi tiang + kepala bohlam di world.js: (-8,8), (8,8), (-8,-4), (8,-4),
  // kepala di y=4.5, PointLight di y=4.4. Kerucut turun dari kepala ke tanah.
  const lampuTiang = (x, z) => {
    const kepalaY = 4.5;
    // Kap lampu (shade) di atas bohlam supaya terbaca sebagai fixture.
    const kap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.38, 0.2, 12, 1, true), gelap);
    kap.position.set(x, kepalaY + 0.22, z);
    grup.add(kap);
    const tutup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 10), gelap);
    tutup.position.set(x, kepalaY + 0.33, z);
    grup.add(tutup);
    // Halo berlapis: halo besar redup + inti kecil terang.
    const halo = spriteHalus(TEKS_HALO, 2.8, 0.85);
    halo.position.set(x, kepalaY, z);
    grup.add(halo);
    const inti = spriteHalus(TEKS_INTI, 0.95, 1);
    inti.position.set(x, kepalaY, z);
    grup.add(inti);
    // Kolam cahaya di tanah: lingkaran radial yang rapi, bukan blob kasar.
    const kolam = new THREE.Mesh(
      new THREE.CircleGeometry(3.3, 28),
      new THREE.MeshBasicMaterial({
        map: TEKS_KOLAM, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    kolam.rotation.x = -Math.PI / 2;
    kolam.position.set(x, 0.045, z);
    grup.add(kolam);
    // (Kerucut cahaya sengaja TIDAK dipakai: di dusk yang gelap, kerucut
    // aditif terbaca sebagai piramida putih padat, bukan cahaya. Halo +
    // kolam saja sudah memberi kesan lampu yang rapi.)
  };
  lampuTiang(-8, 8);
  lampuTiang(8, 8);
  lampuTiang(-8, -4);
  lampuTiang(8, -4);

  // ---- Lampu gantung tengah (0, 4.4, 4): halo + kolam, tanpa tiang. ----
  // Lampu ini menggantung di atas mid — kolamnya jatuh tepat di jalur mid
  // sehingga musuh yang melintas terbaca jelas.
  const haloTengah = spriteHalus(TEKS_HALO, 3.4, 0.8);
  haloTengah.position.set(0, 4.4, 4);
  grup.add(haloTengah);
  const intiTengah = spriteHalus(TEKS_INTI, 1.1, 1);
  intiTengah.position.set(0, 4.4, 4);
  grup.add(intiTengah);
  const kolamTengah = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 28),
    new THREE.MeshBasicMaterial({
      map: TEKS_KOLAM, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  kolamTengah.rotation.x = -Math.PI / 2;
  kolamTengah.position.set(0, 0.045, 4);
  grup.add(kolamTengah);

  // ---- Lampu crane (-15, 4, -11) dan lampu tungku/site (16.5, 3.4, -13). ----
  // Keduanya sudah punya PointLight di world.js tapi tanpa wujud lampu.
  // Halo + kolam kecil membuat sumber cahayanya terbaca.
  const lampuKecil = (x, y, z, skalaHalo, radiusKolam, hangat = '#ffc27a') => {
    const halo = spriteHalus(TEKS_HALO, skalaHalo, 0.8);
    halo.position.set(x, y, z);
    // Warna oranye tungku vs amber lampu: tint sprite lewat material color.
    if (hangat !== '#ffc27a') halo.material.color.set(hangat);
    grup.add(halo);
    const inti = spriteHalus(TEKS_INTI, skalaHalo * 0.36, 1);
    inti.position.set(x, y, z);
    grup.add(inti);
    const kolam = new THREE.Mesh(
      new THREE.CircleGeometry(radiusKolam, 24),
      new THREE.MeshBasicMaterial({
        map: TEKS_KOLAM, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    kolam.rotation.x = -Math.PI / 2;
    kolam.position.set(x, 0.045, z);
    grup.add(kolam);
  };
  lampuKecil(-15, 4, -11, 2.2, 2.6);
  lampuKecil(16.5, 3.4, -13, 2.0, 2.3, '#ff9a4a');

  // ---- Jendela skyline utara: kilau lembut + ambang bawah. ----
  // Jendela polos #ffca7a di world.js terlalu datar/terang. Kilau aditif yang
  // sangat redup di sekelilingnya melembutkan tepi kerasnya, dan ambang gelap
  // di bawah tiap jendela memberi bingkai sehingga terbaca sebagai jendela,
  // bukan persegi terang. Hanya 5 jendela utara (menghadap yard, z<0).
  const jendelaUtara = [
    [-18, 9, -25.9], [-4, 6, -25.9], [10, 10, -25.9], [26, 7, -23.9], [0, 12, -31.9],
  ];
  for (const [x, y, z] of jendelaUtara) {
    const kilau = spriteHalus(TEKS_HALO, 2.4, 0.16);
    kilau.position.set(x, y, z + 0.15);
    grup.add(kilau);
    const ambang = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.09, 0.06),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#101216') }),
    );
    ambang.position.set(x, y - 0.68, z + 0.04);
    grup.add(ambang);
    // Palang tengah tipis (mullion) supaya jendela terbagi dua panel.
    const palang = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.2, 0.04),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#101216') }),
    );
    palang.position.set(x, y, z + 0.04);
    grup.add(palang);
  }
}
