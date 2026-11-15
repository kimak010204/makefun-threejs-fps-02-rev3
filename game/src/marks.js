// Bullet-hole decals: a small pooled set of dark impact rings, stamped on
// walls where the player's shots land. Purely visual, capped and recycled.
import * as THREE from 'three';

const MAX = 24;

export function createMarks(scene) {
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(6,6,8,0.95)'); gr.addColorStop(0.55, 'rgba(10,10,12,0.8)');
    gr.addColorStop(0.8, 'rgba(40,32,24,0.35)'); gr.addColorStop(1, 'rgba(40,32,24,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    // radial cracks + chipped rim so the hole reads at a glance
    g.strokeStyle = 'rgba(6,6,8,0.85)'; g.lineWidth = 1.6;
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + 0.35 * i;
      g.beginPath(); g.moveTo(32 + Math.cos(a) * 6, 32 + Math.sin(a) * 6);
      g.lineTo(32 + Math.cos(a) * (20 + (i % 3) * 6), 32 + Math.sin(a) * (20 + (i % 3) * 6));
      g.stroke();
    }
    g.strokeStyle = 'rgba(233,226,210,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.arc(32, 32, 12, 0, 7); g.stroke();
    return new THREE.CanvasTexture(c);
  })();
  const slots = [];
  for (let i = 0; i < MAX; i += 1) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2 }));
    m.visible = false; scene.add(m); slots.push(m);
  }
  let cursor = 0;
  const tmp = new THREE.Vector3();
  return {
    add(point, normal) {
      const s = slots[cursor]; cursor = (cursor + 1) % MAX;
      s.position.copy(point).addScaledVector(normal, 0.015);
      tmp.copy(point).add(normal);
      s.lookAt(tmp);
      s.visible = true;
    },
    reset() { for (const s of slots) s.visible = false; },
  };
}
