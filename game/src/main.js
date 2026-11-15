// SCRAPLINE rev-3 — boot, the fixed-step loop, and the round glue.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { createPlans } from './plans.js';
import { createHearing } from './hearing.js';
import { createUtility, FLASH_RADIUS } from './utility.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createWeapon, WEAPONS, WEAPON_ORDER } from './weapon.js';
import { createBots } from './bots.js';
import { createRounds } from './rounds.js';
import { createEffects } from './effects.js';
import { createAudio } from './audio.js';
import { createHud } from './hud.js';
import { createAmbient } from './ambient.js';
import { createInput } from './input.js';
import { buildSkin } from './skin.js';
import { dressYard } from './props.js';
import { buildGun, GUN_MUZZLE } from './guns.js';
import { dressBot } from './figures.js';
import { createLife } from './life.js';
import { createMarks } from './marks.js';
import { dressV2 } from './v2.js';
import { dressV3 } from './v3.js';

const STEP = 1 / 60; // fixed simulation step
const PLANT_TIME = 3.5; // seconds of holding E inside a site
const REGEN_WAIT = 6; // quiet seconds before health starts coming back
const REGEN_SPEED = 12; // health per second while regenerating
const FIRST_BLOOD = 100; // bonus money for the round's first kill
const STREAK_BONUS = [0, 0, 100, 200, 400]; // money for a 2/3/4+ kill streak
const ATTACK_CALLSIGNS = new Set(['DUST', 'RIVET', 'BOLT', 'FUSE']);

const query = new URLSearchParams(window.location.search);
const shotName = query.get('shot');
const shotSeed = Number.parseInt(query.get('seed') ?? '1', 10) || 1;

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(shotSeed);

const SETTINGS_STORE = 'scrapline-settings-v3';
const settings = { sensitivity: 1, volume: 0.35, crosshair: '#e9e2d2' };
try {
  const stored = JSON.parse(localStorage.getItem(SETTINGS_STORE) || '{}');
  if (typeof stored.sensitivity === 'number') settings.sensitivity = stored.sensitivity;
  if (typeof stored.volume === 'number') settings.volume = stored.volume;
  if (typeof stored.crosshair === 'string') settings.crosshair = stored.crosshair;
} catch {
}
function persistSettings() {
  try {
    localStorage.setItem(SETTINGS_STORE, JSON.stringify(settings));
  } catch {
  }
}

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.canvas);
scene.fog = new THREE.Fog(new THREE.Color(PALETTE.canvas), 26, 70);
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.05, 160);
scene.add(camera);

const audio = createAudio();
audio.setVolume(settings.volume);
const skin = buildSkin();
const world = createWorld(scene, { skin, dressYard });
const effects = createEffects(scene);
const life = createLife(scene);
const marks = createMarks(scene);
dressV2(scene);
dressV3(scene);
const hud = createHud(document);
const scoreboard = hud.scoreboard;
const minimap = hud.minimap;
const ambient = createAmbient(scene, world.anchors);
const player = createPlayer(world.colliders);
const weapon = createWeapon(camera, audio, { buildGun, muzzle: GUN_MUZZLE });
const input = createInput(renderer.domElement, onPointerLock);
const hearing = createHearing();
const raycaster = new THREE.Raycaster();
raycaster.far = 90;
const aimDir = new THREE.Vector3();
const muzzlePos = new THREE.Vector3();
const YOU = { name: 'YOU', team: 'attack' };

hud.applySettings(settings);
hud.onSettingsChange((s) => {
  settings.sensitivity = s.sensitivity;
  settings.volume = s.volume;
  settings.crosshair = s.crosshair;
  audio.setVolume(s.volume);
  persistSettings();
});

const match = {
  health: 100,
  playerAlive: true,
  kills: 0,
  streak: 0,
  clutchCalled: false,
  frozen: false,
  plantProgress: 0,
  plantSite: null,
  buyOpen: false,
  suppressPause: false,
  wasFiring: false,
  elapsed: 0,
  lastDamageAt: -99,
  lastHeartbeat: -99,
  spectateIndex: 0,
  tabWasHeld: false,
  flashUntil: -99,
  flashDuration: 1,
};
const body = player.state;

const spikeLight = new THREE.PointLight(new THREE.Color('#ff2e1f'), 0, 9, 1.8);
scene.add(spikeLight);
const spikeMesh = new THREE.Group();
{
  const casing = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.22, 0.34),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#14161a'), roughness: 0.5, metalness: 0.5 }),
  );
  casing.position.y = 0.11;
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 10, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2e1f') }),
  );
  beacon.position.y = 0.26;
  spikeMesh.add(casing, beacon);
  spikeMesh.visible = false;
  scene.add(spikeMesh);
}

function plantedPos() {
  return rounds.state.planted ? rounds.state.planted.pos : new THREE.Vector3();
}
function revealSpike() {
  const pos = rounds.state.planted.pos;
  spikeMesh.position.copy(pos);
  spikeMesh.visible = true;
  spikeLight.position.set(pos.x, 1.2, pos.z);
}
function concealSpike() {
  spikeMesh.visible = false;
  spikeLight.intensity = 0;
}

function onRadio(name, text) {
  const ember = !ATTACK_CALLSIGNS.has(name);
  hud.radio(name, text, ember);
  if (!ember) audio.radioBlip();
}
const plans = createPlans({ radio: onRadio });

const rounds = createRounds({
  onRoundStart(n) {
    respawnEveryone();
    const matchPoint = rounds.state.wins.attack === 4 || rounds.state.wins.defend === 4;
    hud.banner(
      matchPoint ? 'MATCH POINT' : `ROUND ${n}`,
      matchPoint ? 'One round decides the match' : n === 1 ? 'Plant the spike at A or B' : 'Buy up — press B',
      2200,
    );
    hud.closeBuy();
  },
  onLiveStart() {
    hud.banner('GO', 'Eliminate EMBER or plant the spike', 1200);
  },
  onRoundEnd(winner, reason) {
    const attackersWon = winner === 'attack';
    hud.banner(attackersWon ? 'VANGUARD WINS THE ROUND' : 'EMBER WINS THE ROUND', reason, 3200);
    if (attackersWon) audio.roundWin();
    else audio.roundLose();
    hud.setScore(rounds.state.wins.attack, rounds.state.wins.defend);
    scoreboard.recordRound(winner);
    hud.setRoundPips(scoreboard.rounds());
    concealSpike();
  },
  onMatchEnd(winner) {
    const mvp = scoreboard.mvp();
    const scoreLine = winner === 'attack'
      ? `VANGUARD ${rounds.state.wins.attack} — ${rounds.state.wins.defend} EMBER. The yard is yours.`
      : winner === 'defend'
        ? `EMBER ${rounds.state.wins.defend} — ${rounds.state.wins.attack} VANGUARD. The yard holds.`
        : `Draw ${rounds.state.wins.attack} — ${rounds.state.wins.defend}.`;
    const mvpLine = mvp ? ` MVP: ${mvp.name} — ${mvp.kills} kills, ${mvp.damage} damage.` : '';
    hud.setOverlayCopy(scoreLine + mvpLine);
    hud.showOverlay();
    hud.showScoreboard(scoreboard.table(), 'MATCH SUMMARY', mvp ? `MVP: ${mvp.name}` : '');
    if (document.pointerLockElement) document.exitPointerLock();
  },
  onPlant(site) {
    revealSpike();
    hud.banner('SPIKE PLANTED', `Defend site ${site} until it blows`, 3000);
    hud.feed(`Spike planted at ${site} (+$300)`, true);
    scoreboard.recordPlant('YOU');
    audio.plantStart();
    hearing.emit(plantedPos().x, plantedPos().z, 'plant');
    bots.hearShot(plantedPos(), 60);
  },
  onDetonate() {
    effects.explosion(plantedPos());
    audio.explosion();
    concealSpike();
  },
});

const bots = createBots(scene, world, effects, audio, {
  playerPos: () => player.state.position,
  playerAlive: () => match.playerAlive,
  playerCrouching: () => player.state.crouching,
  playerSpeed: () => player.groundSpeed(),
  spikePlanted: () => Boolean(rounds.state.planted),
  spikeSite: () => (rounds.state.planted ? rounds.state.planted.site : null),
  spikePos: plantedPos,
  hearing,
  smokeBlocks: (a, b) => utility.blocksSight(a, b),
  damagePlayer(amount, bot) {
    if (!match.playerAlive || match.frozen) return;
    match.health -= weapon.absorb(amount);
    match.lastDamageAt = match.elapsed;
    hud.damageFlash();
    hud.setHealth(match.health);
    hud.damageDirection(bot.pos, player.state.position, player.state.yaw);
    if (match.health <= 0) killPlayer(bot);
  },
  onBotShot(bot) {
    minimap.pingEnemy(bot.id, bot.pos.x, bot.pos.z, match.elapsed);
  },
  onBotDamage(attacker, amount) {
    scoreboard.recordDamage(attacker, amount);
  },
  throwBotUtil(bot, kind, target) {
    const from = new THREE.Vector3(bot.pos.x, 1.4, bot.pos.z);
    const to = target.clone();
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    const speed = Math.min(16, 9 + distance * 0.35);
    const dir = new THREE.Vector3(to.x - from.x, 0, to.z - from.z).normalize();
    utility.throwFrom(from, dir, speed, kind, true);
    hud.feed(`${bot.name} threw a ${kind === 'frag' ? 'frag' : kind}`, false);
  },
  radio: onRadio,
  dressBot,
  onBotDown(bot, attacker) {
    const killer = attacker && attacker.kind === 'player' ? YOU : attacker;
    const firstBlood = scoreboard.recordKill(killer, bot);
    hud.feed(`${killer ? killer.name : 'EMBER'} ▸ ${bot.name}`, killer === YOU);
    if (killer === YOU) {
      match.kills += 1;
      match.streak += 1;
      rounds.addKillReward();
      audio.kill();
      if (firstBlood) {
        rounds.state.money += FIRST_BLOOD;
        hud.banner('FIRST BLOOD', `+$${FIRST_BLOOD}`, 1600);
      } else if (match.streak >= 2) {
        const bonus = STREAK_BONUS[Math.min(match.streak, STREAK_BONUS.length - 1)];
        rounds.state.money += bonus;
        hud.banner(`KILL STREAK ×${match.streak}`, `+$${bonus}`, 1600);
      }
    }
  },
  onDefused(bot) {
    hud.banner('SPIKE DEFUSED', `${bot.name} cut the wires`, 3000);
    scoreboard.recordDefuse(bot.name);
    rounds.endRound('defend', 'Spike defused');
  },
});

const utility = createUtility(scene, world.colliders, effects, audio, {
  onBlast(pos, radius, damage) {
    for (const bot of bots.bots) {
      if (!bot.alive) continue;
      const d = bot.pos.distanceTo(pos);
      if (d < radius) {
        const dealt = Math.round(damage * (1 - d / radius) + 10);
        bots.damageBot(bot, dealt, { kind: 'player' }, rng);
        scoreboard.recordDamage(YOU, dealt);
      }
    }
    if (match.playerAlive) {
      const p = player.state.position;
      const d = Math.hypot(p.x - pos.x, p.z - pos.z);
      if (d < radius) {
        match.health -= weapon.absorb(Math.round(damage * (1 - d / radius) * 0.7 + 8));
        match.lastDamageAt = match.elapsed;
        hud.damageFlash();
        hud.setHealth(match.health);
        if (match.health <= 0) {
          match.health = 0;
          killPlayer(null);
        }
      }
    }
    hearing.emit(pos.x, pos.z, 'boom');
  },
  onFlash(pos) {
    bots.blindBots(pos, FLASH_RADIUS);
    const eye = new THREE.Vector3(body.position.x, body.position.y + body.eye, body.position.z);
    const dist = eye.distanceTo(pos);
    if (dist > FLASH_RADIUS) return;
    camera.getWorldDirection(aimDir);
    const to = new THREE.Vector3().subVectors(pos, eye).normalize();
    const facing = Math.max(0.25, aimDir.dot(to));
    const strength = (1 - dist / FLASH_RADIUS) * facing;
    if (strength < 0.15) return;
    match.flashDuration = 1.1 + strength * 1.4;
    match.flashUntil = match.elapsed + match.flashDuration;
    if (strength > 0.3) audio.flashRing();
  },
  onSmoke() {
    audio.smokeHiss();
  },
});

function killPlayer(killerBot) {
  match.health = 0;
  match.playerAlive = false;
  match.streak = 0;
  scoreboard.recordKill(killerBot, YOU);
  match.spectateIndex = 0;
  hud.hint('You are down — click to cycle your squad.', 6000);
  hud.spectate(spectateMate()?.name || '—');
  hud.banner('YOU ARE DOWN', 'Spectating — click to cycle teammates', 2200);
}

function spectateMate() {
  const mates = bots.bots.filter((b) => b.alive && b.team === 'attack');
  if (!mates.length) return null;
  return mates[match.spectateIndex % mates.length];
}

function respawnEveryone() {
  const spawns = world.spawns.attack;
  const spawn = spawns[Math.floor(rng() * spawns.length)];
  player.teleport(spawn.x, spawn.z, 0);
  match.health = 100;
  match.playerAlive = true;
  match.streak = 0;
  match.clutchCalled = false;
  match.plantProgress = 0;
  match.plantSite = null;
  match.lastDamageAt = -99;
  match.spectateIndex = 0;
  match.flashUntil = -99;
  weapon.refill();
  utility.reset();
  marks.reset();
  const attackPlan = plans.pickAttack(rounds.state.round, rounds.state.lastSite, rng);
  const defendPlan = plans.pickDefend(rounds.state.round, rounds.state.lastSite, rng);
  bots.setPlan({ slots: [...attackPlan.slots, ...defendPlan.slots] }, rng);
  hud.setPlan(`PLAN: ${attackPlan.name} — ${attackPlan.line}`);
  bots.spawnRound(rng, rounds.state.round);
  scoreboard.resetRound();
  hud.setHealth(100);
  hud.setArmor(weapon.state.armor);
  hud.setScore(rounds.state.wins.attack, rounds.state.wins.defend);
  hud.setMoney(rounds.state.money);
  hud.clearHint();
  hud.plantBar(false);
  hud.spectate(null);
  hud.flash(0);
}

function restartMatch() {
  weapon.resetEconomy();
  scoreboard.resetMatch();
  scoreboard.register('YOU', 'attack');
  for (const bot of bots.bots) scoreboard.register(bot.name, bot.team);
  hud.setRoundPips([]);
  rounds.startMatch();
  hud.setScore(0, 0);
}

function onPointerLock(locked) {
  if (shotName) return;
  if (locked) {
    audio.unlock();
    hud.hideOverlay();
    if (match.buyOpen) closeBuy();
  } else if (!match.suppressPause && rounds.state.phase !== 'match') {
    hud.setOverlayCopy('Paused — click to resume. Your squad holds the yard.');
    hud.showOverlay();
    if (match.buyOpen) closeBuy();
  }
}

hud.onPlay(() => {
  if (shotName) return;
  if (rounds.state.phase === 'match') restartMatch();
  audio.unlock();
  input.requestLock();
});

const buyState = { money: 800, owned: weapon.owned, util: weapon.state.utilCount, armor: 0, round: 1 };
function buyPurchase(purchase) {
  if (rounds.state.phase !== 'buy') return false;
  let cost = null;
  if (purchase.kind === 'weapon') cost = weapon.buy(WEAPON_ORDER[purchase.index], rounds.state.money);
  else if (purchase.kind === 'util') cost = weapon.buyUtil(purchase.key, rounds.state.money);
  else if (purchase.kind === 'armor') cost = weapon.buyArmor(rounds.state.money);
  if (cost == null) return false;
  rounds.spend(cost);
  audio.buy();
  if (purchase.kind === 'weapon') weapon.select(WEAPON_ORDER[purchase.index]);
  buyState.money = rounds.state.money;
  buyState.util = weapon.state.utilCount;
  buyState.armor = weapon.state.armor;
  buyState.round = rounds.state.round;
  hud.setMoney(rounds.state.money);
  syncAmmoHud();
  return true;
}

function openBuy() {
  if (rounds.state.phase !== 'buy' || match.buyOpen) return;
  match.buyOpen = true;
  match.suppressPause = true;
  buyState.money = rounds.state.money;
  buyState.util = weapon.state.utilCount;
  buyState.armor = weapon.state.armor;
  buyState.round = rounds.state.round;
  hud.openBuy(buyState, buyPurchase);
  if (document.pointerLockElement) document.exitPointerLock();
}

function closeBuy() {
  if (!match.buyOpen) return;
  match.buyOpen = false;
  match.suppressPause = false;
  hud.closeBuy();
  if (!shotName) input.requestLock();
}

function syncAmmoHud() {
  const def = weapon.currentDef();
  const slot = weapon.ammo[weapon.state.current];
  hud.setAmmo(slot.mag, slot.reserve, weapon.utilName());
  hud.setUtility(weapon.state.utilCount, weapon.state.utilMode ? weapon.state.util : null);
  hud.setArmor(weapon.state.armor);
}

function syncCamera() {
  if (!match.playerAlive) {
    const mate = spectateMate();
    if (mate) {
      camera.position.set(mate.pos.x, 1.6, mate.pos.z);
      camera.rotation.set(0, mate.yaw, 0, 'YXZ');
      return;
    }
  }
  const drop = match.playerAlive ? 0 : 1.1;
  const bob = player.bobOffset();
  camera.position.set(body.position.x, body.position.y + body.eye - drop + bob.y, body.position.z);
  camera.rotation.set(body.pitch + (match.playerAlive ? 0 : 0.35), body.yaw, match.playerAlive ? bob.x * 0.4 : 0.25, 'YXZ');
  const wantedFov = weapon.zoomFov();
  if (Math.abs(camera.fov - wantedFov) > 0.2) {
    camera.fov += (wantedFov - camera.fov) * 0.25;
    camera.updateProjectionMatrix();
  }
}

function aimAt(point) {
  const dx = point.x - body.position.x;
  const dy = point.y - (body.position.y + body.eye);
  const dz = point.z - body.position.z;
  const length = Math.hypot(dx, dy, dz) || 1;
  body.yaw = Math.atan2(-dx, -dz);
  body.pitch = Math.asin(Math.max(-1, Math.min(1, dy / length)));
  syncCamera();
}

function muzzleWorld() {
  camera.getWorldPosition(muzzlePos);
  camera.getWorldDirection(aimDir);
  muzzlePos.addScaledVector(aimDir, 0.55);
  muzzlePos.y -= 0.12;
  return muzzlePos;
}

function shootableTargets() {
  return world.shootables.concat(bots.hitMeshes);
}

function shoot() {
  const def = weapon.currentDef();
  if (!weapon.takeRound()) {
    audio.dry();
    return;
  }
  const flashed = match.elapsed < match.flashUntil
    ? (match.flashUntil - match.elapsed) / match.flashDuration : 0;
  const spread = weapon.spread(player.groundSpeed()) * (1 + flashed * 1.5)
    * (input.state.aiming && !weapon.state.zoomed ? 0.7 : 1);
  const pellets = def.pellets || 1;
  let killed = false;
  let hitAny = false;
  for (let p = 0; p < pellets; p += 1) {
    camera.getWorldDirection(aimDir);
    aimDir.x += (rng() * 2 - 1) * spread;
    aimDir.y += (rng() * 2 - 1) * spread;
    aimDir.z += (rng() * 2 - 1) * spread;
    aimDir.normalize();
    scene.updateMatrixWorld(true);
    raycaster.set(camera.position, aimDir);
    const from = muzzleWorld().clone();
    const hit = raycaster.intersectObjects(shootableTargets(), false)[0];
    const end = hit ? hit.point : camera.position.clone().addScaledVector(aimDir, 60);
    effects.tracer(from, end);
    if (hit) {
      const bot = hit.object.userData.bot;
      if (bot && bot.alive) {
        const headshot = hit.object.userData.part === 'head';
        const dmg = Math.round(def.damage * (headshot ? def.headMult : 1));
        bots.damageBot(bot, dmg, { kind: 'player' }, rng);
        scoreboard.recordDamage(YOU, dmg);
        hitAny = true;
        if (bot.health <= 0) killed = true;
        hud.damageNumber(camera, hit.point, dmg, headshot);
        if (bot.health > 0) audio.hit();
        effects.burst(hit.point, 0xff5a3c, 2.4);
      } else {
        effects.burst(hit.point, 0xffd9a0, 1.6);
        if (hit.face) {
          marks.add(hit.point, new THREE.Vector3().copy(hit.face.normal).transformDirection(hit.object.matrixWorld));
        }
      }
    }
  }
  if (hitAny) hud.hitmarker(killed);
  weapon.pullTrigger();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  effects.eject(muzzleWorld().clone(), right);
  if (def.id === 'shotgun' || def.id === 'dmr') {
    effects.puff(muzzleWorld().clone(), 0.5, 0.6);
  } else if (def.id === 'rifle' || def.id === 'smg') {
    effects.puff(muzzleWorld().clone(), 0.3, 0.4);
  } else {
    effects.puff(muzzleWorld().clone(), 0.22, 0.35);
  }
  player.recoil(def.recoil * (0.9 + rng() * 0.25), (rng() * 2 - 1) * def.recoil * 0.3);
  hearing.emit(body.position.x, body.position.z, 'shot');
  syncAmmoHud();
}

function throwUtil() {
  const kind = weapon.state.util;
  if (!weapon.throwUtil()) return;
  camera.getWorldDirection(aimDir);
  utility.throwFrom(
    new THREE.Vector3(body.position.x, body.position.y + body.eye - 0.1, body.position.z),
    aimDir.clone(),
    13,
    kind,
    false,
  );
  syncAmmoHud();
}

function siteUnderPlayer() {
  for (const site of ['A', 'B']) {
    const center = world.sites[site].center;
    const d = Math.hypot(body.position.x - center.x, body.position.z - center.z);
    if (d < world.sites[site].radius) return site;
  }
  return null;
}

function paintMinimap() {
  minimap.draw({
    player: { x: body.position.x, z: body.position.z, yaw: body.yaw },
    mates: bots.bots.filter((b) => b.alive && b.team === 'attack').map((b) => ({ x: b.pos.x, z: b.pos.z })),
    spike: rounds.state.planted ? { x: rounds.state.planted.pos.x, z: rounds.state.planted.pos.z } : null,
  }, match.elapsed);
}

function step(dt) {
  match.elapsed += dt;
  const pressed = input.takePressed();
  const phase = rounds.state.phase;

  if (pressed.has('KeyB')) {
    if (match.buyOpen) closeBuy();
    else openBuy();
  }
  if (pressed.has('KeyF')) weapon.inspect();
  const tabHeld = input.state.keys.has('Tab');
  if (tabHeld && !match.tabWasHeld && rounds.state.phase !== 'match') {
    hud.showScoreboard(scoreboard.table(), `ROUND ${rounds.state.round} — SCOREBOARD`);
  } else if (!tabHeld && match.tabWasHeld && rounds.state.phase !== 'match') {
    hud.hideScoreboard();
  }
  match.tabWasHeld = tabHeld;

  if (match.buyOpen) {
    for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
      if (pressed.has(`Digit${i + 1}`) && buyPurchase({ kind: 'weapon', index: i })) {
        hud.openBuy(buyState, buyPurchase);
      }
    }
    for (const [i, key] of ['frag', 'flash', 'smoke'].entries()) {
      if (pressed.has(`Digit${i + 6}`) && buyPurchase({ kind: 'util', key })) {
        hud.openBuy(buyState, buyPurchase);
      }
    }
    if (pressed.has('Digit9') && buyPurchase({ kind: 'armor' })) {
      hud.openBuy(buyState, buyPurchase);
    }
  } else {
    for (const id of WEAPON_ORDER) {
      if (pressed.has(`Digit${WEAPONS[id].slot}`)) {
        if (weapon.select(id)) syncAmmoHud();
      }
    }
    for (const [i, key] of ['frag', 'flash', 'smoke'].entries()) {
      if (pressed.has(`Digit${i + 6}`)) {
        if (weapon.selectUtil(key)) syncAmmoHud();
      }
    }
    if (pressed.has('KeyG')) {
      if (!weapon.state.utilMode) weapon.select('util');
      else weapon.cycleUtil();
      syncAmmoHud();
    }
  }

  rounds.step(dt);
  if (phase === 'buy') {
    player.step(dt, input.state.keys);
    weapon.step(dt, input.state.aiming, player.groundSpeed());
    effects.step(dt);
  } else if (phase === 'live') {
    player.step(dt, input.state.keys);
    weapon.step(dt, input.state.aiming, player.groundSpeed());
    bots.step(dt, match.elapsed, rng);
    utility.step(dt, match.elapsed);
    effects.step(dt);

    if (match.playerAlive && match.health > 0 && match.health < 100 && match.elapsed - match.lastDamageAt > REGEN_WAIT) {
      match.health = Math.min(100, match.health + REGEN_SPEED * dt);
      hud.setHealth(match.health);
    }
    if (match.playerAlive && match.health > 0 && match.health <= 30 && match.elapsed - match.lastHeartbeat > 0.85) {
      match.lastHeartbeat = match.elapsed;
      audio.heartbeat();
    }
    const liveFrag = utility.nearestLive(body.position.x, body.position.z);

    const def = weapon.currentDef();
    const rawFiring = input.state.firing && input.state.locked;
    const freshClick = rawFiring && !match.wasFiring;
    if (!match.playerAlive && freshClick) {
      match.spectateIndex += 1;
      const mate = spectateMate();
      if (mate) hud.spectate(mate.name);
    }
    const firing = rawFiring && match.playerAlive;
    if (weapon.state.utilMode) {
      if (freshClick) throwUtil();
    } else if (firing && weapon.ready() && (def.auto || freshClick)) {
      shoot();
    }
    match.wasFiring = rawFiring;
    if (pressed.has('KeyR')) {
      weapon.reload();
      hearing.emit(body.position.x, body.position.z, 'reload');
    }

    if (player.state.stepped > 2.2) {
      player.state.stepped = 0;
      if (player.groundSpeed() > 1) {
        audio.footstep();
        const quiet = body.crouching || input.state.keys.has('ShiftLeft') || input.state.keys.has('ShiftRight');
        if (!quiet) hearing.emit(body.position.x, body.position.z, 'step');
      }
    }

    const site = siteUnderPlayer();
    if (match.playerAlive && site && !rounds.state.planted && input.state.keys.has('KeyE')) {
      match.plantSite = site;
      match.plantProgress += dt / PLANT_TIME;
      hud.plantBar(true, `PLANTING SPIKE — SITE ${site}`, match.plantProgress);
      if (Math.floor(match.elapsed * 2) !== Math.floor((match.elapsed - dt) * 2)) audio.plantBeep();
      if (match.plantProgress >= 1) {
        const center = world.sites[site].center;
        rounds.plant(site, new THREE.Vector3(center.x, 0, center.z));
        match.plantProgress = 0;
        hud.plantBar(false);
      }
    } else {
      if (match.plantProgress > 0) {
        match.plantProgress = Math.max(0, match.plantProgress - dt / 1.5);
        hud.plantBar(match.plantProgress > 0, 'PLANTING SPIKE', match.plantProgress);
      }
      if (liveFrag && liveFrag.dist < 8) hud.hint('⚠ Frag nearby — move!');
      else if (site && match.playerAlive && !rounds.state.planted) hud.hint('Hold E to plant the spike');
      else if (rounds.state.planted) hud.hint(`Spike live — defend site ${rounds.state.planted.site}`);
      else if (match.playerAlive && weapon.ammo[weapon.state.current].mag === 0
        && weapon.ammo[weapon.state.current].reserve === 0 && weapon.owned.size > 1) hud.hint('Out of ammo — switch weapon (1–5)');
      else hud.clearHint();
    }

    const defuse = bots.defuseProgress();
    if (defuse > 0) {
      hud.plantBar(true, 'EMBER IS DEFUSING THE SPIKE', defuse);
    } else if (match.plantProgress <= 0) {
      hud.plantBar(false);
    }

    const counts = bots.aliveCounts();
    const attackAlive = counts.attack + (match.playerAlive ? 1 : 0);
    if (match.playerAlive && attackAlive === 1 && counts.defend >= 2 && !match.clutchCalled) {
      match.clutchCalled = true;
      hud.banner('CLUTCH', `1 vs ${counts.defend} — the yard is watching`, 2400);
      audio.roundStart();
    }

    if (counts.defend === 0) {
      rounds.endRound('attack', rounds.state.planted ? 'Site cleared' : 'EMBER eliminated');
    } else if (attackAlive === 0 && !rounds.state.planted) {
      rounds.endRound('defend', 'VANGUARD eliminated');
    }

    if (rounds.state.planted) {
      spikeLight.intensity = 6 + Math.sin(match.elapsed * 9) * 5;
    }
  } else {
    effects.step(dt);
    utility.step(dt, match.elapsed);
    weapon.step(dt, false, 0);
  }

  ambient.step(dt);
  life.step(dt);
  hud.step(dt);
  paintMinimap();

  if (match.elapsed < match.flashUntil) {
    hud.flash((match.flashUntil - match.elapsed) / match.flashDuration);
  } else {
    hud.flash(0);
  }

  hud.setHealth(match.health);
  hud.setMoney(rounds.state.money);
  hud.setTimer(rounds.timerText(), Boolean(rounds.state.planted));
  hud.setScore(rounds.state.wins.attack, rounds.state.wins.defend);
  const alive = bots.aliveCounts();
  hud.setAlive(alive.attack + (match.playerAlive ? 1 : 0), alive.defend);
  const spreadPx = 4 + weapon.spread(player.groundSpeed()) * 900;
  hud.crosshairGap(spreadPx);
  syncAmmoHud();
}

let accumulator = 0;
let lastTime = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (!match.frozen) {
    const look = input.takeLook();
    if (match.playerAlive) player.look(look.x, look.y, 0.0022 * settings.sensitivity);
    accumulator += dt;
    let steps = 0;
    while (accumulator >= STEP && steps < 5) {
      step(STEP);
      accumulator -= STEP;
      steps += 1;
    }
    if (accumulator > STEP * 5) accumulator = 0;
    syncCamera();
  }
  renderer.render(scene, camera);
}

function settle(steps) {
  for (let i = 0; i < steps; i += 1) step(STEP);
}

function paintTwiceThenReady() {
  let painted = 0;
  function paint() {
    requestAnimationFrame(paint);
    syncCamera();
    renderer.render(scene, camera);
    painted += 1;
    if (painted === 2) {
      window.__shotReady = true;
      match.frozen = true;
    }
  }
  requestAnimationFrame(paint);
}

function runShot(name) {
  hud.hideOverlay();
  rounds.startMatch();
  if (name === 'start') {
    player.teleport(0, 12, 0);
    settle(10);
    aimAt(new THREE.Vector3(0, 1.6, -4));
    hud.showOverlay();
  } else if (name === 'play') {
    const placeBot = (bot, x, z, yaw) => {
      bot.pos.set(x, 0, z);
      bot.group.position.copy(bot.pos);
      bot.yaw = yaw;
      bot.group.rotation.set(0, yaw, 0);
    };
    player.teleport(0, 10, 0);
    settle(10);
    const enemy = bots.bots.find((b) => b.team === 'defend');
    placeBot(enemy, 0, 4, Math.PI);
    const flank = bots.bots.filter((b) => b.team === 'defend')[1];
    if (flank) placeBot(flank, -4, 3, Math.PI * 0.15);
    const mate = bots.bots.find((b) => b.team === 'attack');
    placeBot(mate, 4.5, 3, Math.PI * 0.75);
    rounds.state.phase = 'live';
    rounds.state.phaseTime = 87;
    weapon.owned.add('rifle');
    weapon.select('rifle');
    weapon.state.utilCount = { frag: 1, flash: 1, smoke: 1 };
    weapon.state.armor = 50;
    syncAmmoHud();
    settle(20);
    for (let shot = 0; shot < 3; shot += 1) {
      aimAt(new THREE.Vector3(enemy.pos.x, 1.15, enemy.pos.z));
      shoot();
      settle(8);
    }
    settle(10);
    weapon.state.flash = 0.12;
    settle(1);
  } else if (name === 'buy') {
    player.teleport(0, 12, 0);
    settle(10);
    aimAt(new THREE.Vector3(0, 1.6, -4));
    rounds.state.money = 4700;
    hud.setMoney(4700);
    buyState.money = 4700;
    buyState.round = rounds.state.round;
    hud.openBuy(buyState, buyPurchase);
  } else if (name === 'end') {
    rounds.state.wins.attack = 4;
    rounds.state.wins.defend = 2;
    rounds.state.phase = 'over';
    rounds.state.lastReason = 'Spike detonated';
    player.teleport(-10.5, -5.5, 0);
    settle(10);
    const enemy = bots.bots.find((b) => b.team === 'defend');
    enemy.pos.set(-15, 0, -10);
    enemy.group.position.copy(enemy.pos);
    enemy.alive = false;
    enemy.fall = 1;
    enemy.group.rotation.x = -1.45;
    enemy.group.position.y = -0.12;
    aimAt(new THREE.Vector3(-15, 1.2, -11));
    hud.banner('VANGUARD WINS THE ROUND', 'Spike detonated', 60000);
    hud.setScore(4, 2);
  }
  hud.setAmmo(weapon.ammo[weapon.state.current].mag, weapon.ammo[weapon.state.current].reserve,
    weapon.utilName());
  hud.setHealth(match.health);
  hud.setScore(rounds.state.wins.attack, rounds.state.wins.defend);
  hud.setTimer(rounds.timerText(), Boolean(rounds.state.planted));
  match.frozen = true;
  paintTwiceThenReady();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.__game = {
  game: match, rounds, bots, weapon, player,
  state() {
    return {
      phase: rounds.state.phase,
      round: rounds.state.round,
      wins: rounds.state.wins,
      money: rounds.state.money,
      health: match.health,
      playerAlive: match.playerAlive,
      kills: match.kills,
      alive: bots.aliveCounts(),
      planted: Boolean(rounds.state.planted),
      plan: plans.attack.name,
      mvp: scoreboard.mvp(),
    };
  },
};

bots.createAll(rng);
scoreboard.register('YOU', 'attack');
for (const bot of bots.bots) scoreboard.register(bot.name, bot.team);
rounds.startMatch();
syncCamera();
if (shotName) runShot(shotName);
else requestAnimationFrame(frame);
