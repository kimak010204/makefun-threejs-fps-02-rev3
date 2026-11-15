// Thrown utility: frag, flash and smoke in one pool. A frag bounces, beeps
import * as THREE from 'three';

export const UTIL_DEFS = {
  frag: { id: 'frag', name: 'SPARK FRAG', short: 'FRAG', price: 300, max: 2, key: '6', desc: 'Bounce, beep, boom' },
  flash: { id: 'flash', name: 'DAZZLE FLASH', short: 'FLASH', price: 200, max: 2, key: '7', desc: 'White-out on pop' },
  smoke: { id: 'smoke', name: 'VEIL SMOKE', short: 'SMOKE', price: 300, max: 2, key: '8', desc: '12s sight wall' },
};
export const UTIL_ORDER = ['frag', 'flash', 'smoke'];
export const SMOKE_SECONDS = 12;
export const SMOKE_RADIUS = 3.2;
export const FLASH_RADIUS = 18;

const FALL = 14;
const MAX_LIVE = 6;
const MAX_CLOUDS = 4;
const SPRITES_PER_CLOUD = 4;
const BLAST_RADIUS = 6.5;
const BLAST_DAMAGE = 95;
const FRAG_FUSE = 2.4;
const FLASH_FUSE = 0.9;
const SMOKE_FUSE = 1.6;

const KIND_COLOR = { frag: '#3f6f4a', flash: '#e8e8e8', smoke: '#7a7f88' };

export function createUtility(scene, colliders, effects, audio, hooks) {
  const pool = [];
  const shellMat = {};
  for (const kind of UTIL_ORDER) {
    shellMat[kind] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(KIND_COLOR[kind]), roughness: 0.6, metalness: 0.3,
    });
  }
  const ballGeo = new THREE.SphereGeometry(0.09, 12, 9);
  for (let i = 0; i < MAX_LIVE; i += 1) {
    const mesh = new THREE.Mesh(ballGeo, shellMat.frag);
    mesh.visible = false;
    mesh.castShadow = true;
    scene.add(mesh);
    pool.push({ mesh, kind: 'frag', pos: new THREE.Vector3(), vel: new THREE.Vector3(), fuse: 0, live: false, bounced: false, beepAt: 0 });
  }

  const puffTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const g = canvas.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(200, 200, 208, 0.75)');
    grad.addColorStop(0.6, 'rgba(185, 185, 195, 0.4)');
    grad.addColorStop(1, 'rgba(185, 185, 195, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  })();
  const smokeSprites = [];
  for (let i = 0; i < MAX_CLOUDS * SPRITES_PER_CLOUD; i += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: puffTexture, transparent: true, opacity: 0, depthWrite: false,
    }));
    sprite.visible = false;
    scene.add(sprite);
    smokeSprites.push({ sprite, cloud: -1 });
  }
  const clouds = [];
  let now = 0;

  const probe = new THREE.Box3();
  function hitsSolid(x, y, z) {
    probe.min.set(x - 0.09, y - 0.09, z - 0.09);
    probe.max.set(x + 0.09, y + 0.09, z + 0.09);
    for (const collider of colliders) if (probe.intersectsBox(collider)) return true;
    return false;
  }

  function deploySmoke(pos) {
    const cloud = { pos: pos.clone(), r: SMOKE_RADIUS, until: now + SMOKE_SECONDS, sprites: [] };
    if (clouds.length >= MAX_CLOUDS) {
      const old = clouds.shift();
      for (const s of old.sprites) { s.sprite.visible = false; s.cloud = -1; }
    }
    clouds.push(cloud);
    const free = smokeSprites.filter((s) => s.cloud === -1).slice(0, SPRITES_PER_CLOUD);
    for (let i = 0; i < free.length; i += 1) {
      const s = free[i];
      const angle = (i / SPRITES_PER_CLOUD) * Math.PI * 2;
      s.sprite.position.set(pos.x + Math.cos(angle) * 1.1, 1.0 + (i % 2) * 0.7, pos.z + Math.sin(angle) * 1.1);
      s.sprite.scale.set(3.4, 3.4, 1);
      s.sprite.visible = true;
      s.sprite.material.opacity = 0.85;
      s.cloud = clouds.length - 1;
      cloud.sprites.push(s);
    }
    audio.smokeHiss();
    hooks.onSmoke(pos.clone());
  }

  function popFlash(pos) {
    effects.burst(pos, 0xffffff, 6);
    effects.puff(pos, 1.4, 0.5);
    audio.flashRing();
    hooks.onFlash(pos.clone());
  }

  function detonate(slot) {
    slot.live = false;
    slot.mesh.visible = false;
    if (slot.kind === 'frag') {
      effects.explosion(slot.pos);
      effects.puff(slot.pos, 1.6, 1.1);
      audio.explosion();
      hooks.onBlast(slot.pos.clone(), BLAST_RADIUS, BLAST_DAMAGE);
    } else if (slot.kind === 'flash') {
      popFlash(slot.pos);
    } else {
      deploySmoke(slot.pos);
    }
  }

  return {
    clouds,
    throwFrom(from, dir, speed = 13, kind = 'frag', lob = false) {
      const slot = pool.find((s) => !s.live);
      if (!slot) return false;
      slot.kind = kind;
      slot.mesh.material = shellMat[kind];
      slot.live = true;
      slot.pos.copy(from);
      slot.vel.copy(dir).multiplyScalar(speed);
      slot.vel.y += lob ? 5.5 : 3.2;
      slot.fuse = kind === 'frag' ? FRAG_FUSE : kind === 'flash' ? FLASH_FUSE : SMOKE_FUSE;
      slot.bounced = false;
      slot.beepAt = 0;
      slot.mesh.visible = true;
      slot.mesh.position.copy(slot.pos);
      return true;
    },
    liveCount(kind) {
      return pool.filter((s) => s.live && (!kind || s.kind === kind)).length;
    },
    nearestLive(x, z) {
      let best = null;
      let bestDist = Infinity;
      for (const slot of pool) {
        if (!slot.live || slot.kind !== 'frag') continue;
        const d = Math.hypot(slot.pos.x - x, slot.pos.z - z);
        if (d < bestDist) {
          bestDist = d;
          best = slot;
        }
      }
      return best ? { pos: best.pos, dist: bestDist, fuse: best.fuse } : null;
    },
    blocksSight(a, b) {
      if (!clouds.length) return false;
      for (let t = 0; t <= 1.001; t += 0.1) {
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        const z = a.z + (b.z - a.z) * t;
        for (const c of clouds) {
          const dx = x - c.pos.x;
          const dy = y - 1.0;
          const dz = z - c.pos.z;
          if (dx * dx + dy * dy + dz * dz < c.r * c.r) return true;
        }
      }
      return false;
    },
    step(dt, time) {
      now = time;
      for (const slot of pool) {
        if (!slot.live) continue;
        slot.fuse -= dt;
        slot.vel.y -= FALL * dt;
        const next = slot.pos.clone().addScaledVector(slot.vel, dt);
        const hit = hitsSolid(next.x, next.y, next.z);
        if (hit) {
          if (slot.kind === 'frag') {
            const mx = Math.abs(next.x - slot.pos.x);
            const mz = Math.abs(next.z - slot.pos.z);
            const my = Math.abs(next.y - slot.pos.y);
            if (my >= mx && my >= mz) slot.vel.y = -slot.vel.y * 0.45;
            else if (mx >= mz) slot.vel.x = -slot.vel.x * 0.45;
            else slot.vel.z = -slot.vel.z * 0.45;
            slot.vel.multiplyScalar(0.7);
            if (!slot.bounced) {
              slot.bounced = true;
              slot.fuse = Math.min(slot.fuse, 1.4);
            }
          } else {
            slot.fuse = 0;
          }
        } else {
          slot.pos.copy(next);
        }
        if (slot.pos.y < 0.09) {
          slot.pos.y = 0.09;
          if (slot.kind === 'frag') {
            slot.vel.y = Math.abs(slot.vel.y) * 0.45;
            slot.vel.x *= 0.7;
            slot.vel.z *= 0.7;
            if (!slot.bounced) {
              slot.bounced = true;
              slot.fuse = Math.min(slot.fuse, 1.4);
            }
          } else {
            slot.fuse = 0;
          }
        }
        slot.mesh.position.copy(slot.pos);
        if (slot.kind === 'frag' && slot.fuse < 1.2) {
          slot.beepAt -= dt;
          if (slot.beepAt <= 0) {
            slot.beepAt = slot.fuse < 0.6 ? 0.18 : 0.35;
            audio.grenadeBeep();
          }
        }
        if (slot.fuse <= 0) detonate(slot);
      }
      for (let i = clouds.length - 1; i >= 0; i -= 1) {
        const c = clouds[i];
        const left = c.until - now;
        if (left <= 0) {
          for (const s of c.sprites) { s.sprite.visible = false; s.cloud = -1; }
          clouds.splice(i, 1);
          continue;
        }
        const fade = Math.min(1, left / 3);
        for (const s of c.sprites) {
          const size = s.sprite.scale.x + dt * 0.5;
          s.sprite.scale.set(size, size, 1);
          s.sprite.material.opacity = 0.85 * fade;
        }
      }
    },
    reset() {
      for (const slot of pool) {
        slot.live = false;
        slot.mesh.visible = false;
      }
      for (const c of clouds) for (const s of c.sprites) { s.sprite.visible = false; s.cloud = -1; }
      clouds.length = 0;
    },
  };
}
