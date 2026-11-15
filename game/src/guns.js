// Detailed first-person gun models: real silhouettes, not plain boxes.
// Every gun gets a barrel, rails, magazine, stock, sights (scope on the DMR),
// serial plate, grip tape and a sling where it fits. Stats untouched —
// this file only builds meshes. Muzzle z is in camera space for the flash.
import * as THREE from 'three';
import { attachHands } from './hands.js';

export const GUN_MUZZLE = { pistol: -0.74, smg: -1.06, rifle: -1.16, shotgun: -1.16, dmr: -1.36 };

function serialPlate(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#c8c2b2'; g.font = 'bold 20px ui-monospace, monospace';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 17);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.021),
    new THREE.MeshBasicMaterial({ map: t, transparent: true }));
  return m;
}

export function buildGun(def) {
  const metal = new THREE.MeshStandardMaterial({ color: new THREE.Color('#23262e'), roughness: 0.42, metalness: 0.65 });
  const poly = new THREE.MeshStandardMaterial({ color: new THREE.Color('#16181d'), roughness: 0.82, metalness: 0.1 });
  const wood = new THREE.MeshStandardMaterial({ color: new THREE.Color('#6e4a26'), roughness: 0.72, metalness: 0.05 });
  const steel = new THREE.MeshStandardMaterial({ color: new THREE.Color('#8a919c'), roughness: 0.3, metalness: 0.8 });
  const brass = new THREE.MeshStandardMaterial({ color: new THREE.Color('#c9971f'), roughness: 0.35, metalness: 0.7 });
  const tape = new THREE.MeshStandardMaterial({ color: new THREE.Color('#4a4a30'), roughness: 0.95, metalness: 0 });
  const glass = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0e1a2a'), roughness: 0.08, metalness: 0.9 });
  const red = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ff2e1f'), emissive: new THREE.Color('#ff2e1f'), emissiveIntensity: 1.6, roughness: 0.4 });
  const shellRed = new THREE.MeshStandardMaterial({ color: new THREE.Color('#a83226'), roughness: 0.5, metalness: 0.2 });
  const grp = new THREE.Group();
  const bx = (w, h, d, x, y, z, m, rx = 0, rz = 0) => {
    const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); if (rx) q.rotation.x = rx; if (rz) q.rotation.z = rz; grp.add(q); return q;
  };
  const tub = (rt, rb, h, x, y, z, m, seg = 12, rx = Math.PI / 2, rz = 0) => {
    const q = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
    q.position.set(x, y, z); q.rotation.x = rx; if (rz) q.rotation.z = rz; grp.add(q); return q;
  };
  const plate = (text, x, y, z) => {
    const p = serialPlate(text); p.position.set(x, y, z); p.rotation.y = -Math.PI / 2; grp.add(p);
  };
  const sling = (x0, y0, x1, y1) => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(x0, y0, 0.02), new THREE.Vector3((x0 + x1) / 2, Math.min(y0, y1) - 0.09, 0.05),
      new THREE.Vector3(x1, y1, 0.02));
    const s = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.008, 5), poly);
    grp.add(s);
  };
  const rail = (z0, n) => { for (let i = 0; i < n; i += 1) bx(0.05, 0.012, 0.02, 0, 0.062, z0 - i * 0.035, steel); };

  if (def.id === 'pistol') {
    bx(0.055, 0.075, 0.24, 0, 0.005, -0.12, metal); // slide
    tub(0.016, 0.016, 0.03, 0, 0.01, -0.25, steel, 10); // barrel tip
    for (let i = 0; i < 3; i += 1) bx(0.058, 0.012, 0.014, 0, 0.045, -0.02 - i * 0.02, steel); // slide serrations
    bx(0.012, 0.018, 0.012, 0, 0.052, -0.23, steel); // front sight
    bx(0.02, 0.014, 0.01, -0.012, 0.05, -0.02, steel); // rear sight L
    bx(0.02, 0.014, 0.01, 0.012, 0.05, -0.02, steel); // rear sight R
    bx(0.05, 0.11, 0.065, 0, -0.085, 0.02, poly, 0.16); // grip
    bx(0.052, 0.02, 0.067, 0, -0.06, 0.028, tape, 0.16); // grip tape
    bx(0.052, 0.014, 0.07, 0, -0.145, 0.032, metal, 0.16); // mag base
    bx(0.05, 0.012, 0.1, 0, -0.045, -0.06, steel); // trigger guard
    bx(0.008, 0.03, 0.012, 0, -0.048, -0.045, poly); // trigger
    bx(0.012, 0.02, 0.02, 0, 0.048, 0.1, steel); // hammer
    bx(0.004, 0.02, 0.08, 0.029, 0.02, -0.12, poly); // ejection port, right
    bx(0.05, 0.08, 0.012, 0, -0.085, -0.014, tape, 0.16); // front strap
    plate('P9 · SN 0117', -0.029, 0.01, -0.1);
  } else if (def.id === 'smg') {
    bx(0.075, 0.085, 0.36, 0, 0, -0.1, metal); // receiver
    bx(0.05, 0.03, 0.3, 0, 0.056, -0.12, poly); // top rail base
    rail(-0.03, 6); // rail notches
    tub(0.028, 0.028, 0.26, 0, 0.01, -0.4, poly, 12); // shroud
    tub(0.014, 0.014, 0.1, 0, 0.01, -0.56, steel, 10); // barrel
    bx(0.05, 0.14, 0.05, 0, -0.11, -0.28, poly, 0.1); // vertical foregrip
    bx(0.045, 0.2, 0.06, 0, -0.14, -0.02, steel, 0.12); // stick mag
    bx(0.06, 0.07, 0.16, 0, -0.01, 0.26, poly); // folding stock
    bx(0.03, 0.03, 0.05, 0, -0.045, -0.42, poly); // laser housing
    bx(0.012, 0.012, 0.012, 0, -0.045, -0.45, red); // laser dot
    bx(0.014, 0.03, 0.014, 0, 0.062, -0.05, steel); // rear sight
    bx(0.052, 0.02, 0.06, 0, -0.075, 0.1, tape); // grip tape
    bx(0.02, 0.015, 0.04, 0.04, 0.02, -0.05, steel); // charging handle
    bx(0.006, 0.03, 0.1, -0.041, 0.01, -0.12, poly); // side rail
    for (let i = 0; i < 3; i += 1) bx(0.004, 0.014, 0.02, -0.024, -0.08 - i * 0.04, -0.02, brass); // mag window, brass
    plate('RPTR · SN 2204', -0.039, 0, -0.08);
  } else if (def.id === 'rifle') {
    bx(0.085, 0.1, 0.4, 0, 0, -0.08, metal); // receiver
    bx(0.07, 0.07, 0.3, 0, 0.005, -0.42, wood); // wood handguard
    tub(0.016, 0.016, 0.3, 0, 0.055, -0.4, steel, 10); // gas tube
    tub(0.02, 0.024, 0.09, 0, 0.01, -0.6, steel, 10); // muzzle brake
    bx(0.05, 0.012, 0.02, 0, 0.09, -0.56, steel); // brake slot
    bx(0.014, 0.05, 0.014, 0, 0.075, -0.52, steel); // front post
    bx(0.05, 0.03, 0.02, 0, 0.065, -0.16, steel); // rear sight
    bx(0.05, 0.01, 0.3, 0, 0.068, -0.08, steel); // top rail base
    for (let i = 0; i < 6; i += 1) bx(0.052, 0.012, 0.018, 0, 0.068, 0.02 - i * 0.045, steel); // rail notches
    bx(0.04, 0.02, 0.08, 0, 0.08, 0.02, poly); // red-dot riser
    tub(0.028, 0.028, 0.07, 0, 0.108, 0.02, steel, 12); // red-dot housing
    tub(0.024, 0.024, 0.006, 0, 0.108, 0.056, glass, 12); // red-dot lens
    { const dot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), red); dot.position.set(0, 0.108, 0.06); grp.add(dot); }
    bx(0.008, 0.02, 0.05, -0.046, -0.02, 0.0, steel, 0, 0.5); // selector switch, left side
    tub(0.007, 0.007, 0.025, 0.012, -0.055, -0.035, brass, 8, 0); // cartridge tip in mag
    tub(0.007, 0.007, 0.025, -0.012, -0.055, -0.035, brass, 8, 0); // cartridge tip in mag
    bx(0.012, 0.02, 0.03, 0.026, 0.01, -0.6, steel); // brake port R
    bx(0.012, 0.02, 0.03, -0.026, 0.01, -0.6, steel); // brake port L
    bx(0.05, 0.16, 0.06, 0, -0.12, 0.0, steel, 0.35); // curved mag, upper
    bx(0.05, 0.12, 0.06, 0.03, -0.22, 0.02, steel, 0.55); // curved mag, lower
    bx(0.07, 0.09, 0.22, 0, -0.02, 0.27, wood, -0.12); // wood stock
    bx(0.075, 0.1, 0.02, 0, -0.045, 0.37, poly, -0.12); // butt pad
    bx(0.087, 0.015, 0.34, 0, 0.055, -0.08, steel); // dust cover
    bx(0.05, 0.05, 0.08, 0, -0.1, 0.06, poly); // pistol grip
    bx(0.052, 0.02, 0.08, 0, -0.085, 0.06, tape); // grip tape
    bx(0.03, 0.015, 0.02, 0.048, 0.02, 0.05, steel); // charging handle
    bx(0.004, 0.025, 0.07, 0.044, 0.0, -0.1, poly); // ejection port, right
    bx(0.02, 0.008, 0.008, 0.05, 0.0, -0.1, brass); // brass case in port
    for (let i = 0; i < 3; i += 1) bx(0.072, 0.006, 0.05, 0, 0.042, -0.32 - i * 0.1, poly); // handguard vents
    sling(0.03, -0.06, 0.03, -0.5);
    plate('VK-47 · SN 8841', -0.044, 0.01, -0.06);
  } else if (def.id === 'shotgun') {
    bx(0.1, 0.11, 0.46, 0, 0, -0.06, metal); // receiver
    tub(0.032, 0.032, 0.42, 0, 0.03, -0.48, steel, 12); // barrel
    tub(0.024, 0.024, 0.36, 0, -0.035, -0.46, poly, 12); // tube mag
    bx(0.075, 0.085, 0.26, 0, -0.02, -0.42, wood); // pump
    for (let i = 0; i < 4; i += 1) bx(0.078, 0.09, 0.015, 0, -0.02, -0.32 - i * 0.055, poly); // pump ribs
    bx(0.012, 0.012, 0.012, 0, 0.07, -0.68, brass); // bead sight
    bx(0.075, 0.1, 0.24, 0, -0.02, 0.26, wood, -0.1); // stock
    bx(0.08, 0.11, 0.02, 0, -0.045, 0.37, poly, -0.1); // butt pad
    bx(0.05, 0.05, 0.07, 0, -0.11, -0.02, poly); // grip
    tub(0.02, 0.02, 0.05, 0.03, 0.03, -0.6, brass, 8); // shell in tube
    for (let i = 0; i < 4; i += 1) tub(0.012, 0.012, 0.05, -0.056, 0.02, -0.02 - i * 0.06, shellRed, 10); // side saddle shells
    bx(0.07, 0.01, 0.34, 0, 0.055, -0.48, steel); // heat shield
    bx(0.02, 0.01, 0.03, 0, -0.058, -0.12, brass); // shell rim, loading port
    bx(0.02, 0.01, 0.03, 0, -0.058, -0.18, brass); // shell rim, loading port
    plate('SCRP-12 · SN 0550', -0.051, 0.01, -0.04);
  } else {
    bx(0.085, 0.11, 0.52, 0, 0, -0.1, metal); // long receiver
    tub(0.014, 0.014, 0.5, 0, 0.02, -0.6, steel, 10); // long barrel
    tub(0.024, 0.028, 0.1, 0, 0.02, -0.84, steel, 10); // muzzle brake
    bx(0.05, 0.014, 0.03, 0, 0.05, -0.82, steel);
    tub(0.035, 0.035, 0.22, 0, 0.1, -0.18, poly, 14); // scope body
    tub(0.042, 0.042, 0.03, 0, 0.1, -0.28, steel, 14); // scope objective
    tub(0.03, 0.03, 0.02, 0, 0.1, -0.29, glass, 14); // objective lens
    tub(0.032, 0.032, 0.04, 0, 0.1, -0.07, steel, 14); // ocular
    bx(0.04, 0.05, 0.03, 0, 0.055, -0.24, steel); // scope mount front
    bx(0.04, 0.05, 0.03, 0, 0.055, -0.12, steel); // scope mount rear
    bx(0.05, 0.06, 0.3, 0, 0.01, -0.44, poly); // handguard
    bx(0.05, 0.16, 0.06, 0, -0.13, -0.02, steel, 0.06); // straight mag
    bx(0.07, 0.09, 0.24, 0, -0.02, 0.28, wood, -0.1); // stock
    bx(0.075, 0.04, 0.2, 0, 0.035, 0.28, poly, -0.1); // cheek rest
    bx(0.02, 0.09, 0.02, -0.02, -0.06, -0.5, steel, 0.5); // bipod leg L (folded)
    bx(0.02, 0.09, 0.02, 0.02, -0.06, -0.5, steel, -0.5); // bipod leg R (folded)
    bx(0.05, 0.05, 0.08, 0, -0.1, 0.06, poly); // grip
    tub(0.012, 0.012, 0.02, 0, 0.135, -0.18, steel, 10, 0); // scope turret, top
    tub(0.012, 0.012, 0.02, 0.042, 0.1, -0.18, steel, 10, 0, Math.PI / 2); // scope turret, side
    bx(0.05, 0.002, 0.001, 0, 0.1, -0.302, poly); // reticle, horizontal
    bx(0.002, 0.05, 0.001, 0, 0.1, -0.302, poly); // reticle, vertical
    tub(0.008, 0.008, 0.05, 0.06, -0.01, -0.05, steel, 8, 0, -2.2); // bolt handle
    { const knob = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), steel); knob.position.set(0.075, -0.02, -0.05); grp.add(knob); }
    tub(0.007, 0.007, 0.025, 0.012, -0.055, -0.02, brass, 8, 0); // cartridge tip in mag
    tub(0.007, 0.007, 0.025, -0.012, -0.055, -0.02, brass, 8, 0); // cartridge tip in mag
    sling(0.03, -0.06, 0.03, -0.52);
    plate('LGSHOT · SN 9902', -0.044, 0.01, -0.06);
  }
  attachHands(grp, def);
  return grp;
}
