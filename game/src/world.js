// YARD 7, a dusk scrapyard. Two lanes (A west, B east) and a mid connector
import * as THREE from 'three';
import { PALETTE } from './palette.js';

const SHARED_MATS = new Map();
function paint(name, color, rough = 0.92, metal = 0.05) {
  const key = `${name}|${color}|${rough}|${metal}`;
  if (!SHARED_MATS.has(key)) {
    SHARED_MATS.set(key, new THREE.MeshStandardMaterial({
      color: new THREE.Color(color), roughness: rough, metalness: metal,
    }));
  }
  return SHARED_MATS.get(key);
}

function makeCanvas(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function groundTexture() {
  return makeCanvas(1024, 832, (ctx, w, h) => {
    ctx.fillStyle = '#333845';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i += 1) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
    for (let i = 0; i < 18; i += 1) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 18 + Math.random() * 55;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
      grad.addColorStop(0, 'rgba(12,12,16,0.5)');
      grad.addColorStop(1, 'rgba(12,12,16,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(10,10,14,0.35)';
    ctx.lineWidth = 7;
    for (const x of [150, 300, 700, 870, 500]) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x + (Math.random() * 20 - 10), h - 20);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 22; i += 1) {
      let x = Math.random() * w;
      let y = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s += 1) {
        x += Math.random() * 36 - 18;
        y += Math.random() * 36 - 18;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

function signTexture(text, color, w, h, fontPx, sub) {
  return makeCanvas(w, h, (ctx) => {
    ctx.fillStyle = '#14161c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = w > 300 ? 6 : 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = color;
    ctx.font = `bold ${fontPx}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, sub ? h / 2 - 18 : h / 2 + 6);
    if (sub) {
      ctx.fillStyle = '#8b95a6';
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillText(sub, w / 2, h / 2 + 34);
    }
  });
}

function skyTexture() {
  return makeCanvas(16, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a2233');
    grad.addColorStop(0.45, '#3a3a4e');
    grad.addColorStop(0.68, '#8a5a3c');
    grad.addColorStop(0.8, '#d98a3d');
    grad.addColorStop(1, '#2b3140');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
}

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const colliders = [];
  const shootables = [];

  function solidBox(w, h, d, x, y, z, material, collide = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (collide) {
      colliders.push(new THREE.Box3().setFromObject(mesh));
      shootables.push(mesh);
    }
    return mesh;
  }

  function solidCylinder(r, h, x, y, z, material, segments = 14) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    colliders.push(new THREE.Box3().setFromObject(mesh));
    shootables.push(mesh);
    return mesh;
  }

  function groundPlane(w, d, x, z, material, y = 0.02) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  const groundMat = new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 0.96, metalness: 0.02 });
  const wallMat = paint('wall', PALETTE.surface, 0.95, 0.04);
  const wallDark = paint('wallDark', '#22262f', 0.95, 0.04);
  const steelMat = paint('steel', PALETTE.hairline, 0.6, 0.45);
  const rustMat = paint('rust', PALETTE.rust, 0.85, 0.25);
  const tealMat = paint('teal', PALETTE.teal, 0.85, 0.2);
  const crateMat = paint('crate', '#6b5a41', 0.9, 0.08);
  const yellowMat = paint('yellow', '#c9971f', 0.7, 0.3);
  const darkMat = paint('dark', '#17191f', 0.9, 0.1);
  const sandMat = paint('sand', '#7a6a4e', 0.95, 0.02);
  const tyreMat = paint('tyre', '#15161a', 0.9, 0.05);

  scene.background = skyTexture();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 38), groundMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  group.add(floor);
  solidBox(0.6, 4.2, 38, -22.3, 2.1, 0, wallMat);
  solidBox(0.6, 4.2, 38, 22.3, 2.1, 0, wallMat);
  solidBox(46, 4.2, 0.6, 0, 2.1, -18.3, wallMat);
  solidBox(46, 4.2, 0.6, 0, 2.1, 18.3, wallMat);

  solidBox(8, 3.4, 6, 0, 1.7, -4, wallDark);
  solidBox(8.4, 0.3, 6.4, 0, 3.55, -4, steelMat);

  solidBox(0.6, 3.2, 10, -10, 1.6, -7, wallMat);
  solidBox(0.6, 3.2, 10, 10, 1.6, -7, wallMat);
  solidBox(16, 3.2, 0.6, 0, 1.6, -12.5, wallMat);

  solidBox(0.6, 3.2, 8, -19, 1.6, -11, wallMat);
  solidBox(8, 3.2, 0.6, -15, 1.6, -15, wallMat);
  solidBox(6, 3.2, 0.6, -16, 1.6, -7, wallMat);
  solidBox(0.6, 3.2, 3, -11, 1.6, -13.5, wallMat);
  solidBox(0.6, 3.2, 8, 19, 1.6, -11, wallMat);
  solidBox(8, 3.2, 0.6, 15, 1.6, -15, wallMat);
  solidBox(6, 3.2, 0.6, 16, 1.6, -7, wallMat);
  solidBox(0.6, 3.2, 3, 11, 1.6, -13.5, wallMat);

  solidBox(4, 2.6, 2.6, -19.5, 1.3, 2, rustMat);
  solidBox(4, 2.6, 2.6, -19.5, 1.3, 8.5, tealMat);
  solidBox(2.6, 2.6, 6, -19, 1.3, -3.5, tealMat);
  solidBox(4, 2.6, 2.6, 19.5, 1.3, 2, tealMat);
  solidBox(4, 2.6, 2.6, 19.5, 1.3, 8.5, rustMat);
  solidBox(2.6, 2.6, 6, 19, 1.3, -3.5, rustMat);
  solidBox(5, 2.6, 2.6, -6.5, 1.3, 6.5, rustMat);
  solidBox(5, 2.6, 2.6, 6.5, 1.3, 6.5, tealMat);
  solidBox(4.4, 2.6, 2.6, -17.6, 1.3, -12.6, rustMat);
  solidBox(4.4, 2.6, 2.6, 17.8, 1.3, -13, tealMat);
  solidBox(4.4, 2.6, 2.6, -6.5, 3.9, 6.5, tealMat); // stacked: the only high ground

  const crates = [
    [-18, 0.6, -8.5, 1.2], [-6.5, 0.6, -11.5, 1.2], [-3, 0.6, 2.8, 1.2],
    [3, 0.6, 2.8, 1.2], [6.5, 0.6, -11.5, 1.2], [18, 0.6, -8.5, 1.2],
    [-12, 0.6, 14.5, 1.2], [12, 0.6, 14.5, 1.2], [-6.5, 1.8, -11.5, 1.2],
    [6.5, 1.8, -11.5, 1.2], [-17, 0.6, -8.2, 1.2], [18, 0.6, -13.5, 1.2],
  ];
  for (const [x, y, z, s] of crates) solidBox(s, s, s, x, y, z, crateMat);

  const sandbags = [
    [-13.5, -8.2], [-12.6, -8.2], [12.6, -8.2], [13.5, -8.2],
    [-9.5, -11.8], [9.5, -11.8], [-4, 12.5], [4, 12.5],
  ];
  for (const [x, z] of sandbags) {
    solidBox(1.1, 0.55, 0.5, x, 0.28, z, sandMat);
    solidBox(1.0, 0.5, 0.45, x, 0.78, z, sandMat);
  }
  const tyreStacks = [[-8.5, 2], [8.5, 2], [-14, 12], [14, 12], [0, -9.5]];
  for (const [x, z] of tyreStacks) {
    for (let i = 0; i < 3; i += 1) {
      const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.16, 8, 18), tyreMat);
      tyre.rotation.x = Math.PI / 2;
      tyre.position.set(x, 0.17 + i * 0.32, z);
      tyre.castShadow = true;
      tyre.receiveShadow = true;
      group.add(tyre);
    }
    colliders.push(new THREE.Box3(new THREE.Vector3(x - 0.6, 0, z - 0.6), new THREE.Vector3(x + 0.6, 1.1, z + 0.6)));
  }

  const barrels = [
    [-9, 13], [-8.1, 12.6], [-8.5, 13.8], [9, 13], [8.1, 12.6],
    [-19.5, 4], [-19.5, 5.2], [19.5, 4], [-6.5, 15.8], [6.5, 15.8],
  ];
  for (const [x, z] of barrels) solidCylinder(0.45, 1.1, x, 0.55, z, rustMat);

  solidBox(1.6, 1.1, 2.4, -16.5, 0.55, 5.2, yellowMat);
  solidBox(0.18, 2.2, 0.18, -17.1, 1.1, 3.9, darkMat);
  solidBox(0.18, 2.2, 0.18, -15.9, 1.1, 3.9, darkMat);
  solidBox(1.4, 0.08, 0.08, -16.5, 2.1, 3.9, darkMat);
  solidBox(2.2, 1.3, 1.2, 20.8, 0.65, 11.5, darkMat);
  solidBox(2.2, 0.1, 1.2, 20.8, 1.35, 11.5, steelMat);

  solidBox(0.9, 9, 0.9, -19.2, 4.5, -14.6, yellowMat);
  solidBox(0.9, 9, 0.9, -10.8, 4.5, -14.6, yellowMat);
  solidBox(9.6, 1.1, 1.3, -15, 9.2, -14.6, yellowMat);
  const hook = solidBox(0.7, 0.7, 0.7, -13, 7.6, -14.6, darkMat);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), darkMat);
  cable.position.set(-13, 8.5, -14.6);
  group.add(cable);

  solidBox(5, 4.4, 2.6, 16.5, 2.2, -16.6, darkMat);
  const furnaceGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff7a1a') }),
  );
  furnaceGlow.position.set(16.5, 1.1, -15.25);
  group.add(furnaceGlow);
  solidCylinder(0.7, 7.5, 18.4, 3.75, -16.8, steelMat);

  for (const z of [-16.9, 16.9]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 40, 10), steelMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 3.6, z);
    pipe.castShadow = true;
    group.add(pipe);
  }
  const wireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#0c0e12') });
  for (const [ax, az, bx, bz] of [[-8, 8, 8, 8], [-8, -4, 8, -4], [-8, 8, -8, -4], [8, 8, 8, -4]]) {
    const mid = new THREE.Vector3((ax + bx) / 2, 4.1, (az + bz) / 2);
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(ax, 4.45, az), mid, new THREE.Vector3(bx, 4.45, bz),
    );
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.02, 5), wireMat);
    group.add(wire);
  }

  const puddleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1c2733'), roughness: 0.08, metalness: 0.6,
  });
  for (const [x, z, r] of [[-4, 6, 1.6], [7, -6, 1.2], [-15, 0, 1.4], [12, 13, 1.1]]) {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(r, 20), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, 0.03, z);
    puddle.receiveShadow = true;
    group.add(puddle);
  }

  const zoneA = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.siteA), transparent: true, opacity: 0.16, depthWrite: false });
  const zoneB = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.siteB), transparent: true, opacity: 0.16, depthWrite: false });
  groundPlane(8, 8, -15, -11, zoneA);
  groundPlane(8, 8, 15, -11, zoneB);
  const lineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#c8c2b2'), transparent: true, opacity: 0.35, depthWrite: false });
  groundPlane(0.25, 26, -16, 2, lineMat);
  groundPlane(0.25, 26, 16, 2, lineMat);
  groundPlane(0.25, 12, 0, 8, lineMat);
  const arrowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#c8c2b2'), transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
  for (const [x, z, rot] of [[-14, 13, Math.PI * 0.15], [14, 13, -Math.PI * 0.15], [0, 12, 0], [-2, -14, Math.PI], [2, -14, Math.PI]]) {
    const arrow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 3), arrowMat);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = rot;
    arrow.position.set(x, 0.03, z);
    group.add(arrow);
  }
  const hazardMat = paint('hazard', '#c9971f', 0.9);
  groundPlane(8, 0.8, -15, -6.8, hazardMat);
  groundPlane(8, 0.8, 15, -6.8, hazardMat);

  for (const [letter, color, x] of [['A', PALETTE.siteA, -15], ['B', PALETTE.siteB, 15]]) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.2),
      new THREE.MeshBasicMaterial({ map: signTexture(letter, color, 256, 256, 158), transparent: true, side: THREE.DoubleSide }),
    );
    sign.position.set(x, 4.6, -14.9);
    group.add(sign);
  }
  const yardSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 1),
    new THREE.MeshBasicMaterial({ map: signTexture('YARD 7', '#f5a623', 512, 128, 52, 'SCRAP & SALVAGE'), transparent: true }),
  );
  yardSign.position.set(0, 3.4, 17.9);
  yardSign.rotation.y = Math.PI;
  group.add(yardSign);
  const dangerSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 0.75),
    new THREE.MeshBasicMaterial({ map: signTexture('DANGER — LIVE FIRE', '#e8532f', 512, 128, 52), transparent: true }),
  );
  dangerSign.position.set(-10, 3.2, -12.2);
  dangerSign.rotation.y = Math.PI / 2;
  group.add(dangerSign);
  const midSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.6),
    new THREE.MeshBasicMaterial({ map: signTexture('MID', '#8b95a6', 512, 128, 52), transparent: true }),
  );
  midSign.position.set(0, 3.6, -1);
  midSign.rotation.y = Math.PI;
  group.add(midSign);

  const lampHeadMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0') });
  const lampLights = [];
  for (const [x, z] of [[-8, 8], [8, 8], [-8, -4], [8, -4]]) {
    solidCylinder(0.09, 4.4, x, 2.2, z, darkMat, 8);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), lampHeadMat);
    head.position.set(x, 4.5, z);
    group.add(head);
    const lamp = new THREE.PointLight(new THREE.Color('#ffc27a'), 10, 12, 1.8);
    lamp.position.set(x, 4.4, z);
    scene.add(lamp);
    lampLights.push(lamp);
  }

  const skylineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#161a21') });
  const skyline = [
    [-30, 6, -26, 8, 12, 4], [-18, 9, -28, 10, 18, 4], [-4, 5, -28, 7, 10, 4],
    [10, 8, -28, 9, 16, 4], [26, 6, -26, 8, 12, 4], [-32, 7, 10, 4, 14, 8], [32, 9, 6, 4, 18, 8],
    [-38, 5, -8, 6, 10, 6], [38, 4, -14, 6, 8, 6], [0, 11, -34, 12, 22, 4],
    [-26, 4, 24, 6, 8, 6], [24, 5, 24, 7, 10, 6], [-12, 7, 30, 8, 14, 4],
  ];
  for (const [x, h, z, w, hh, d] of skyline) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), skylineMat);
    m.position.set(x, h, z);
    group.add(m);
  }
  const windowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffca7a') });
  for (const [x, y, z] of [[-18, 9, -25.9], [-4, 6, -25.9], [10, 10, -25.9], [26, 7, -23.9], [-32, 8, 14.1], [0, 12, -31.9], [-12, 8, 27.9], [24, 6, 21.9]]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), windowMat);
    win.position.set(x, y, z);
    group.add(win);
  }
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb84d'), fog: false }),
  );
  sun.position.set(-34, 13, -30);
  sun.lookAt(0, 2, 0);
  group.add(sun);

  scene.fog = new THREE.Fog(new THREE.Color(PALETTE.canvas), 26, 70);
  const sky = new THREE.HemisphereLight(new THREE.Color('#8b9bb5'), new THREE.Color('#3a2f22'), 1.5);
  scene.add(sky);
  const key = new THREE.DirectionalLight(new THREE.Color('#ffc27a'), 3.2);
  key.position.set(-26, 16, 6);
  key.target.position.set(4, 0, -4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -30;
  key.shadow.camera.right = 30;
  key.shadow.camera.top = 30;
  key.shadow.camera.bottom = -30;
  key.shadow.camera.far = 80;
  key.shadow.bias = -0.0005;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(new THREE.Color('#5f7ea8'), 0.8);
  fill.position.set(18, 12, 14);
  scene.add(fill);
  const midLamp = new THREE.PointLight(new THREE.Color('#ffc27a'), 26, 26, 1.8);
  midLamp.position.set(0, 4.4, 4);
  scene.add(midLamp);
  const siteLamp = new THREE.PointLight(new THREE.Color('#ff8c3a'), 18, 18, 1.8);
  siteLamp.position.set(16.5, 3.4, -13);
  scene.add(siteLamp);
  const craneLamp = new THREE.PointLight(new THREE.Color('#ffc27a'), 14, 16, 1.8);
  craneLamp.position.set(-15, 4, -11);
  scene.add(craneLamp);

  return {
    colliders,
    shootables,
    group,
    anchors: {
      hook,
      furnaceGlow,
      flickerLamp: lampLights[2],
      chimney: new THREE.Vector3(18.4, 7.6, -16.8),
    },
    sites: {
      A: { center: new THREE.Vector3(-15, 0, -11), radius: 4 },
      B: { center: new THREE.Vector3(15, 0, -11), radius: 4 },
    },
    spawns: {
      attack: [
        new THREE.Vector3(-4, 0, 15), new THREE.Vector3(0, 0, 15.5),
        new THREE.Vector3(4, 0, 15), new THREE.Vector3(-1.5, 0, 16.5),
      ],
      defend: [
        new THREE.Vector3(-6, 0, -16), new THREE.Vector3(0, 0, -16.5),
        new THREE.Vector3(6, 0, -16), new THREE.Vector3(-2, 0, -15),
      ],
    },
  };
}
