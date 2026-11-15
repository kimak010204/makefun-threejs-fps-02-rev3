// The hearing bus: every sound the game makes is an event on one bus, and
export const HEARING = {
  shot: { radius: 30 },
  step: { radius: 10 },
  plant: { radius: 60 },
  boom: { radius: 40 },
  reload: { radius: 12 },
};

export function createHearing() {
  const listeners = new Set();
  return {
    listen(fn) { listeners.add(fn); },
    emit(x, z, kind) {
      const radius = (HEARING[kind] || HEARING.shot).radius;
      for (const fn of listeners) fn(x, z, radius, kind);
    },
  };
}
