// Round plans: the squad's playbook. Every round the attackers pick one
export const ROLES = {
  entry: { speed: 1.12, skill: 0.62, hold: 1.5 },
  support: { speed: 1.0, skill: 0.66, hold: 2.5 },
  lurk: { speed: 0.95, skill: 0.68, hold: 3.5 },
  sniper: { speed: 0.9, skill: 0.78, hold: 6 },
  anchor: { speed: 0.95, skill: 0.68, hold: 6 },
  roam: { speed: 1.08, skill: 0.62, hold: 2 },
  flex: { speed: 1.05, skill: 0.65, hold: 2.5 },
};

const ATTACK_PLAYS = [
  {
    id: 'a-split', name: 'A SPLIT', site: 'A',
    line: 'Two A, one mid, one B fake — plant A',
    slots: [
      { lane: 'A', role: 'entry', delay: 0, util: 'smoke' },
      { lane: 'A', role: 'support', delay: 2, util: 'flash' },
      { lane: 'mid', role: 'lurk', delay: 9, util: null },
      { lane: 'B', role: 'sniper', delay: 0, util: 'flash' },
    ],
  },
  {
    id: 'b-rush', name: 'B RUSH', site: 'B',
    line: 'Three B fast, one mid late — plant B',
    slots: [
      { lane: 'B', role: 'entry', delay: 0, util: 'smoke' },
      { lane: 'B', role: 'support', delay: 1, util: 'flash' },
      { lane: 'mid', role: 'lurk', delay: 6, util: null },
      { lane: 'B', role: 'sniper', delay: 0, util: null },
    ],
  },
  {
    id: 'mid-take', name: 'MID TAKE', site: null,
    line: 'Take mid, then split to the weak site',
    slots: [
      { lane: 'mid', role: 'entry', delay: 0, util: 'flash' },
      { lane: 'mid', role: 'lurk', delay: 0, util: 'smoke' },
      { lane: 'A', role: 'support', delay: 4, util: null },
      { lane: 'B', role: 'sniper', delay: 4, util: null },
    ],
  },
  {
    id: 'a-fake', name: 'A FAKE', site: 'B',
    line: 'Noise at A, real push B — plant B',
    slots: [
      { lane: 'B', role: 'entry', delay: 7, util: 'smoke' },
      { lane: 'A', role: 'support', delay: 0, util: 'flash' },
      { lane: 'B', role: 'lurk', delay: 7, util: null },
      { lane: 'A', role: 'sniper', delay: 0, util: null },
    ],
  },
];

const DEFEND_SETUPS = [
  {
    id: 'two-one-two', name: '2-1-2', line: 'Two A, one mid, two B',
    slots: [
      { lane: 'A', role: 'anchor' }, { lane: 'B', role: 'anchor' },
      { lane: 'mid', role: 'roam' }, { lane: 'B', role: 'sniper' },
      { lane: 'A', role: 'flex' },
    ],
  },
  {
    id: 'stack-a', name: 'STACK A', line: 'Three on A after that plant',
    slots: [
      { lane: 'A', role: 'anchor' }, { lane: 'B', role: 'anchor' },
      { lane: 'mid', role: 'roam' }, { lane: 'A', role: 'sniper' },
      { lane: 'A', role: 'flex' },
    ],
  },
  {
    id: 'stack-b', name: 'STACK B', line: 'Three on B after that plant',
    slots: [
      { lane: 'A', role: 'anchor' }, { lane: 'B', role: 'anchor' },
      { lane: 'mid', role: 'roam' }, { lane: 'B', role: 'sniper' },
      { lane: 'B', role: 'flex' },
    ],
  },
  {
    id: 'mid-press', name: 'MID PRESS', line: 'Two mid, one each site',
    slots: [
      { lane: 'A', role: 'anchor' }, { lane: 'B', role: 'anchor' },
      { lane: 'mid', role: 'roam' }, { lane: 'mid', role: 'sniper' },
      { lane: 'B', role: 'flex' },
    ],
  },
];

export function createPlans(hooks) {
  let attack = ATTACK_PLAYS[0];
  let defend = DEFEND_SETUPS[0];

  return {
    get attack() { return attack; },
    get defend() { return defend; },
    pickAttack(round, lastSite, random) {
      const pool = ATTACK_PLAYS.filter((p) => p.id !== attack.id);
      attack = pool[Math.floor(random() * pool.length)];
      hooks.radio('DUST', `Plan: ${attack.name} — ${attack.line}`);
      return attack;
    },
    pickDefend(round, lastSite, random) {
      if (lastSite === 'A') defend = DEFEND_SETUPS[1];
      else if (lastSite === 'B') defend = DEFEND_SETUPS[2];
      else defend = round % 3 === 0 ? DEFEND_SETUPS[3] : DEFEND_SETUPS[0];
      hooks.radio('ASH', `Setup: ${defend.name} — ${defend.line}`);
      return defend;
    },
  };
}
