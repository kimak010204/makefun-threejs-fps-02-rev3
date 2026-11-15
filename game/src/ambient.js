// The yard breathes: dust motes drifting in the low sun, smoke curling out
import * as THREE from 'three';

const DUST_COUNT = 130;
const SMOKE_POOL = 12;
const CLOUD_COUNT = 5;

export function createAmbient(scene, anchors) {
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST_COUNT * 3);
  const dustVel = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT; i += 1) {
    dustPos[i * 3] = (Math.random() * 2 - 1) * 22;
    dustPos[i * 3 + 1] = 0.3 + Math.random() * 5;
    dustPos[i * 3 + 2] = (Math.random() * 2 - 1) * 18;
    dustVel[i * 3] = (Math.random() - 0.5) * 0.25;
    dustVel[i * 3 + 1] = 0.02 + Math.random() * 0.06;
    dustVel[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xffd9a0, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false,
  }));
  dust.frustumCulled = false;
  scene.add(dust);

  const smokeTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const g = canvas.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(200, 200, 205, 0.55)');
    grad.addColorStop(0.6, 'rgba(180, 180, 188, 0.28)');
    grad.addColorStop(1, 'rgba(180, 180, 188, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  })();
  const smoke = [];
  for (let i = 0; i < SMOKE_POOL; i += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: smokeTexture, transparent: true, opacity: 0, depthWrite: false,
    }));
    sprite.visible = false;
    scene.add(sprite);
    smoke.push({ sprite, age: -1, seed: Math.random() * 10 });
  }
  let smokeTimer = 0;

  const clouds = [];
  for (let i = 0; i < CLOUD_COUNT; i += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: smokeTexture, transparent: true, opacity: 0.16, depthWrite: false, fog: false,
    }));
    const x = -50 + i * 24 + Math.random() * 8;
    sprite.position.set(x, 22 + Math.random() * 8, -38 - Math.random() * 10);
    sprite.scale.set(26 + Math.random() * 14, 7 + Math.random() * 3, 1);
    scene.add(sprite);
    clouds.push(sprite);
  }

  const hookHome = anchors.hook ? anchors.hook.position.clone() : new THREE.Vector3();
  const lampBase = anchors.flickerLamp ? anchors.flickerLamp.intensity : 0;
  let time = 0;

  return {
    step(dt) {
      time += dt;
      const pos = dust.geometry.attributes.position;
      for (let i = 0; i < DUST_COUNT; i += 1) {
        let x = pos.getX(i) + dustVel[i * 3] * dt;
        let y = pos.getY(i) + dustVel[i * 3 + 1] * dt;
        let z = pos.getZ(i) + dustVel[i * 3 + 2] * dt;
        if (x > 22) x = -22;
        if (x < -22) x = 22;
        if (y > 5.4) y = 0.3;
        if (z > 18) z = -18;
        if (z < -18) z = 18;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
      smokeTimer -= dt;
      if (smokeTimer <= 0) {
        smokeTimer = 0.7;
        const slot = smoke.find((s) => s.age < 0);
        if (slot) {
          slot.age = 0;
          slot.sprite.visible = true;
          slot.sprite.position.copy(anchors.chimney);
        }
      }
      for (const slot of smoke) {
        if (slot.age < 0) continue;
        slot.age += dt;
        const age = slot.age / 4.5;
        if (age >= 1) {
          slot.age = -1;
          slot.sprite.visible = false;
          continue;
        }
        slot.sprite.position.y += dt * 1.6;
        slot.sprite.position.x += Math.sin(slot.age * 1.3 + slot.seed) * dt * 0.5;
        const size = 1.2 + age * 4.2;
        slot.sprite.scale.set(size, size, 1);
        slot.sprite.material.opacity = 0.5 * (1 - age);
      }
      if (anchors.hook) {
        anchors.hook.position.x = hookHome.x + Math.sin(time * 0.45) * 0.35;
        anchors.hook.position.z = hookHome.z + Math.cos(time * 0.32) * 0.22;
      }
      if (anchors.furnaceGlow) {
        const glow = 0.75 + Math.sin(time * 2.1) * 0.25;
        anchors.furnaceGlow.material.color.setRGB(1.0, 0.48 * glow + 0.1, 0.1);
      }
      if (anchors.flickerLamp) {
        const flicker = Math.sin(time * 13.7) * Math.sin(time * 7.3) > 0.86 ? 0.35 : 1;
        anchors.flickerLamp.intensity = lampBase * flicker;
      }
      for (const cloud of clouds) {
        cloud.position.x += dt * 0.35;
        if (cloud.position.x > 60) cloud.position.x = -60;
      }
    },
  };
}
