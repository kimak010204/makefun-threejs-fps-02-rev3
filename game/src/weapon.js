// The arsenal: five guns, three thrown utilities and kevlar, their view
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { UTIL_DEFS, UTIL_ORDER } from './utility.js';

export const WEAPONS = {
  pistol: {
    id: 'pistol', slot: 1, name: 'P9 SIDEARM', price: 0, desc: 'Free sidearm, reliable',
    damage: 26, headMult: 3, mag: 12, reserve: 48, gap: 0.17, reload: 1.5,
    spreadStill: 0.003, spreadMove: 0.02, recoil: 0.011, auto: false, zoom: 0, pellets: 1,
  },
  smg: {
    id: 'smg', slot: 2, name: 'RAPTOR SMG', price: 1500, desc: 'Fast, close range',
    damage: 21, headMult: 3, mag: 30, reserve: 120, gap: 0.075, reload: 2.0,
    spreadStill: 0.006, spreadMove: 0.034, recoil: 0.007, auto: true, zoom: 0, pellets: 1,
  },
  rifle: {
    id: 'rifle', slot: 3, name: 'VK-47 RIFLE', price: 2700, desc: 'All-round auto rifle',
    damage: 34, headMult: 4, mag: 30, reserve: 90, gap: 0.11, reload: 2.2,
    spreadStill: 0.0018, spreadMove: 0.03, recoil: 0.013, auto: true, zoom: 0.5, pellets: 1,
  },
  shotgun: {
    id: 'shotgun', slot: 4, name: 'SCRAP-12 PUMP', price: 2000, desc: 'Devastating up close',
    damage: 13, headMult: 2, mag: 6, reserve: 24, gap: 0.9, reload: 2.6,
    spreadStill: 0.02, spreadMove: 0.05, recoil: 0.05, auto: false, zoom: 0, pellets: 8,
  },
  dmr: {
    id: 'dmr', slot: 5, name: 'LONGSHOT DMR', price: 4200, desc: 'One-shot long range',
    damage: 88, headMult: 4, mag: 5, reserve: 20, gap: 1.15, reload: 2.8,
    spreadStill: 0.0006, spreadMove: 0.045, recoil: 0.038, auto: false, zoom: 1, pellets: 1,
  },
};
export const WEAPON_ORDER = ['pistol', 'smg', 'rifle', 'shotgun', 'dmr'];
export const ARMOR_PRICE = 650;
export const ARMOR_MAX = 50;
export const ARMOR_SOAK = 0.5; // half of every hit goes into the vest

function buildViewModel(def) {
  const gripMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.hairline), roughness: 0.7, metalness: 0.2 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.ink), roughness: 0.5, metalness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#14161a'), roughness: 0.55, metalness: 0.4 });
  const brassMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#c9971f'), roughness: 0.35, metalness: 0.7 });
  const group = new THREE.Group();
  const box = (w, h, d, x, y, z, m) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  if (def.id === 'pistol') {
    box(0.06, 0.09, 0.26, 0, 0, -0.1, bodyMat);
    box(0.05, 0.12, 0.07, 0, -0.09, 0.02, gripMat);
    box(0.02, 0.03, 0.02, 0, 0.055, -0.2, darkMat);
    box(0.02, 0.02, 0.06, 0, 0.02, -0.24, brassMat);
  } else if (def.id === 'smg') {
    box(0.08, 0.09, 0.4, 0, 0, -0.08, bodyMat);
    box(0.045, 0.045, 0.34, 0, 0.02, -0.42, gripMat);
    box(0.06, 0.16, 0.06, 0, -0.12, -0.02, gripMat);
    box(0.07, 0.07, 0.18, 0, -0.01, 0.24, gripMat);
    box(0.02, 0.05, 0.02, 0, 0.07, -0.14, brassMat);
  } else if (def.id === 'rifle') {
    box(0.09, 0.1, 0.44, 0, 0, -0.08, bodyMat);
    box(0.045, 0.045, 0.42, 0, 0.025, -0.46, gripMat);
    box(0.075, 0.08, 0.22, 0, -0.02, 0.28, gripMat);
    box(0.05, 0.05, 0.1, 0, -0.11, 0.02, gripMat);
    box(0.02, 0.06, 0.02, 0, 0.08, -0.12, darkMat);
    box(0.03, 0.04, 0.12, 0, 0.09, -0.3, darkMat);
  } else if (def.id === 'shotgun') {
    box(0.1, 0.11, 0.5, 0, 0, -0.06, darkMat);
    box(0.07, 0.08, 0.3, 0, -0.03, -0.42, gripMat);
    box(0.06, 0.1, 0.06, 0, -0.12, -0.04, gripMat);
    box(0.08, 0.09, 0.24, 0, -0.02, 0.26, gripMat);
    box(0.05, 0.05, 0.08, 0, 0.085, -0.2, brassMat);
    box(0.02, 0.02, 0.3, 0.02, 0.07, -0.3, brassMat);
  } else {
    box(0.09, 0.11, 0.55, 0, 0, -0.1, darkMat);
    box(0.05, 0.05, 0.5, 0, 0.03, -0.55, gripMat);
    box(0.07, 0.07, 0.1, 0, 0.09, -0.18, bodyMat);
    box(0.06, 0.14, 0.06, 0, -0.12, 0.06, gripMat);
    box(0.075, 0.08, 0.24, 0, -0.02, 0.3, gripMat);
    box(0.04, 0.04, 0.14, 0, 0.1, -0.42, darkMat);
  }
  return group;
}

function buildUtilModel() {
  const group = new THREE.Group();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 14, 10),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#3f6f4a'), roughness: 0.6, metalness: 0.3 }),
  );
  const pin = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.05, 0.03),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#14161a'), roughness: 0.5, metalness: 0.4 }),
  );
  pin.position.set(0, 0.09, 0);
  group.add(ball, pin);
  return { group, ball };
}

export function createWeapon(camera, audio) {
  const models = {};
  for (const id of WEAPON_ORDER) {
    const model = buildViewModel(WEAPONS[id]);
    model.position.set(0.24, -0.2, -0.42);
    model.visible = false;
    camera.add(model);
    models[id] = model;
  }
  const util = buildUtilModel();
  util.group.position.set(0.22, -0.18, -0.4);
  util.group.visible = false;
  camera.add(util.group);

  const flashCanvas = document.createElement('canvas');
  flashCanvas.width = 64;
  flashCanvas.height = 64;
  {
    const ctx = flashCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 220, 140, 1)');
    grad.addColorStop(0.4, 'rgba(245, 168, 48, 0.85)');
    grad.addColorStop(1, 'rgba(245, 168, 48, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(flashCanvas), transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  flash.position.set(0.24, -0.16, -0.95);
  flash.scale.set(0.34, 0.34, 1);
  flash.visible = false;
  camera.add(flash);
  const flashLight = new THREE.PointLight(new THREE.Color(PALETTE.accent), 0, 6);
  flashLight.position.set(0.24, -0.16, -0.6);
  camera.add(flashLight);

  const ammo = {};
  for (const id of WEAPON_ORDER) ammo[id] = { mag: WEAPONS[id].mag, reserve: WEAPONS[id].reserve };
  const owned = new Set(['pistol']);
  const state = {
    current: 'pistol', cooldown: 0, reloadLeft: 0, flash: 0, kick: 0,
    util: 'frag', utilCount: { frag: 0, flash: 0, smoke: 0 }, utilMode: false,
    zoomed: false, inspect: 0, bobPhase: 0, armor: 0,
  };

  function currentDef() {
    return WEAPONS[state.current];
  }

  function showUtil() {
    for (const key of WEAPON_ORDER) models[key].visible = false;
    util.ball.material.color.set(UTIL_DEFS[state.util].id === 'frag' ? '#3f6f4a' : state.util === 'flash' ? '#e8e8e8' : '#7a7f88');
    util.group.visible = true;
  }

  function select(id) {
    if (state.utilMode && id !== 'util') {
      state.utilMode = false;
      util.group.visible = false;
    }
    if (id === 'util') {
      if (state.utilCount[state.util] <= 0) {
        const ownedKind = UTIL_ORDER.find((k) => state.utilCount[k] > 0);
        if (!ownedKind) return false;
        state.util = ownedKind;
      }
      state.utilMode = true;
      showUtil();
      state.reloadLeft = 0;
      audio?.click();
      return true;
    }
    if (!owned.has(id)) return false;
    state.current = id;
    state.reloadLeft = 0;
    state.inspect = 0;
    for (const key of WEAPON_ORDER) models[key].visible = key === id;
    audio?.click();
    return true;
  }

  function selectUtil(kind) {
    if (!UTIL_DEFS[kind] || state.utilCount[kind] <= 0) return false;
    state.util = kind;
    state.utilMode = true;
    state.reloadLeft = 0;
    showUtil();
    audio?.click();
    return true;
  }

  function cycleUtil() {
    const ownedKinds = UTIL_ORDER.filter((k) => state.utilCount[k] > 0);
    if (!ownedKinds.length) return false;
    const at = ownedKinds.indexOf(state.util);
    state.util = ownedKinds[(at + 1) % ownedKinds.length];
    if (state.utilMode) showUtil();
    audio?.click();
    return true;
  }

  function step(dt, aiming, speed = 0) {
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.kick += (0 - state.kick) * Math.min(1, dt * 14);
    state.inspect = Math.max(0, state.inspect - dt);
    state.bobPhase += dt * (2 + speed * 1.6);
    const def = currentDef();
    const model = models[state.current];
    const zoom = def.zoom ? def.zoom : 0;
    const homeZ = -0.42 + (aiming && zoom ? 0.1 : 0);
    const homeX = aiming && zoom ? 0 : 0.24;
    const homeY = aiming && zoom ? -0.155 : -0.2;
    const bobAmp = aiming ? 0.002 : Math.min(0.012, speed * 0.0022);
    const bobY = Math.sin(state.bobPhase * 2) * bobAmp;
    const bobX = Math.cos(state.bobPhase) * bobAmp * 0.6;
    model.position.z = homeZ + state.kick;
    model.position.x += (homeX + bobX - model.position.x) * Math.min(1, dt * 16);
    model.position.y += (homeY + bobY - model.position.y) * Math.min(1, dt * 16);
    if (state.inspect > 0) {
      const t = 1 - state.inspect / 0.9;
      model.rotation.y = Math.sin(t * Math.PI) * 1.4;
      model.rotation.x = state.kick * 2.2 - Math.sin(t * Math.PI) * 0.5;
    } else {
      model.rotation.y = 0;
      model.rotation.x = state.kick * 2.2;
    }
    util.group.position.z = -0.4 + state.kick;
    util.group.rotation.x = state.kick * 2;
    flash.visible = state.flash > 0;
    flash.material.opacity = state.flash > 0 ? 0.9 : 0;
    flashLight.intensity = state.flash > 0 ? 12 : 0;
    if (state.reloadLeft > 0) {
      state.reloadLeft = Math.max(0, state.reloadLeft - dt);
      model.rotation.x = -0.55 * Math.min(1, (def.reload - state.reloadLeft) * 2);
      if (state.reloadLeft === 0) {
        const slot = ammo[state.current];
        const need = def.mag - slot.mag;
        const take = Math.min(need, slot.reserve);
        slot.mag += take;
        slot.reserve -= take;
      }
    }
    state.zoomed = Boolean(aiming && zoom);
  }

  return {
    state,
    ammo,
    owned,
    step,
    select,
    selectUtil,
    cycleUtil,
    currentDef,
    inspect() {
      if (state.reloadLeft > 0 || state.utilMode) return;
      state.inspect = 0.9;
      audio?.click();
    },
    ready() {
      if (state.utilMode) return state.cooldown === 0;
      return ammo[state.current].mag > 0 && state.cooldown === 0 && state.reloadLeft === 0;
    },
    pullTrigger() {
      state.cooldown = currentDef().gap;
      state.flash = 0.06;
      state.kick = 0.055 + currentDef().recoil * 0.6;
      audio?.shot(state.current);
    },
    takeRound() {
      const slot = ammo[state.current];
      if (slot.mag <= 0) return false;
      slot.mag -= 1;
      return true;
    },
    reload() {
      const def = currentDef();
      const slot = ammo[state.current];
      if (state.reloadLeft > 0 || slot.mag === def.mag || slot.reserve === 0) return;
      state.reloadLeft = def.reload;
      audio?.reload();
    },
    spread(speed) {
      const def = currentDef();
      const moving = Math.min(1, speed / 5.2);
      let value = def.spreadStill + moving * def.spreadMove;
      if (state.zoomed) value *= def.zoom >= 1 ? 0.35 : 0.55;
      return value;
    },
    zoomFov() {
      const def = currentDef();
      if (!state.zoomed) return 74;
      return def.zoom >= 1 ? 42 : 55;
    },
    buy(id, money) {
      const def = WEAPONS[id];
      if (!def || owned.has(id) || money < def.price) return null;
      owned.add(id);
      ammo[id] = { mag: def.mag, reserve: def.reserve };
      audio?.buy();
      return def.price;
    },
    buyUtil(kind, money) {
      const def = UTIL_DEFS[kind];
      if (!def || state.utilCount[kind] >= def.max || money < def.price) return null;
      state.utilCount[kind] += 1;
      audio?.buy();
      return def.price;
    },
    buyArmor(money) {
      if (state.armor >= ARMOR_MAX || money < ARMOR_PRICE) return null;
      state.armor = ARMOR_MAX;
      audio?.buy();
      return ARMOR_PRICE;
    },
    absorb(amount) {
      if (state.armor <= 0) return amount;
      const soaked = Math.min(state.armor, Math.round(amount * ARMOR_SOAK));
      state.armor -= soaked;
      return amount - soaked;
    },
    throwUtil() {
      if (!state.utilMode || state.utilCount[state.util] <= 0 || state.cooldown > 0) return null;
      const kind = state.util;
      state.utilCount[kind] -= 1;
      state.cooldown = 0.5;
      state.utilMode = false;
      util.group.visible = false;
      select(state.current);
      return kind;
    },
    utilName() {
      return state.utilMode ? UTIL_DEFS[state.util].name : currentDef().name;
    },
    refill() {
      for (const id of owned) {
        ammo[id] = { mag: WEAPONS[id].mag, reserve: WEAPONS[id].reserve };
      }
      state.cooldown = 0;
      state.reloadLeft = 0;
      state.flash = 0;
      state.kick = 0;
      state.inspect = 0;
      select('pistol');
    },
    resetEconomy() {
      owned.clear();
      owned.add('pistol');
      state.utilCount = { frag: 0, flash: 0, smoke: 0 };
      state.armor = 0;
      this.refill();
    },
  };
}
