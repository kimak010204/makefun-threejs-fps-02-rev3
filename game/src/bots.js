// Nine bots, 5v5: four VANGUARD attackers with the player, five EMBER
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { WAYPOINTS, nearestNode, route, SITE_NODES, SPAWN_NODES, MID_NODES, LONG_NODES } from './waypoints.js';
import { ROLES } from './plans.js';

const BOT_RADIUS = 0.34;
const BOT_HEIGHT = 1.72;
const PATROL_SPEED = 3.7;
const PUSH_SPEED = 4.7;
const SEE_DISTANCE = 42;
const DEFUSE_TIME = 5;
const FLINCH_WINDOW = 1.5;
const FLINCH_SPREAD = 1.6;

const CALLSIGNS = {
  attack: ['DUST', 'RIVET', 'BOLT', 'FUSE'],
  defend: ['ASH', 'COAL', 'SLAG', 'CINDER', 'SOOT'],
};

function buildBotMesh(team) {
  const group = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({
    color: new THREE.Color(team === 'attack' ? '#3a4a5e' : '#5e3a2a'), roughness: 0.75, metalness: 0.1,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: new THREE.Color(team === 'attack' ? PALETTE.vanguard : PALETTE.ember),
    roughness: 0.4, metalness: 0.2, emissive: new THREE.Color(team === 'attack' ? PALETTE.vanguard : PALETTE.ember),
    emissiveIntensity: 0.35,
  });
  const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color('#14161a'), roughness: 0.6, metalness: 0.3 });
  const pack = new THREE.MeshStandardMaterial({ color: new THREE.Color('#23262e'), roughness: 0.85, metalness: 0.1 });
  const add = (geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  add(new THREE.BoxGeometry(0.17, 0.1, 0.3), dark, -0.12, 0.05, 0.03);
  add(new THREE.BoxGeometry(0.17, 0.1, 0.3), dark, 0.12, 0.05, 0.03);
  add(new THREE.BoxGeometry(0.16, 0.68, 0.16), dark, -0.12, 0.44, 0);
  add(new THREE.BoxGeometry(0.16, 0.68, 0.16), dark, 0.12, 0.44, 0);
  add(new THREE.BoxGeometry(0.18, 0.12, 0.06), glow, -0.12, 0.55, 0.1);
  add(new THREE.BoxGeometry(0.18, 0.12, 0.06), glow, 0.12, 0.55, 0.1);
  const torso = add(new THREE.BoxGeometry(0.54, 0.72, 0.3), suit, 0, 1.12, 0);
  torso.userData.part = 'torso';
  add(new THREE.BoxGeometry(0.4, 0.4, 0.05), pack, 0, 1.14, 0.17);
  add(new THREE.BoxGeometry(0.56, 0.1, 0.32), glow, 0, 1.42, 0);
  add(new THREE.BoxGeometry(0.16, 0.1, 0.34), suit, -0.32, 1.42, 0);
  add(new THREE.BoxGeometry(0.16, 0.1, 0.34), suit, 0.32, 1.42, 0);
  add(new THREE.BoxGeometry(0.4, 0.5, 0.16), pack, 0, 1.16, -0.22);
  add(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 8), suit, 0, 1.48, -0.24).rotation.z = Math.PI / 2;
  const head = add(new THREE.SphereGeometry(0.16, 14, 10), suit, 0, 1.62, 0);
  head.userData.part = 'head';
  add(new THREE.BoxGeometry(0.3, 0.07, 0.05), glow, 0, 1.64, 0.14);
  add(new THREE.BoxGeometry(0.2, 0.05, 0.05), dark, 0, 1.52, 0.13);
  const gun = add(new THREE.BoxGeometry(0.07, 0.09, 0.62), dark, 0.2, 1.18, -0.28);
  gun.rotation.x = 0.06;
  add(new THREE.BoxGeometry(0.34, 0.06, 0.06), glow, 0, 1.52, 0);
  return { group, torso, head, suitMat: suit, glowMat: glow };
}

export function createBots(scene, world, effects, audio, hooks) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = 60;
  const bots = [];
  const hitMeshes = [];
  let now = 0;
  let round = 1;

  if (hooks.hearing) {
    hooks.hearing.listen((x, z, radius, kind) => hearSound(x, z, radius, kind));
  }

  function clearShot(from, to) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    if (dist < 0.01) return true;
    dir.normalize();
    raycaster.set(from, dir);
    raycaster.far = dist;
    const hit = raycaster.intersectObjects(world.shootables, false)[0];
    return !hit || hit.distance > dist - 0.3;
  }

  function makeBot(team, index, random) {
    const { group, torso, head, suitMat, glowMat } = buildBotMesh(team);
    hooks.dressBot?.(group, team);
    scene.add(group);
    const bot = {
      id: `${team}-${index}`,
      name: CALLSIGNS[team][index],
      team, group, torso, head, suitMat, glowMat,
      pos: new THREE.Vector3(),
      yaw: 0, health: 100, alive: true, fall: 0,
      state: 'patrol', role: team === 'attack' ? 'support' : 'anchor',
      lane: team === 'attack' ? ['A', 'B', 'mid'][index % 3] : (index < 2 ? 'A' : 'B'),
      route: [], routeIndex: 0, holdUntil: 0, holdSince: 0,
      crouching: false, target: null,
      lastSeen: new THREE.Vector3(), lastSeenAt: -99,
      hearPos: null, reaction: 0, burstLeft: 0, shotTimer: 0,
      strafeDir: 1, strafeUntil: 0,
      skill: 0.6 + random() * 0.2, reactionBase: 0.5 + random() * 0.5,
      defuseProgress: 0, defuseRoute: null, defuseRouteIndex: 0, defuseTarget: null,
      flash: 0, stepPhase: random() * 6, prevX: 0, prevZ: 0, stepAcc: 0,
      util: { frag: 1, flash: 1, smoke: 1 }, utilAt: -99,
      calloutAt: -99, spottedPlayer: false, lastHurtAt: -99, flanking: false,
      blindUntil: -99, goAt: 0, planUtil: null, smokedSite: false, flashedSite: false,
    };
    torso.userData.bot = bot;
    head.userData.bot = bot;
    hitMeshes.push(torso, head);
    bots.push(bot);
    return bot;
  }

  function setPlan(plan, random) {
    for (let i = 0; i < bots.length; i += 1) {
      const bot = bots[i];
      const slot = plan.slots[i] || plan.slots[0];
      bot.lane = slot.lane;
      bot.role = slot.role;
      bot.goAt = now + (slot.delay || 0);
      bot.planUtil = slot.util || null;
      bot.smokedSite = false;
      bot.flashedSite = false;
      const role = ROLES[bot.role] || ROLES.support;
      bot.skill = role.skill + random() * 0.08;
      bot.holdTime = role.hold;
    }
  }

  function spawnRound(random, roundNumber) {
    round = roundNumber || 1;
    for (const bot of bots) {
      const nodes = SPAWN_NODES[bot.team];
      const teamIndex = bots.filter((b) => b.team === bot.team).indexOf(bot);
      const node = WAYPOINTS[nodes[teamIndex % nodes.length]];
      bot.pos.copy(node);
      bot.pos.y = 0;
      bot.yaw = bot.team === 'attack' ? Math.PI : 0;
      bot.health = 100;
      bot.alive = true;
      bot.fall = 0;
      bot.state = 'patrol';
      bot.route = [];
      bot.routeIndex = 0;
      bot.holdUntil = 0;
      bot.holdSince = 0;
      bot.crouching = false;
      bot.target = null;
      bot.hearPos = null;
      bot.defuseProgress = 0;
      bot.defuseRoute = null;
      bot.defuseRouteIndex = 0;
      bot.defuseTarget = null;
      bot.flash = 0;
      bot.prevX = bot.pos.x;
      bot.prevZ = bot.pos.z;
      bot.stepAcc = 0;
      bot.util = { frag: 1, flash: 1, smoke: 1 };
      bot.utilAt = -99;
      bot.calloutAt = -99;
      bot.spottedPlayer = false;
      bot.lastHurtAt = -99;
      bot.flanking = false;
      bot.blindUntil = -99;
      bot.group.visible = true;
      bot.group.rotation.set(0, bot.yaw, 0);
      bot.group.position.copy(bot.pos);
      bot.torso.material.emissive?.setHex(0x000000);
      chooseDestination(bot, random);
    }
  }

  function chooseDestination(bot, random) {
    let dest;
    if (hooks.spikePlanted()) {
      const site = hooks.spikeSite();
      const nodes = SITE_NODES[site];
      dest = nodes[Math.floor(random() * nodes.length)];
    } else if (bot.team === 'defend') {
      if (bot.role === 'sniper') {
        const longs = LONG_NODES[bot.lane] || LONG_NODES.A;
        dest = longs[Math.floor(random() * longs.length)];
      } else if (bot.role === 'roam') {
        dest = MID_NODES[Math.floor(random() * MID_NODES.length)];
      } else {
        const nodes = SITE_NODES[bot.lane];
        dest = nodes[Math.floor(random() * nodes.length)];
      }
    } else if (bot.lane === 'mid') {
      dest = MID_NODES[Math.floor(random() * MID_NODES.length)];
    } else {
      const nodes = SITE_NODES[bot.lane];
      dest = nodes[Math.floor(random() * nodes.length)];
    }
    bot.route = route(nearestNode(bot.pos.x, bot.pos.z), dest).map((i) => WAYPOINTS[i]);
    bot.routeIndex = 0;
    bot.state = 'patrol';
    bot.holdSince = now;
    bot.flanking = false;
  }

  function attackersOnSite(site) {
    const center = site === 'A' ? { x: -15, z: -11 } : { x: 15, z: -11 };
    let count = 0;
    if (hooks.playerAlive()) {
      const p = hooks.playerPos();
      if (Math.hypot(p.x - center.x, p.z - center.z) < 9) count += 1;
    }
    for (const other of bots) {
      if (!other.alive || other.team !== 'attack') continue;
      if (Math.hypot(other.pos.x - center.x, other.pos.z - center.z) < 9) count += 1;
    }
    return count;
  }

  function considerFlank(bot, random) {
    if (bot.team !== 'defend' || bot.state !== 'patrol' || bot.flanking) return;
    if (hooks.spikePlanted()) return;
    const pushedSite = attackersOnSite('A') >= 2 ? 'A' : attackersOnSite('B') >= 2 ? 'B' : null;
    if (!pushedSite) return;
    const defenders = bots.filter((b) => b.alive && b.team === 'defend');
    const center = pushedSite === 'A' ? { x: -15, z: -11 } : { x: 15, z: -11 };
    const furthest = defenders.sort((a, b) =>
      Math.hypot(center.x - b.pos.x, center.z - b.pos.z) - Math.hypot(center.x - a.pos.x, center.z - a.pos.z))[0];
    if (furthest !== bot) return;
    const mid = MID_NODES[Math.floor(random() * MID_NODES.length)];
    const siteNodes = SITE_NODES[pushedSite];
    const end = siteNodes[Math.floor(random() * siteNodes.length)];
    const legOne = route(nearestNode(bot.pos.x, bot.pos.z), mid).map((i) => WAYPOINTS[i]);
    const legTwo = route(mid, end).map((i) => WAYPOINTS[i]);
    bot.route = legOne.concat(legTwo);
    bot.routeIndex = 0;
    bot.state = 'patrol';
    bot.flanking = true;
    bot.holdSince = now;
    hooks.radio?.(bot.name, `Flanking ${pushedSite} through mid`);
  }

  const probe = new THREE.Box3();
  function isBlocked(x, z) {
    probe.min.set(x - BOT_RADIUS, 0.04, z - BOT_RADIUS);
    probe.max.set(x + BOT_RADIUS, BOT_HEIGHT - 0.04, z + BOT_RADIUS);
    for (const collider of world.colliders) if (probe.intersectsBox(collider)) return true;
    return false;
  }

  function walkToward(bot, target, dt, speed) {
    const dx = target.x - bot.pos.x;
    const dz = target.z - bot.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) return true;
    const stepLen = Math.min(dist, speed * dt);
    const nx = bot.pos.x + (dx / dist) * stepLen;
    const nz = bot.pos.z + (dz / dist) * stepLen;
    if (!isBlocked(nx, bot.pos.z)) bot.pos.x = nx;
    if (!isBlocked(bot.pos.x, nz)) bot.pos.z = nz;
    bot.yaw = Math.atan2(dx, dz) + Math.PI;
    return dist < 0.7;
  }

  function eyeOf(bot) {
    return new THREE.Vector3(bot.pos.x, bot.crouching ? 1.05 : 1.5, bot.pos.z);
  }

  function playerAimPoint() {
    const p = hooks.playerPos();
    return new THREE.Vector3(p.x, p.y + 1.15, p.z);
  }

  function botAimPoint(other) {
    return new THREE.Vector3(other.pos.x, other.crouching ? 0.85 : 1.15, other.pos.z);
  }

  function seesPoint(bot, point, rangeScale = 1) {
    const eye = eyeOf(bot);
    const to = new THREE.Vector3().subVectors(point, eye);
    const dist = to.length();
    if (dist > SEE_DISTANCE * rangeScale) return false;
    if (dist > 6) {
      to.normalize();
      const facing = new THREE.Vector3(Math.sin(bot.yaw + Math.PI), 0, Math.cos(bot.yaw + Math.PI));
      if (facing.dot(to) < 0.15) return false;
    }
    if (!clearShot(eye, point)) return false;
    if (hooks.smokeBlocks && hooks.smokeBlocks(eye, point)) return false;
    return true;
  }

  function pickTarget(bot) {
    if (now < bot.blindUntil) return null;
    let best = null;
    let bestDist = Infinity;
    if (bot.team === 'defend' && hooks.playerAlive()) {
      const point = playerAimPoint();
      const scale = hooks.playerCrouching() && hooks.playerSpeed() < 0.5 ? 0.55 : 1;
      if (seesPoint(bot, point, scale)) {
        best = { kind: 'player', pos: point };
        bestDist = eyeOf(bot).distanceTo(point);
        if (!bot.spottedPlayer && now - bot.calloutAt > 8) {
          bot.spottedPlayer = true;
          bot.calloutAt = now;
          hooks.radio?.(bot.name, 'Contact — player here');
        }
      }
    }
    for (const other of bots) {
      if (!other.alive || other.team === bot.team) continue;
      const point = botAimPoint(other);
      const scale = other.crouching ? 0.75 : 1;
      if (!seesPoint(bot, point, scale)) continue;
      const dist = eyeOf(bot).distanceTo(point);
      if (dist < bestDist) {
        bestDist = dist;
        best = { kind: 'bot', ref: other, pos: point };
      }
    }
    return best;
  }

  const ray = new THREE.Ray();
  const playerBox = new THREE.Box3();
  const playerHead = new THREE.Sphere();
  function fireAt(bot, target, dt, random) {
    const muzzle = eyeOf(bot);
    muzzle.y -= 0.25;
    const aim = new THREE.Vector3().subVectors(target.pos, muzzle).normalize();
    const dist = eyeOf(bot).distanceTo(target.pos);
    const moving = target.kind === 'player' ? hooks.playerSpeed() : 3;
    const roundBonus = Math.min(0.1, (round - 1) * 0.02);
    const skill = Math.min(0.95, bot.skill + roundBonus);
    const flinch = now - bot.lastHurtAt < FLINCH_WINDOW ? FLINCH_SPREAD : 1;
    const role = ROLES[bot.role] || ROLES.support;
    const speedMul = role.speed;
    const spread = (0.012 + dist * 0.0009 + moving * 0.004) * (1.25 - skill * 0.5)
      * (bot.crouching ? 0.8 : 1) * flinch;
    aim.x += (random() * 2 - 1) * spread;
    aim.y += (random() * 2 - 1) * spread;
    aim.z += (random() * 2 - 1) * spread;
    aim.normalize();
    ray.set(muzzle, aim);
    let hitPoint = null;
    let hitBot = null;
    let hitPlayer = false;
    let headshot = false;
    if (target.kind === 'player') {
      const p = hooks.playerPos();
      playerBox.min.set(p.x - 0.34, p.y, p.z - 0.34);
      playerBox.max.set(p.x + 0.34, p.y + 1.72, p.z + 0.34);
      playerHead.center.set(p.x, p.y + 1.52, p.z);
      playerHead.radius = 0.17;
      const headHit = ray.intersectsSphere(playerHead);
      const bodyHit = ray.intersectsBox(playerBox);
      if (headHit || bodyHit) {
        headshot = headHit;
        hitPlayer = true;
        const t = ray.distanceToPoint(playerHead.center);
        hitPoint = muzzle.clone().addScaledVector(aim, Math.max(1, t));
      }
    } else {
      raycaster.set(muzzle, aim);
      raycaster.far = 60;
      const hit = raycaster.intersectObjects([target.ref.torso, target.ref.head], false)[0];
      if (hit) {
        hitBot = target.ref;
        headshot = hit.object.userData.part === 'head';
        hitPoint = hit.point;
      }
    }
    if (!hitPoint) {
      raycaster.set(muzzle, aim);
      raycaster.far = 60;
      const wall = raycaster.intersectObjects(world.shootables, false)[0];
      hitPoint = wall ? wall.point : muzzle.clone().addScaledVector(aim, 40);
      if (wall) effects.burst(wall.point, 0xffd9a0, 2);
    }
    effects.tracer(muzzle, hitPoint);
    hooks.onBotShot?.(bot);
    const distToPlayer = hooks.playerPos().distanceTo(muzzle);
    if (distToPlayer < 34) audio.enemyShot(distToPlayer);
    if (hitPlayer) {
      const dmg = Math.round((headshot ? 26 : 11) * (0.85 + random() * 0.3));
      hooks.damagePlayer(dmg, bot);
    } else if (hitBot) {
      damageBot(hitBot, headshot ? 34 : 13, bot, random);
    }
    void speedMul;
  }

  function damageBot(bot, amount, attacker, random) {
    if (!bot.alive) return;
    bot.health -= amount;
    bot.flash = 0.16;
    if (attacker && attacker.kind === 'player') {
      bot.lastSeen.copy(hooks.playerPos());
      bot.lastSeenAt = now;
      bot.hearPos = hooks.playerPos().clone();
      bot.spottedPlayer = true;
      bot.lastHurtAt = now;
      if (random() < 0.3) hooks.radio?.(bot.name, `I'm hit — ${bot.lane === 'mid' ? 'mid' : `site ${bot.lane}`}`);
    }
    if (attacker && attacker.name) hooks.onBotDamage?.(attacker, amount);
    if (bot.health > 0 && bot.health <= 30 && bot.state === 'engage') {
      bot.state = 'patrol';
      bot.target = null;
      const siteNodes = SITE_NODES[bot.lane === 'mid' ? (bot.team === 'attack' ? 'A' : bot.lane) : bot.lane];
      const dest = siteNodes[Math.floor(random() * siteNodes.length)];
      bot.route = route(nearestNode(bot.pos.x, bot.pos.z), dest).map((i) => WAYPOINTS[i]);
      bot.routeIndex = 0;
      bot.holdSince = now;
      const mate = bots
        .filter((b) => b.alive && b.team === bot.team && b !== bot)
        .sort((a, b) => a.pos.distanceToSquared(bot.pos) - b.pos.distanceToSquared(bot.pos))[0];
      if (mate) mate.hearPos = bot.lastSeen.clone();
      return;
    }
    if (bot.health > 0) return;
    bot.alive = false;
    bot.fall = 0;
    bot.defuseProgress = 0;
    const aliveMates = bots.filter((b) => b.alive && b.team === bot.team).length;
    if (aliveMates === 1) {
      const last = bots.find((b) => b.alive && b.team === bot.team);
      if (last) hooks.radio?.(last.name, `Last one — 1v${bot.team === 'attack' ? 5 : 4}`);
    }
    hooks.onBotDown(bot, attacker);
  }

  function maybeUseUtil(bot, random) {
    if (now - bot.utilAt < 6) return;
    if (bot.team === 'attack' && bot.planUtil && !bot.smokedSite && bot.state === 'patrol') {
      const site = bot.lane === 'mid' ? null : bot.lane;
      if (site) {
        const center = site === 'A' ? { x: -15, z: -11 } : { x: 15, z: -11 };
        const d = Math.hypot(center.x - bot.pos.x, center.z - bot.pos.z);
        if (d < 14 && bot.util[bot.planUtil] > 0) {
          bot.util[bot.planUtil] -= 1;
          bot.utilAt = now;
          bot.smokedSite = true;
          const target = new THREE.Vector3(center.x, 0, center.z);
          hooks.throwBotUtil?.(bot, bot.planUtil, target);
          hooks.radio?.(bot.name, bot.planUtil === 'smoke' ? `Smoking ${site}` : `Flashing ${site}`);
          return;
        }
      }
    }
    if (bot.team === 'defend' && bot.util.flash > 0 && !bot.flashedSite) {
      const pushed = attackersOnSite('A') >= 2 ? 'A' : attackersOnSite('B') >= 2 ? 'B' : null;
      if (pushed && bot.lane === pushed) {
        bot.util.flash -= 1;
        bot.utilAt = now;
        bot.flashedSite = true;
        const center = pushed === 'A' ? new THREE.Vector3(-15, 0, -11) : new THREE.Vector3(15, 0, -11);
        hooks.throwBotUtil?.(bot, 'flash', center);
        hooks.radio?.(bot.name, `Flashing ${pushed}`);
      }
    }
    if (hooks.spikePlanted() && bot.team === 'defend' && bot.util.smoke > 0 && now - bot.utilAt > 10) {
      const spikePos = hooks.spikePos();
      const d = Math.hypot(spikePos.x - bot.pos.x, spikePos.z - bot.pos.z);
      if (d < 16) {
        bot.util.smoke -= 1;
        bot.utilAt = now;
        hooks.throwBotUtil?.(bot, 'smoke', spikePos.clone());
        hooks.radio?.(bot.name, 'Smoking the spike');
      }
    }
  }

  function maybeLobFrag(bot, random) {
    if (bot.util.frag <= 0 || now - bot.utilAt < 20) return;
    let aimPoint = null;
    if (hooks.spikePlanted() && bot.team === 'defend') {
      aimPoint = hooks.spikePos();
    } else if (bot.team === 'defend' && bot.hearPos) {
      const d = Math.hypot(bot.hearPos.x - bot.pos.x, bot.hearPos.z - bot.pos.z);
      if (d >= 5 && d <= 24 && random() < 0.35) aimPoint = bot.hearPos.clone();
    } else if (bot.team === 'attack' && bot.state === 'patrol' && bot.route.length) {
      const end = bot.route[bot.route.length - 1];
      if (Math.hypot(end.x - bot.pos.x, end.z - bot.pos.z) < 9 && random() < 0.02) {
        aimPoint = end.clone();
      }
    }
    if (!aimPoint) return;
    const dist = Math.hypot(aimPoint.x - bot.pos.x, aimPoint.z - bot.pos.z);
    if (dist < 4 || dist > 26) return;
    bot.util.frag -= 1;
    bot.utilAt = now;
    hooks.throwBotUtil?.(bot, 'frag', aimPoint);
  }

  function hearSound(x, z, radius, kind) {
    for (const bot of bots) {
      if (!bot.alive) continue;
      const d = Math.hypot(bot.pos.x - x, bot.pos.z - z);
      if (d > radius) continue;
      if (kind === 'plant') {
        bot.hearPos = new THREE.Vector3(x, 0, z);
        if (bot.team === 'defend' && bot.state === 'patrol') {
          bot.route = [new THREE.Vector3(x, 0, z)];
          bot.routeIndex = 0;
        }
      } else if (kind === 'shot' && d < 22) {
        bot.hearPos = new THREE.Vector3(x, 0, z);
        if (bot.state === 'patrol' && bot.routeIndex >= bot.route.length - 1) {
          bot.route = [new THREE.Vector3(x, 0, z)];
          bot.routeIndex = 0;
        }
      } else if (kind === 'step' && d < 10) {
        bot.hearPos = new THREE.Vector3(x, 0, z);
      }
    }
  }

  function updateBot(bot, dt, random) {
    if (!bot.alive) {
      if (bot.fall < 1) {
        bot.fall = Math.min(1, bot.fall + dt / 0.45);
        bot.group.rotation.x = -bot.fall * 1.45;
        bot.group.position.y = -bot.fall * 0.12;
      }
      return;
    }
    bot.flash = Math.max(0, bot.flash - dt);
    // Flash kena tembak: suit (torso+kepala+lengan) menyala merah-putih terang
    // + strip glow tim ikut menyala — bukan cuma torso merah redup seperti dulu.
    // Flinch: badan tersentak miring sebentar seiring flash memudar.
    if (bot.flash > 0) {
      const k = bot.flash / 0.16;
      bot.suitMat.emissive.setHex(0xff2e2e);
      bot.suitMat.emissiveIntensity = 0.6 + k * 1.4;
      bot.glowMat.emissiveIntensity = 0.35 + k * 1.6;
      bot.group.rotation.x = -0.09 * k;
      bot.group.rotation.z = 0.06 * k;
    } else {
      bot.suitMat.emissive.setHex(0x000000);
      bot.suitMat.emissiveIntensity = 1;
      bot.glowMat.emissiveIntensity = 0.35;
      bot.group.rotation.x = 0;
      bot.group.rotation.z = 0;
    }

    const blinded = now < bot.blindUntil;

    const role = ROLES[bot.role] || ROLES.support;
    if (bot.state === 'patrol' && now - bot.holdSince > 4 && !bot.crouching) {
      bot.crouching = true;
    } else if (bot.state !== 'patrol' && bot.crouching) {
      bot.crouching = false;
    }

    if (hooks.spikePlanted() && bot.team === 'defend' && !blinded) {
      const spikePos = hooks.spikePos();
      const distToSpike = Math.hypot(spikePos.x - bot.pos.x, spikePos.z - bot.pos.z);
      const nearestDefender = bots
        .filter((b) => b.alive && b.team === 'defend')
        .sort((a, b) => Math.hypot(hooks.spikePos().x - a.pos.x, hooks.spikePos().z - a.pos.z)
          - Math.hypot(hooks.spikePos().x - b.pos.x, hooks.spikePos().z - b.pos.z))[0];
      if (nearestDefender === bot) {
        if (distToSpike > 1.4) {
          if (!bot.defuseRoute || bot.defuseRouteIndex >= bot.defuseRoute.length
            || !bot.defuseTarget || bot.defuseTarget.distanceToSquared(spikePos) > 0.25) {
            const dest = nearestNode(spikePos.x, spikePos.z);
            bot.defuseRoute = route(nearestNode(bot.pos.x, bot.pos.z), dest).map((i) => WAYPOINTS[i]);
            bot.defuseRoute.push(spikePos.clone());
            bot.defuseRouteIndex = 0;
            bot.defuseTarget = spikePos.clone();
          }
          const node = bot.defuseRoute[bot.defuseRouteIndex];
          if (walkToward(bot, node, dt, PUSH_SPEED)) bot.defuseRouteIndex += 1;
          bot.defuseProgress = 0;
        } else {
          bot.defuseProgress += dt / DEFUSE_TIME;
          bot.yaw = Math.atan2(spikePos.x - bot.pos.x, spikePos.z - bot.pos.z) + Math.PI;
          if (Math.floor(now * 2) !== Math.floor((now - dt) * 2)) audio.defuseBeep();
          if (bot.defuseProgress >= 1) {
            hooks.radio?.(bot.name, 'Defusing — cover me');
            hooks.onDefused(bot);
          }
          return;
        }
      } else {
        maybeLobFrag(bot, random);
      }
    }

    const target = blinded ? null : pickTarget(bot);
    if (target) {
      bot.target = target;
      bot.lastSeen.copy(target.pos);
      bot.lastSeenAt = now;
      if (bot.state !== 'engage') {
        bot.state = 'engage';
        const roundBonus = Math.min(0.15, (round - 1) * 0.03);
        bot.reaction = Math.max(0.25, bot.reactionBase * (0.7 + random() * 0.6) - roundBonus);
        bot.burstLeft = 0;
        bot.shotTimer = 0;
      }
    } else if (bot.state === 'engage') {
      if (now - bot.lastSeenAt > 1.6) {
        bot.state = 'patrol';
        bot.target = null;
        bot.spottedPlayer = false;
        if (bot.hearPos) {
          bot.route = [bot.hearPos.clone()];
          bot.routeIndex = 0;
          bot.hearPos = null;
        } else {
          chooseDestination(bot, random);
        }
      } else {
        bot.target = { kind: 'point', pos: bot.lastSeen };
      }
    }

    if (bot.state === 'engage' && bot.target && !blinded) {
      const toTarget = new THREE.Vector3().subVectors(bot.target.pos, bot.pos);
      const dist = Math.hypot(toTarget.x, toTarget.z);
      bot.yaw = Math.atan2(toTarget.x, toTarget.z) + Math.PI;
      if (now > bot.strafeUntil) {
        bot.strafeDir = random() < 0.5 ? -1 : 1;
        bot.strafeUntil = now + 0.7 + random() * 0.9;
      }
      const side = new THREE.Vector3(-toTarget.z, 0, toTarget.x).normalize().multiplyScalar(bot.strafeDir);
      const toward = dist > 20 ? 1 : dist < 6 ? -1 : 0;
      const move = side.addScaledVector(toTarget.clone().normalize(), toward * 0.7).normalize();
      const stepVec = move.multiplyScalar(PATROL_SPEED * 0.75 * dt);
      if (!isBlocked(bot.pos.x + stepVec.x, bot.pos.z)) bot.pos.x += stepVec.x;
      if (!isBlocked(bot.pos.x, bot.pos.z + stepVec.z)) bot.pos.z += stepVec.z;
      if (bot.target.kind !== 'point') {
        if (bot.reaction > 0) {
          bot.reaction -= dt;
        } else {
          if (bot.burstLeft === 0) {
            bot.burstLeft = 3 + Math.floor(random() * 3);
            bot.shotTimer = 0;
          }
          bot.shotTimer -= dt;
          if (bot.shotTimer <= 0 && bot.burstLeft > 0) {
            fireAt(bot, bot.target, dt, random);
            bot.burstLeft -= 1;
            bot.shotTimer = bot.burstLeft > 0 ? 0.13 : 0.55 + random() * 0.5;
          }
        }
      }
    } else if (bot.state === 'patrol') {
      if (now < bot.goAt) {
        bot.group.position.copy(bot.pos);
        bot.group.rotation.set(0, bot.yaw, 0);
        return;
      }
      considerFlank(bot, random);
      maybeUseUtil(bot, random);
      maybeLobFrag(bot, random);
      if (now < bot.holdUntil) {
        bot.yaw += dt * 0.35;
      } else if (bot.route.length && bot.routeIndex < bot.route.length) {
        const node = bot.route[bot.routeIndex];
        const speed = (bot.role === 'sniper' ? PATROL_SPEED * 0.9 : PATROL_SPEED) * role.speed;
        if (walkToward(bot, node, dt, hooks.spikePlanted() ? PUSH_SPEED : speed)) {
          bot.routeIndex += 1;
          if (bot.routeIndex >= bot.route.length) {
            bot.holdUntil = now + (bot.holdTime || 2.5) + random() * 3;
            bot.holdSince = now;
            if (random() < 0.6) chooseDestination(bot, random);
          }
        }
      } else {
        chooseDestination(bot, random);
      }
    }

    const moved = Math.hypot(bot.pos.x - bot.prevX, bot.pos.z - bot.prevZ);
    bot.prevX = bot.pos.x;
    bot.prevZ = bot.pos.z;
    if (moved > 0.001) {
      bot.stepAcc += moved;
      if (bot.stepAcc > 2.2) {
        bot.stepAcc = 0;
        const distToPlayer = Math.hypot(hooks.playerPos().x - bot.pos.x, hooks.playerPos().z - bot.pos.z);
        if (distToPlayer < 18) audio.botStep(distToPlayer);
        if (hooks.hearing) hooks.hearing.emit(bot.pos.x, bot.pos.z, 'step');
      }
    }

    bot.group.position.copy(bot.pos);
    bot.group.position.y = bot.crouching ? -0.35 : 0;
    bot.group.rotation.set(0, bot.yaw, 0);
  }

  function createAll(random) {
    for (let i = 0; i < 4; i += 1) makeBot('attack', i, random);
    for (let i = 0; i < 5; i += 1) makeBot('defend', i, random);
  }

  return {
    bots,
    hitMeshes,
    createAll,
    spawnRound,
    damageBot,
    setPlan,
    blindBots(pos, radius) {
      for (const bot of bots) {
        if (!bot.alive) continue;
        const eye = eyeOf(bot);
        const dist = eye.distanceTo(pos);
        if (dist > radius) continue;
        if (!clearShot(eye, pos)) continue;
        const to = new THREE.Vector3().subVectors(pos, eye).normalize();
        const facing = new THREE.Vector3(Math.sin(bot.yaw + Math.PI), 0, Math.cos(bot.yaw + Math.PI));
        const facingFactor = Math.max(0.25, facing.dot(to));
        bot.blindUntil = now + 1.1 + (1 - dist / radius) * 1.4 * facingFactor;
        if (bot.team === 'defend') hooks.radio?.(bot.name, 'Flashed — blind!');
      }
    },
    step(dt, time, random) {
      now = time;
      for (const bot of bots) updateBot(bot, dt, random);
    },
    hearShot(fromPos, radius = 30) {
      for (const bot of bots) {
        if (!bot.alive) continue;
        if (bot.pos.distanceTo(fromPos) < radius) {
          bot.hearPos = fromPos.clone();
          if (bot.state === 'patrol' && bot.routeIndex >= bot.route.length - 1) {
            bot.route = [fromPos.clone()];
            bot.routeIndex = 0;
          }
        }
      }
    },
    aliveCounts() {
      return {
        attack: bots.filter((b) => b.alive && b.team === 'attack').length,
        defend: bots.filter((b) => b.alive && b.team === 'defend').length,
      };
    },
    defuseProgress() {
      const defuser = bots.find((b) => b.alive && b.team === 'defend' && b.defuseProgress > 0);
      return defuser ? defuser.defuseProgress : 0;
    },
    reset() {
      for (const bot of bots) {
        bot.group.visible = false;
        bot.alive = false;
      }
    },
  };
}
