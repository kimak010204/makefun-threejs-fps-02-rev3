// Keyboard and mouse, and the pointer lock that turns the mouse into look.
export function createInput(canvas, onLockChange) {
  const held = new Set();
  const edges = new Set();
  const state = { keys: held, pressed: edges, locked: false, firing: false, aiming: false, lookX: 0, lookY: 0 };

  function setKey(event, down) {
    if (event.code === 'Space' || event.code === 'Tab') event.preventDefault();
    if (down && !held.has(event.code)) edges.add(event.code);
    if (down) held.add(event.code);
    else held.delete(event.code);
  }

  window.addEventListener('keydown', (event) => setKey(event, true));
  window.addEventListener('keyup', (event) => setKey(event, false));
  window.addEventListener('blur', () => {
    held.clear();
    edges.clear();
    state.firing = false;
    state.aiming = false;
  });
  window.addEventListener('mousemove', (event) => {
    if (!state.locked) return;
    state.lookX += event.movementX;
    state.lookY += event.movementY;
  });
  window.addEventListener('mousedown', (event) => {
    if (!state.locked) return;
    if (event.button === 0) state.firing = true;
    if (event.button === 2) state.aiming = true;
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) state.firing = false;
    if (event.button === 2) state.aiming = false;
  });
  window.addEventListener('contextmenu', (event) => event.preventDefault());
  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
    if (!state.locked) {
      held.clear();
      edges.clear();
      state.firing = false;
      state.aiming = false;
    }
    onLockChange(state.locked);
  });

  return {
    state,
    requestLock() {
      canvas.requestPointerLock();
    },
    takeLook() {
      const x = state.lookX;
      const y = state.lookY;
      state.lookX = 0;
      state.lookY = 0;
      return { x, y };
    },
    takePressed() {
      const out = new Set(edges);
      edges.clear();
      return out;
    },
  };
}
