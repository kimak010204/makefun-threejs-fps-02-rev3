// The yard, alive: blinking beacons, a flapping tarp, a spinning wall fan,
// a flickering neon sign, waving flags, distant birds, welding sparks by
// the furnace, and dust drifting in the lamp light. One step() call, no
// per-frame allocations, no extra lights.
import * as THREE from 'three';

function glowTexture(inner, mid) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, inner); gr.addColorStop(0.5, mid); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createLife(scene) {
  let t = 0;
  const blinkers = [];
  const addBeacon = (x, y, z, color, period, phase, size) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color) }));
    m.position.set(x, y, z); scene.add(m);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(color, color), transparent: true, opacity: 0.8,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    s.position.set(x, y, z); s.scale.set(size, size, 1); scene.add(s);
    blinkers.push({ m, s, period, phase, size });
  };
  addBeacon(-15, 9.9, -14.6, '#ff7a1a', 1.6, 0, 1.4); // crane-top beacon
  addBeacon(18.4, 7.7, -16.8, '#ff7a1a', 1.6, 0.8, 1.2); // chimney beacon
  addBeacon(-4, 8.7, -17.6, '#ff2e1f', 2.4, 0.3, 1.0); // antenna beacon, slow red
  // antenna mast itself
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.4, 6),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#3d4554'), roughness: 0.6, metalness: 0.5 }));
  mast.position.set(-4, 7.4, -17.6); scene.add(mast);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#3d4554'), roughness: 0.6, metalness: 0.5 }));
  cross.position.set(-4, 8.2, -17.6); scene.add(cross);

  // neon SCRAPLINE sign over the warehouse face (flickers now and then)
  const neonTex = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#140f08'; g.fillRect(0, 0, 512, 128);
    g.strokeStyle = '#f5a623'; g.lineWidth = 4; g.strokeRect(8, 8, 496, 112);
    g.fillStyle = '#ffb84d'; g.font = 'bold 62px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SCRAPLINE', 256, 68);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  })();
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85),
    new THREE.MeshBasicMaterial({ map: neonTex, transparent: true }));
  neon.position.set(0, 4.5, -17.12); scene.add(neon);
  const neonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(245,166,35,0.55)', 'rgba(245,166,35,0.2)'), transparent: true,
    opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  neonGlow.position.set(0, 4.5, -16.9); neonGlow.scale.set(4.4, 1.6, 1); scene.add(neonGlow);

  // tarp over the stacked container at (-6.5, 6.5): cloth that breathes
  const tarpGeo = new THREE.PlaneGeometry(4.6, 2.8, 8, 5);
  const tarpBase = tarpGeo.attributes.position.array.slice();
  const tarp = new THREE.Mesh(tarpGeo, new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3a4a42'), roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide,
  }));
  tarp.position.set(-6.5, 5.35, 6.5); tarp.rotation.x = -0.12; tarp.castShadow = true; scene.add(tarp);

  // wall fan on the furnace block, spinning
  const fan = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 10),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#23262e'), roughness: 0.5, metalness: 0.5 }));
  hub.rotation.x = Math.PI / 2; fan.add(hub);
  const blades = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.55, 0.02),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8a919c'), roughness: 0.4, metalness: 0.7 }));
    b.position.y = 0.3;
    const holder = new THREE.Group(); holder.rotation.z = (i * Math.PI * 2) / 3;
    holder.add(b); blades.add(holder);
  }
  fan.add(blades);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 6, 20),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#23262e'), roughness: 0.5, metalness: 0.5 }));
  fan.add(ring);
  fan.position.set(14.2, 3.4, -15.05); scene.add(fan);

  // two pennant flags by the attack spawns
  const flags = [];
  for (const [x, z, ph] of [[-8, 16.5, 0], [8, 16.5, 1.7]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#3d4554'), roughness: 0.6, metalness: 0.5 }));
    pole.position.set(x, 1.6, z); scene.add(pole);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#e8532f'), roughness: 0.9, side: THREE.DoubleSide }));
    cloth.position.set(x + 0.36, 2.95, z); scene.add(cloth);
    flags.push({ cloth, ph });
  }

  // distant birds crossing the dusk sky
  const birds = [];
  for (let i = 0; i < 3; i += 1) {
    const b = new THREE.Group();
    const wm = new THREE.MeshBasicMaterial({ color: new THREE.Color('#0c0e12'), side: THREE.DoubleSide });
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), wm);
    const w2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), wm);
    w1.position.x = -0.24; w2.position.x = 0.24;
    b.add(w1, w2);
    b.position.set(-40 + i * 14, 19 + i * 2.5, -30 - i * 4);
    scene.add(b);
    birds.push({ g: b, w1, w2, speed: 2.2 + i * 0.5, y: 19 + i * 2.5 });
  }

  // welding sparks by the furnace + a flash sprite
  const SPARKS = 18;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkVel = new Float32Array(SPARKS * 3);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkPts = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
    color: 0xffc46b, size: 0.11, transparent: true, opacity: 0, depthWrite: false,
  }));
  sparkPts.frustumCulled = false; scene.add(sparkPts);
  const weldFlash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,220,140,0.9)', 'rgba(245,168,48,0.4)'), transparent: true,
    opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  weldFlash.position.set(16.5, 1.3, -15.1); weldFlash.scale.set(1.6, 1.6, 1); scene.add(weldFlash);
  let weldAt = 2.5; let weldLife = -1;

  // dust shafts under the yard lamps
  const shafts = [];
  const shaftTex = (() => {
    const c = document.createElement('canvas'); c.width = 32; c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(255,210,150,0.55)'); gr.addColorStop(1, 'rgba(255,210,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 128);
    return new THREE.CanvasTexture(c);
  })();
  for (const [x, z] of [[-8, 8], [8, 8], [-8, -4], [8, -4]]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.4),
      new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.07,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    s.position.set(x, 2.2, z); s.rotation.y = Math.PI / 4; scene.add(s);
    shafts.push(s);
  }

  return {
    step(dt) {
      t += dt;
      for (const b of blinkers) {
        const on = (Math.sin((t + b.phase) * Math.PI * 2 / b.period) > 0.2) ? 1 : 0.12;
        b.s.material.opacity = 0.85 * on;
        const sc = b.size * (0.8 + 0.35 * on);
        b.s.scale.set(sc, sc, 1);
      }
      // neon: mostly steady, occasional drop-out flicker
      const flick = (Math.sin(t * 13.7) * Math.sin(t * 7.3) > 0.93) ? 0.25 : 1;
      neon.material.opacity = flick;
      neonGlow.material.opacity = 0.35 * flick;
      // tarp breathes
      const pos = tarpGeo.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        const bx = tarpBase[i * 3]; const by = tarpBase[i * 3 + 1];
        pos.setZ(i, Math.sin(bx * 2.1 + t * 1.8) * 0.06 + Math.cos(by * 1.7 + t * 1.3) * 0.05);
      }
      pos.needsUpdate = true;
      blades.rotation.z += dt * 9;
      for (const f of flags) f.cloth.rotation.y = Math.sin(t * 2.2 + f.ph) * 0.45;
      for (const b of birds) {
        b.g.position.x += b.speed * dt;
        b.g.position.y = b.y + Math.sin(t * 1.4 + b.g.position.x * 0.08) * 0.5;
        const flap = Math.sin(t * 9 + b.g.position.x) * 0.55;
        b.w1.rotation.z = flap; b.w2.rotation.z = -flap;
        if (b.g.position.x > 44) b.g.position.x = -44;
      }
      // welding: a burst every few seconds
      weldAt -= dt;
      if (weldAt <= 0 && weldLife < 0) {
        weldLife = 0.55;
        weldAt = 3.5 + Math.random() * 4;
        for (let i = 0; i < SPARKS; i += 1) {
          sparkPos[i * 3] = 16.5; sparkPos[i * 3 + 1] = 1.3; sparkPos[i * 3 + 2] = -15.1;
          sparkVel[i * 3] = (Math.random() - 0.5) * 3;
          sparkVel[i * 3 + 1] = 1 + Math.random() * 2.5;
          sparkVel[i * 3 + 2] = (Math.random() - 0.5) * 3;
        }
      }
      if (weldLife >= 0) {
        weldLife -= dt;
        const k = Math.max(0, weldLife / 0.55);
        sparkPts.material.opacity = k;
        weldFlash.material.opacity = 0.75 * k;
        for (let i = 0; i < SPARKS; i += 1) {
          sparkVel[i * 3 + 1] -= 5 * dt;
          sparkPos[i * 3] += sparkVel[i * 3] * dt;
          sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * dt;
          sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * dt;
          if (sparkPos[i * 3 + 1] < 0.05) sparkPos[i * 3 + 1] = 0.05;
        }
        sparkGeo.attributes.position.needsUpdate = true;
        if (weldLife < 0) { sparkPts.material.opacity = 0; weldFlash.material.opacity = 0; }
      }
      for (let i = 0; i < shafts.length; i += 1) {
        shafts[i].material.opacity = 0.05 + 0.03 * Math.sin(t * 0.7 + i * 1.9);
      }
    },
  };
}
