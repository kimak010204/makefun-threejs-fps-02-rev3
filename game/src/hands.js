// Tangan bersarung tangan untuk viewmodel first-person: tangan kanan di
// gagang picu, tangan kiri di handguard / foregrip / pump / penopang.
// Visual saja — anak dari grup senjata, jadi ikut bob, recoil, dan inspect.
// Sarung tangan gelap + pelat knuckle + lengan seragam VANGUARD.
import * as THREE from 'three';

export function attachHands(grp, def) {
  const sarung = new THREE.MeshStandardMaterial({ color: new THREE.Color('#23262e'), roughness: 0.9, metalness: 0.05 });
  const knuckle = new THREE.MeshStandardMaterial({ color: new THREE.Color('#3a3f4a'), roughness: 0.7, metalness: 0.25 });
  const lengan = new THREE.MeshStandardMaterial({ color: new THREE.Color('#272e3a'), roughness: 0.92, metalness: 0.05 });
  const bx = (w, h, d, x, y, z, m, rx = 0, ry = 0, rz = 0) => {
    const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z);
    if (rx) q.rotation.x = rx;
    if (ry) q.rotation.y = ry;
    if (rz) q.rotation.z = rz;
    grp.add(q);
    return q;
  };

  // ---- tangan kanan: telapak di belakang gagang, jari melingkar di depan,
  // ibu jari di sisi kiri, pergelangan + lengan ke bawah-kanan layar.
  const tanganKanan = (gx, gy, gz) => {
    bx(0.055, 0.07, 0.045, gx, gy - 0.005, gz + 0.035, sarung, 0.15); // telapak
    for (let i = 0; i < 4; i += 1) {
      const fx = gx - 0.0195 + i * 0.013;
      bx(0.0115, 0.055, 0.013, fx, gy - 0.01, gz - 0.028, sarung, 0.55); // jari
      bx(0.0115, 0.02, 0.012, fx, gy + 0.018, gz - 0.012, sarung, 1.15); // ujung jari
    }
    bx(0.05, 0.02, 0.012, gx, gy + 0.028, gz - 0.02, knuckle); // pelat knuckle
    bx(0.013, 0.045, 0.013, gx - 0.032, gy - 0.005, gz + 0.01, sarung, -0.25, 0, 0.45); // ibu jari
    bx(0.055, 0.05, 0.06, gx + 0.005, gy - 0.075, gz + 0.05, sarung); // pergelangan
    bx(0.07, 0.06, 0.05, gx + 0.02, gy - 0.11, gz + 0.09, lengan, 0.5); // manset
    bx(0.06, 0.065, 0.13, gx + 0.03, gy - 0.16, gz + 0.08, lengan, 1.05, 0, -0.15); // lengan
  };

  // ---- tangan kiri di handguard / pump: telapak di bawah, jari ke atas.
  const tanganKiriAtas = (fx, fy, fz) => {
    bx(0.055, 0.05, 0.09, fx, fy - 0.05, fz, sarung); // telapak bawah
    bx(0.05, 0.018, 0.09, fx, fy + 0.045, fz, sarung); // baris jari atas
    for (let i = 0; i < 4; i += 1) {
      bx(0.0115, 0.02, 0.012, fx - 0.0195 + i * 0.013, fy + 0.058, fz + 0.02, sarung, 0.9);
    }
    bx(0.013, 0.04, 0.013, fx - 0.033, fy - 0.01, fz, sarung, 0, 0, 0.4); // ibu jari
    bx(0.055, 0.05, 0.06, fx - 0.005, fy - 0.085, fz + 0.04, sarung); // pergelangan
    bx(0.06, 0.065, 0.13, fx - 0.03, fy - 0.15, fz + 0.07, lengan, 1.05, 0, 0.15); // lengan
  };

  // ---- tangan kiri di foregrip vertikal (SMG): genggaman tegak.
  const tanganKiriTegak = (fx, fy, fz) => {
    bx(0.055, 0.07, 0.045, fx, fy - 0.01, fz + 0.035, sarung, 0.1);
    for (let i = 0; i < 4; i += 1) {
      const xx = fx - 0.0195 + i * 0.013;
      bx(0.0115, 0.05, 0.013, xx, fy - 0.015, fz - 0.025, sarung, 0.5);
    }
    bx(0.013, 0.045, 0.013, fx + 0.032, fy - 0.005, fz + 0.01, sarung, -0.25, 0, -0.45);
    bx(0.055, 0.05, 0.06, fx, fy - 0.08, fz + 0.05, sarung);
    bx(0.06, 0.065, 0.13, fx - 0.03, fy - 0.16, fz + 0.07, lengan, 1.05, 0, 0.15);
  };

  // ---- tangan kiri penopang (P9): menopang tangan kanan dari bawah.
  const tanganKiriTopang = (gx, gy, gz) => {
    bx(0.055, 0.05, 0.07, gx + 0.008, gy - 0.055, gz + 0.03, sarung, 0.3);
    for (let i = 0; i < 4; i += 1) {
      const xx = gx - 0.016 + i * 0.012;
      bx(0.0115, 0.045, 0.012, xx, gy - 0.02, gz - 0.005, sarung, 0.7);
    }
    bx(0.055, 0.05, 0.06, gx - 0.005, gy - 0.1, gz + 0.06, sarung);
    bx(0.06, 0.065, 0.13, gx - 0.04, gy - 0.16, gz + 0.08, lengan, 1.05, 0, 0.2);
  };

  if (def.id === 'pistol') {
    tanganKanan(0, -0.085, 0.02);
    tanganKiriTopang(0, -0.085, 0.02);
  } else if (def.id === 'smg') {
    tanganKanan(0, -0.075, 0.1);
    tanganKiriTegak(0, -0.11, -0.28);
  } else if (def.id === 'rifle') {
    tanganKanan(0, -0.1, 0.06);
    tanganKiriAtas(0, 0.005, -0.42);
  } else if (def.id === 'shotgun') {
    tanganKanan(0, -0.11, -0.02);
    tanganKiriAtas(0, -0.02, -0.42);
  } else { // dmr
    tanganKanan(0, -0.1, 0.06);
    tanganKiriAtas(0, 0.01, -0.44);
  }
}
