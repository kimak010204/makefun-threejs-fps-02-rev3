// YARD 7 dressing: crushed cars, containers, a brick warehouse face, fences,
// pallets, dumpster, cones, spools, stencilled crates, and the small lived-in
// clutter — coffee cup, wrench, paint can, newspaper, old radio, glove, clock,
// calendar, chains, signs, posters, moss, manholes. Static only; anything
// that moves lives in life.js. All placements stay out of lanes and spawns.
import * as THREE from 'three';

export function dressYard(ctx) {
  const { group, skin } = ctx;
  const solid = (w, h, d, x, y, z, m, ry = 0) => ctx.box(w, h, d, x, y, z, m, true, ry);
  const bx = (w, h, d, x, y, z, m, ry = 0) => {
    const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); if (ry) q.rotation.y = ry;
    q.castShadow = true; q.receiveShadow = true; group.add(q); return q;
  };
  const cy = (rt, rb, h, x, y, z, m, seg = 12, rx = 0, rz = 0) => {
    const q = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
    q.position.set(x, y, z); if (rx) q.rotation.x = rx; if (rz) q.rotation.z = rz;
    q.castShadow = true; q.receiveShadow = true; group.add(q); return q;
  };
  const flat = (w, d, x, z, m, y = 0.03, ry = 0) => {
    const q = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
    q.rotation.x = -Math.PI / 2; if (ry) q.rotation.z = ry;
    q.position.set(x, y, z); q.receiveShadow = true; group.add(q); return q;
  };
  const wall = (w, h, x, y, z, m, ry) => {
    const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    q.position.set(x, y, z); q.rotation.y = ry; q.receiveShadow = true; group.add(q); return q;
  };
  const stencil = (text, w, color = 'rgba(233,226,210,0.55)', font = 90) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = color; g.font = `bold ${font}px system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
  };

  // ---- crushed car piles, spawn corners (out of every lane)
  const carCols = ['#5a3a2a', '#2c4a5e', '#4a4a42', '#6e2a22'];
  for (const [cx, cz, col] of [[-20.6, 15.2, carCols[0]], [20.6, 15.2, carCols[1]]]) {
    const cm = new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.55, metalness: 0.55 });
    const dark = skin.darkMetal;
    solid(2.6, 0.62, 1.5, cx, 0.31, cz, cm, 0.2);
    bx(1.4, 0.5, 1.3, cx - 0.2, 0.85, cz, cm, 0.2);
    bx(1.3, 0.06, 1.2, cx - 0.2, 1.12, cz, dark, 0.2); // caved roof
    for (const [wx, wz] of [[-1, -0.7], [1, -0.7], [-1, 0.7], [1, 0.7]]) {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.11, 8, 16), skin.rubber);
      w.rotation.y = Math.PI / 2; w.position.set(cx + wx, 0.26, cz + wz); group.add(w);
    }
    solid(2.4, 0.55, 1.4, cx + 0.4, 1.4, cz + 0.3, new THREE.MeshStandardMaterial({ color: new THREE.Color(carCols[2]), roughness: 0.6, metalness: 0.5 }), -0.35);
  }

  // ---- extra containers, far corners behind the sites
  for (const [cx, cz, m] of [[-20.5, -16.2, skin.corrugatedRust], [20.5, -16.2, skin.corrugatedGrey]]) {
    solid(4.2, 2.6, 2.4, cx, 1.3, cz, m, 0.05);
    bx(0.1, 2.2, 0.08, cx - 1.9, 1.3, cz + 1.22, skin.darkMetal);
    bx(0.1, 2.2, 0.08, cx + 1.9, 1.3, cz + 1.22, skin.darkMetal);
    bx(3.8, 0.14, 0.1, cx, 2.45, cz + 1.22, skin.darkMetal);
  }

  // ---- brick warehouse face along the north wall (backdrop, no collider:
  // defender spawns walk in front of it, the boundary wall stops bullets)
  bx(10, 5.2, 1.0, 0, 2.6, -17.7, skin.brick);
  bx(10.4, 0.5, 1.2, 0, 5.4, -17.7, skin.concreteDark); // parapet cap
  bx(1.2, 0.7, 1.2, -3.4, 5.95, -17.7, skin.concreteDark);
  bx(1.2, 0.7, 1.2, 3.4, 5.95, -17.7, skin.concreteDark);
  cy(0.9, 0.9, 1.6, 3.2, 6.4, -17.7, skin.rust, 14); // rooftop water tank
  cy(0.02, 0.9, 0.7, 3.2, 7.5, -17.7, skin.darkMetal, 12);
  for (const lx of [-4.2, -1.4, 1.4, 4.2]) bx(0.12, 3.4, 0.12, lx, 1.7, -17.15, skin.darkMetal); // pilasters
  // gutters + downspouts on the north wall
  cy(0.09, 0.09, 44, 0, 4.12, -17.95, skin.steel, 8, 0, Math.PI / 2);
  cy(0.09, 0.09, 4.1, -21, 2.05, -17.95, skin.steel, 8);
  cy(0.09, 0.09, 4.1, 21, 2.05, -17.95, skin.steel, 8);
  // neon sign plate (the flicker itself is driven by life.js; plate sits
  // just behind the neon plane so they never z-fight)
  wall(3.6, 1.0, 0, 4.5, -17.17, new THREE.MeshBasicMaterial({ color: new THREE.Color('#2a1a08') }), 0);

  // ---- mesh fence behind the attack spawns
  wall(18, 2.4, 0, 1.2, 17.6, skin.mesh, 0);
  for (const px of [-9, -4.5, 0, 4.5, 9]) bx(0.12, 2.4, 0.12, px, 1.2, 17.6, skin.darkMetal);

  // ---- pallets, dumpster, cones, spools
  const pallet = (x, z, ry = 0) => {
    bx(1.4, 0.1, 1.1, x, 0.32, z, skin.woodPlain, ry);
    bx(1.4, 0.1, 1.1, x, 0.12, z, skin.woodPlain, ry);
    for (const dx of [-0.6, 0, 0.6]) bx(0.12, 0.12, 1.1, x + dx, 0.22, z, skin.woodPlain, ry);
  };
  pallet(-17, 12, 0.3); pallet(17, -14.5, -0.2); pallet(-6, 16.8, 0.1);
  solid(2.2, 1.3, 1.2, -20.8, 0.65, 11.5, skin.corrugatedGrey);
  bx(2.2, 0.08, 1.2, -20.8, 1.34, 11.5, skin.darkMetal, 0.06);
  const coneM = new THREE.MeshStandardMaterial({ color: new THREE.Color('#e86a1e'), roughness: 0.7, metalness: 0.05 });
  for (const [x, z] of [[-13.5, -6.2], [13.5, -6.2], [-8, 12.5], [8, 12.5]]) {
    const cn = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.75, 12), coneM);
    cn.position.set(x, 0.38, z); cn.castShadow = true; group.add(cn);
    bx(0.5, 0.05, 0.5, x, 0.03, z, coneM);
  }
  for (const [x, z] of [[-7.5, -2], [7.5, -2]]) {
    cy(0.55, 0.55, 0.7, x, 0.55, z, skin.woodPlain, 14, 0, Math.PI / 2);
    cy(0.75, 0.75, 0.08, x - 0.39, 0.55, z, skin.woodPlain, 14, 0, Math.PI / 2);
    cy(0.75, 0.75, 0.08, x + 0.39, 0.55, z, skin.woodPlain, 14, 0, Math.PI / 2);
  }

  // ---- stencilled crates + coloured barrels
  bx(1.2, 1.2, 1.2, -18.5, 0.6, -8.5, skin.wood);
  bx(1.2, 1.2, 1.2, 18.5, 0.6, -13.5, skin.wood);
  bx(1.0, 1.0, 1.0, 12, 0.5, 14.5, skin.woodPlain, 0.4);
  bx(1.0, 1.0, 1.0, -12, 0.5, 14.5, skin.woodPlain, -0.3);
  const barrelCols = [skin.yellowPaint, skin.corrugated, skin.rust, skin.corrugatedGrey];
  [[-19.5, 6.5], [19.5, 6.5], [-6.5, 17], [6.5, 17]].forEach(([x, z], i) => {
    ctx.cyl(0.45, 1.1, x, 0.55, z, barrelCols[i % 4], 14);
    cy(0.46, 0.46, 0.06, x, 0.95, z, skin.darkMetal, 14);
  });

  // ---- lived-in clutter
  cy(0.05, 0.04, 0.12, -3, 1.27, 2.8, new THREE.MeshStandardMaterial({ color: new THREE.Color('#e8e2d2'), roughness: 0.6 }), 10); // coffee cup on crate
  bx(0.02, 0.05, 0.05, -2.94, 1.27, 2.8, skin.darkMetal);
  bx(0.34, 0.05, 0.07, -17, 0.4, 12, skin.steel, 0.7); // wrench on pallet
  bx(0.1, 0.06, 0.07, -16.83, 0.4, 12.1, skin.steel, 0.7);
  cy(0.14, 0.14, 0.3, -21.5, 0.15, 8, skin.yellowPaint, 10); // paint can
  cy(0.15, 0.15, 0.03, -21.5, 0.31, 8, skin.darkMetal, 10);
  flat(0.5, 0.7, 2, 16.2, new THREE.MeshStandardMaterial({ color: new THREE.Color('#cfc8b4'), roughness: 0.95 }), 0.035, 0.5); // newspaper
  bx(0.4, 0.26, 0.2, 3, 1.33, 2.8, skin.darkMetal, -0.2); // old radio on crate
  cy(0.05, 0.05, 0.04, 2.86, 1.33, 2.8, skin.brass, 8, 0, Math.PI / 2);
  cy(0.05, 0.05, 0.04, 3.14, 1.33, 2.8, skin.brass, 8, 0, Math.PI / 2);
  cy(0.012, 0.012, 0.5, 3.1, 1.6, 2.8, skin.steel, 6, 0, 0.5);
  bx(0.3, 0.08, 0.2, 9, 1.14, 13, new THREE.MeshStandardMaterial({ color: new THREE.Color('#c96a1e'), roughness: 0.9 }), 0.8); // work glove on barrel

  // ---- sealed door on the mid wall: handle, hinges, padlock, chain
  bx(1.1, 2.1, 0.08, 5.5, 1.05, -12.18, skin.darkMetal);
  bx(0.06, 0.5, 0.06, 5.5, 1.05, -12.12, skin.darkMetal);
  bx(0.16, 0.05, 0.05, 5.85, 1.05, -12.12, skin.brass); // handle
  bx(0.1, 0.16, 0.04, 5.0, 1.7, -12.12, skin.steel);
  bx(0.1, 0.16, 0.04, 5.0, 0.4, -12.12, skin.steel);
  bx(0.12, 0.16, 0.06, 5.5, 1.35, -12.1, skin.brass); // padlock
  for (let i = 0; i < 3; i += 1) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 10), skin.steel);
    link.position.set(5.5, 1.5 - i * 0.11, -12.08);
    link.rotation.y = i % 2 ? Math.PI / 2 : 0; group.add(link);
  }

  // ---- wall clock on the mid wall + AC unit on the furnace block
  const clockFace = cy(0.28, 0.28, 0.05, 0, 2.9, -12.16, new THREE.MeshStandardMaterial({ color: new THREE.Color('#e8e2d2'), roughness: 0.5 }), 20, Math.PI / 2);
  void clockFace;
  bx(0.02, 0.2, 0.02, 0, 2.94, -12.12, skin.darkMetal);
  bx(0.02, 0.14, 0.02, 0.05, 2.9, -12.12, skin.darkMetal, 0.6);
  bx(0.7, 0.5, 0.4, 14.2, 2.4, -15.2, skin.corrugatedGrey);
  cy(0.16, 0.16, 0.05, 14.2, 2.4, -14.98, skin.darkMetal, 12, Math.PI / 2);

  // ---- signs + posters
  const sign = (text, color, sub, w, h, x, y, z, ry) => {
    const m = new THREE.MeshBasicMaterial({ map: skin.makeSign(text, color, sub), transparent: true });
    wall(w, h, x, y, z, m, ry);
  };
  sign('NO TRESPASSING', '#e8532f', 'PRIVATE YARD', 2.6, 0.65, -21.95, 2.6, 0, Math.PI / 2);
  sign('HARD HAT AREA', '#f5a623', '', 2.4, 0.6, -10.8, 3.0, -14.1, 0);
  sign('BAY 3', '#8b95a6', '', 1.8, 0.45, -17.4, 1.7, 2, Math.PI / 2);
  sign('DANGER', '#e8532f', 'LIVE FIRE', 2.2, 0.55, 16.5, 3.1, -15.1, 0);
  wall(1.1, 1.45, 21.95, 2.0, 6, skin.posterA, -Math.PI / 2);
  wall(1.1, 1.45, -21.95, 2.0, -6, skin.posterB, Math.PI / 2);
  wall(0.9, 1.2, -17.45, 1.8, 8.5, skin.makePoster('WANTED', 'SCRAP THIEF REWARD $50', '#8a3a22', 131), Math.PI / 2);

  // ---- ground decals: manholes, drain, painted bay numbers, extra puddles
  const manhole = (x, z) => {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.7, 20), skin.darkMetal);
    d.rotation.x = -Math.PI / 2; d.position.set(x, 0.035, z); d.receiveShadow = true; group.add(d);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 20), skin.steel);
    rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.035, z); group.add(rim);
  };
  manhole(-4.1, 6.6); manhole(9, -2);
  bx(1.4, 0.05, 0.35, 11.1, 0.035, -13.5, skin.darkMetal); // drain grate
  for (let i = 0; i < 5; i += 1) bx(0.06, 0.02, 0.3, 10.6 + i * 0.25, 0.06, -13.5, skin.steel);
  flat(2.2, 2.2, 2, 14, stencil('07'), 0.032, -0.4);
  flat(2.6, 1.3, -14, 13.5, stencil('BAY 3'), 0.032, 0.3);
  const pud = new THREE.MeshStandardMaterial({ color: new THREE.Color('#1c2733'), roughness: 0.06, metalness: 0.7 });
  for (const [x, z, r] of [[-10, 10, 1.0], [5, -2, 0.8], [-1, -15.5, 0.9]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 20), pud);
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.035, z); p.receiveShadow = true; group.add(p);
  }

  // ---- scattered bolts + moss tufts in the cracks
  const boltM = skin.steel;
  for (let i = 0; i < 14; i += 1) {
    const a = (i * 2.4) % 6.28;
    bx(0.05, 0.02, 0.05, -14 + Math.sin(a) * 12, 0.04, 4 + Math.cos(a) * 9, boltM, a);
  }
  const mossM = new THREE.MeshStandardMaterial({ color: new THREE.Color('#4a5a2a'), roughness: 1, side: THREE.DoubleSide });
  for (const [x, z] of [[-21.5, 3], [-21.5, -8], [21.5, -3], [21.5, 8], [-9, -12], [9, -12], [-15, 17.5], [15, 17.5], [0, 17.8], [-4, -17.8], [-19, 14], [19, -14]]) {
    for (const ry of [0, Math.PI / 2]) {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), mossM);
      t.position.set(x, 0.13, z); t.rotation.y = ry + (x * 0.13 % 0.4); group.add(t);
    }
  }
}
