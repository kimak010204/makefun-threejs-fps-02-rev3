// Player movement: acceleration, friction, gravity, crouch, walk and jump,
import * as THREE from 'three';

const RADIUS = 0.34;
const STAND_HEIGHT = 1.72;
const CROUCH_HEIGHT = 1.12;
const STAND_EYE = 1.6;
const CROUCH_EYE = 1.02;
const WALK_SPEED = 5.2;
const CROUCH_SPEED = 2.4;
const SLOW_SPEED = 2.9;
const GROUND_ACCEL = 42;
const AIR_ACCEL = 9;
const FRICTION = 9;
const GRAVITY = 20;
const JUMP_SPEED = 6.2;

export function createPlayer(colliders) {
  const body = {
    position: new THREE.Vector3(0, 0, 15),
    velocity: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    eye: STAND_EYE,
    onGround: true,
    crouching: false,
    height: STAND_HEIGHT,
    stepped: 0,
    bobPhase: 0,
    bobAmount: 0,
    landDip: 0,
  };
  const probe = new THREE.Box3();
  const wish = new THREE.Vector3();

  function hits(x, y, z, height, lift) {
    probe.min.set(x - RADIUS, y + lift, z - RADIUS);
    probe.max.set(x + RADIUS, y + height - lift, z + RADIUS);
    for (const collider of colliders) if (probe.intersectsBox(collider)) return collider;
    return null;
  }

  function look(dx, dy, sensitivity = 0.0022) {
    body.yaw -= dx * sensitivity;
    body.pitch = Math.max(-1.45, Math.min(1.45, body.pitch - dy * sensitivity));
  }

  function recoil(pitchKick, yawKick) {
    body.pitch = Math.min(1.45, body.pitch + pitchKick);
    body.yaw += yawKick;
  }

  function teleport(x, z, yaw) {
    body.position.set(x, 0, z);
    body.velocity.set(0, 0, 0);
    body.yaw = yaw;
    body.pitch = 0;
    body.crouching = false;
    body.height = STAND_HEIGHT;
    body.eye = STAND_EYE;
    body.bobPhase = 0;
    body.bobAmount = 0;
    body.landDip = 0;
  }

  function step(dt, keys) {
    const wantCrouch = keys.has('ControlLeft') || keys.has('ControlRight') || keys.has('KeyC');
    if (wantCrouch && !body.crouching) {
      body.crouching = true;
      body.height = CROUCH_HEIGHT;
    } else if (!wantCrouch && body.crouching
      && !hits(body.position.x, body.position.y, body.position.z, STAND_HEIGHT, 0.02)) {
      body.crouching = false;
      body.height = STAND_HEIGHT;
    }
    const eyeGoal = body.crouching ? CROUCH_EYE : STAND_EYE;
    body.eye += (eyeGoal - body.eye) * Math.min(1, dt * 12);

    const forward = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    const strafe = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
    wish.set(0, 0, 0);
    if (forward || strafe) {
      const sin = Math.sin(body.yaw);
      const cos = Math.cos(body.yaw);
      wish.set(-sin * forward + cos * strafe, 0, -cos * forward - sin * strafe).normalize();
    }
    const slow = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = body.crouching ? CROUCH_SPEED : slow ? SLOW_SPEED : WALK_SPEED;
    const blend = Math.min(1, (body.onGround ? GROUND_ACCEL : AIR_ACCEL) * dt / speed);
    body.velocity.x += (wish.x * speed - body.velocity.x) * blend;
    body.velocity.z += (wish.z * speed - body.velocity.z) * blend;
    if (body.onGround && !wish.lengthSq()) {
      const damp = Math.max(0, 1 - FRICTION * dt);
      body.velocity.x *= damp;
      body.velocity.z *= damp;
    }
    if (keys.has('Space') && body.onGround) {
      body.velocity.y = JUMP_SPEED;
      body.onGround = false;
    }
    body.velocity.y -= GRAVITY * dt;

    const nextX = body.position.x + body.velocity.x * dt;
    if (!hits(nextX, body.position.y, body.position.z, body.height, 0.04)) body.position.x = nextX;
    else body.velocity.x = 0;
    const nextZ = body.position.z + body.velocity.z * dt;
    if (!hits(body.position.x, body.position.y, nextZ, body.height, 0.04)) body.position.z = nextZ;
    else body.velocity.z = 0;

    const hardLanding = body.velocity.y < -6;
    body.position.y += body.velocity.y * dt;
    body.onGround = false;
    const floor = hits(body.position.x, body.position.y, body.position.z, body.height, 0);
    if (floor && body.velocity.y <= 0) {
      body.position.y = floor.max.y;
      body.velocity.y = 0;
      body.onGround = true;
      if (hardLanding) body.landDip = 0.14;
    } else if (floor) {
      body.position.y = floor.min.y - body.height;
      body.velocity.y = 0;
    }
    if (body.position.y < 0) {
      body.position.y = 0;
      body.velocity.y = 0;
      body.onGround = true;
      if (hardLanding) body.landDip = 0.14;
    }
    body.velocity.y = Math.max(-30, body.velocity.y);
    if (body.onGround) body.stepped += Math.hypot(body.velocity.x, body.velocity.z) * dt;

    const groundSpeed = Math.hypot(body.velocity.x, body.velocity.z);
    body.bobPhase += dt * (4 + groundSpeed * 1.8);
    const targetBob = body.onGround ? Math.min(1, groundSpeed / WALK_SPEED) : 0;
    body.bobAmount += (targetBob - body.bobAmount) * Math.min(1, dt * 8);
    body.landDip = Math.max(0, body.landDip - dt * 0.5);
  }

  function bobOffset() {
    return {
      y: Math.sin(body.bobPhase * 2) * 0.028 * body.bobAmount - body.landDip,
      x: Math.cos(body.bobPhase) * 0.014 * body.bobAmount,
    };
  }

  return {
    state: body,
    step,
    look,
    recoil,
    teleport,
    bobOffset,
    groundSpeed() {
      return Math.hypot(body.velocity.x, body.velocity.z);
    },
  };
}
