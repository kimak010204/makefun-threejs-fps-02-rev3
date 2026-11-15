// Short-lived combat visuals, all pooled up front: bullet tracers, impact
import * as THREE from 'three';

const TRACERS = 14;
const SPARK_SETS = 10;
const SPARKS_EACH = 14;
const PUFFS = 8;
const CASINGS = 12;
const TRACER_LIFE = 0.3;
const SPARK_LIFE = 0.35;

function softTexture(inner, mid) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.6, mid);
  grad.addColorStop(1, 'rgba(190, 190, 198, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export function createEffects(scene) {
  const tracerSlots = Array.from({ length: TRACERS }, () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false,
    }));
    line.visible = false;
    line.frustumCulled = false;
    scene.add(line);
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.035, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffe0b0, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    beam.visible = false;
    beam.frustumCulled = false;
    scene.add(beam);
    return { line, beam, life: 0 };
  });
  let tracerCursor = 0;

  const sparkSlots = Array.from({ length: SPARK_SETS }, () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARKS_EACH * 3), 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffc46b, size: 0.09, transparent: true, opacity: 0, depthWrite: false,
    }));
    points.visible = false;
    points.frustumCulled = false;
    scene.add(points);
    return { points, life: 0, velocities: new Float32Array(SPARKS_EACH * 3) };
  });
  let sparkCursor = 0;

  const puffTexture = softTexture('rgba(210, 210, 215, 0.6)', 'rgba(190, 190, 198, 0.3)');
  const puffSlots = Array.from({ length: PUFFS }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: puffTexture, transparent: true, opacity: 0, depthWrite: false,
    }));
    sprite.visible = false;
    scene.add(sprite);
    return { sprite, life: 0, maxLife: 1 };
  });
  let puffCursor = 0;

  const casingGeo = new THREE.BoxGeometry(0.024, 0.024, 0.05);
  const brassMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#c9971f'), roughness: 0.35, metalness: 0.7 });
  const casingSlots = Array.from({ length: CASINGS }, () => {
    const mesh = new THREE.Mesh(casingGeo, brassMat);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, life: 0, vel: new THREE.Vector3(), spin: 0 };
  });
  let casingCursor = 0;

  const fireball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xff8c2e, transparent: true, opacity: 0, depthWrite: false }),
  );
  fireball.visible = false;
  scene.add(fireball);
  const fireLight = new THREE.PointLight(0xff8c2e, 0, 22, 1.6);
  scene.add(fireLight);
  let fireLife = 0;

  function tracer(from, to) {
    const slot = tracerSlots[tracerCursor];
    tracerCursor = (tracerCursor + 1) % TRACERS;
    const pos = slot.line.geometry.attributes.position;
    pos.setXYZ(0, from.x, from.y, from.z);
    pos.setXYZ(1, to.x, to.y, to.z);
    pos.needsUpdate = true;
    slot.line.visible = true;
    slot.life = TRACER_LIFE;
    slot.line.material.opacity = 0.85;
    slot.beam.position.copy(from).add(to).multiplyScalar(0.5);
    slot.beam.lookAt(to);
    slot.beam.scale.set(1, 1, from.distanceTo(to));
    slot.beam.visible = true;
    slot.beam.material.opacity = 0.9;
  }

  function burst(point, color = 0xffc46b, speed = 3.2) {
    const slot = sparkSlots[sparkCursor];
    sparkCursor = (sparkCursor + 1) % SPARK_SETS;
    slot.points.material.color.setHex(color);
    const pos = slot.points.geometry.attributes.position;
    for (let i = 0; i < SPARKS_EACH; i += 1) {
      pos.setXYZ(i, point.x, point.y, point.z);
      const az = Math.random() * Math.PI * 2;
      const el = (Math.random() - 0.5) * Math.PI;
      const s = speed * (0.4 + Math.random() * 0.8);
      slot.velocities[i * 3] = Math.cos(az) * Math.cos(el) * s;
      slot.velocities[i * 3 + 1] = Math.abs(Math.sin(el)) * s + 1.2;
      slot.velocities[i * 3 + 2] = Math.sin(az) * Math.cos(el) * s;
    }
    pos.needsUpdate = true;
    slot.points.visible = true;
    slot.life = SPARK_LIFE;
    slot.points.material.opacity = 1;
  }

  function puff(point, size = 0.8, life = 0.9) {
    const slot = puffSlots[puffCursor];
    puffCursor = (puffCursor + 1) % PUFFS;
    slot.sprite.position.copy(point);
    slot.sprite.scale.set(size, size, 1);
    slot.sprite.visible = true;
    slot.life = life;
    slot.maxLife = life;
    slot.sprite.material.opacity = 0.55;
  }

  function eject(from, right) {
    const slot = casingSlots[casingCursor];
    casingCursor = (casingCursor + 1) % CASINGS;
    slot.mesh.position.copy(from);
    slot.vel.set(right.x * (1 + Math.random()), 1.6 + Math.random() * 0.8, right.z * (1 + Math.random()));
    slot.spin = (Math.random() - 0.5) * 18;
    slot.mesh.visible = true;
    slot.life = 0.9;
  }

  function explosion(point) {
    burst(point, 0xff8c2e, 7);
    burst(point, 0xffe08a, 4.5);
    puff(point, 2.2, 1.4);
    fireball.position.copy(point);
    fireball.visible = true;
    fireLife = 0.45;
    fireLight.position.copy(point);
    fireLight.position.y += 0.5;
    fireLight.intensity = 160;
  }

  function step(dt) {
    for (const slot of tracerSlots) {
      if (slot.life <= 0) continue;
      slot.life -= dt;
      const k = Math.max(0, slot.life / TRACER_LIFE);
      slot.line.material.opacity = k * 0.85;
      slot.beam.material.opacity = k * 0.9;
      if (slot.life <= 0) { slot.line.visible = false; slot.beam.visible = false; }
    }
    for (const slot of sparkSlots) {
      if (slot.life <= 0) continue;
      slot.life -= dt;
      const pos = slot.points.geometry.attributes.position;
      for (let i = 0; i < SPARKS_EACH; i += 1) {
        slot.velocities[i * 3 + 1] -= 9 * dt;
        pos.setXYZ(i,
          pos.getX(i) + slot.velocities[i * 3] * dt,
          Math.max(0.03, pos.getY(i) + slot.velocities[i * 3 + 1] * dt),
          pos.getZ(i) + slot.velocities[i * 3 + 2] * dt);
      }
      pos.needsUpdate = true;
      slot.points.material.opacity = Math.max(0, slot.life / SPARK_LIFE);
      if (slot.life <= 0) slot.points.visible = false;
    }
    for (const slot of puffSlots) {
      if (slot.life <= 0) continue;
      slot.life -= dt;
      const age = 1 - Math.max(0, slot.life / slot.maxLife);
      const size = slot.sprite.scale.x + dt * 1.4;
      slot.sprite.scale.set(size, size, 1);
      slot.sprite.position.y += dt * 0.4;
      slot.sprite.material.opacity = Math.max(0, 0.55 * (1 - age));
      if (slot.life <= 0) slot.sprite.visible = false;
    }
    for (const slot of casingSlots) {
      if (slot.life <= 0) continue;
      slot.life -= dt;
      slot.vel.y -= 12 * dt;
      slot.mesh.position.addScaledVector(slot.vel, dt);
      slot.mesh.rotation.x += slot.spin * dt;
      slot.mesh.rotation.z += slot.spin * 0.6 * dt;
      if (slot.mesh.position.y < 0.03) {
        slot.mesh.position.y = 0.03;
        slot.vel.set(0, 0, 0);
        slot.spin = 0;
      }
      if (slot.life <= 0) slot.mesh.visible = false;
    }
    if (fireLife > 0) {
      fireLife -= dt;
      const age = 1 - Math.max(0, fireLife / 0.45);
      const radius = 0.6 + age * 5.4;
      fireball.scale.set(radius, radius, radius);
      fireball.material.opacity = Math.max(0, 0.75 * (1 - age));
      fireLight.intensity = Math.max(0, 160 * (1 - age));
      if (fireLife <= 0) {
        fireball.visible = false;
        fireLight.intensity = 0;
      }
    }
  }

  return { tracer, burst, puff, eject, explosion, step, tmp: new THREE.Vector3() };
}
