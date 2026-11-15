// Rounds and money: buy phase, live round, plant fuse, round end, match
export const BUY_SECONDS = 15;
export const ROUND_SECONDS = 100;
export const FUSE_SECONDS = 35;
export const WIN_ROUNDS = 5;
export const MAX_ROUNDS = 9;
export const KILL_REWARD = 300;
export const WIN_REWARD = 3250;
export const LOSS_REWARD = 1900;
export const PLANT_REWARD = 300;
export const START_MONEY = 800;

export function createRounds(hooks) {
  const state = {
    phase: 'buy', // buy | live | over | match
    phaseTime: BUY_SECONDS,
    round: 1,
    wins: { attack: 0, defend: 0 },
    money: START_MONEY,
    planted: null, // { site, pos, fuse }
    lastReason: '',
    matchWinner: null,
    roundKills: 0,
    history: [], // winners per round, oldest first
    lastSite: null,
    lastWinner: null,
  };

  function openRound() {
    state.phase = 'buy';
    state.phaseTime = BUY_SECONDS;
    state.planted = null;
    state.roundKills = 0;
    hooks.onRoundStart(state.round);
  }

  function closeRound(winner, reason) {
    state.wins[winner] += 1;
    state.money += winner === 'attack' ? WIN_REWARD : LOSS_REWARD;
    state.lastReason = reason;
    state.lastWinner = winner;
    state.history.push(winner);
    state.phase = 'over';
    state.phaseTime = 5;
    hooks.onRoundEnd(winner, reason, state.wins);
    if (state.wins[winner] >= WIN_ROUNDS || state.round >= MAX_ROUNDS) {
      state.matchWinner = state.wins.attack > state.wins.defend
        ? 'attack'
        : state.wins.defend > state.wins.attack ? 'defend' : 'draw';
    }
  }

  return {
    state,
    startMatch() {
      state.round = 1;
      state.wins = { attack: 0, defend: 0 };
      state.money = START_MONEY;
      state.matchWinner = null;
      state.roundKills = 0;
      state.history = [];
      state.lastSite = null;
      state.lastWinner = null;
      openRound();
    },
    startRound: openRound,
    endRound: closeRound,
    plant(site, pos) {
      if (state.phase !== 'live' || state.planted) return false;
      state.planted = { site, pos: pos.clone(), fuse: FUSE_SECONDS };
      state.lastSite = site;
      state.money += PLANT_REWARD;
      hooks.onPlant(site);
      return true;
    },
    addKillReward() {
      state.money += KILL_REWARD;
      state.roundKills += 1;
    },
    spend(amount) {
      if (state.money < amount) return false;
      state.money -= amount;
      return true;
    },
    step(dt) {
      if (state.phase === 'buy') {
        state.phaseTime -= dt;
        if (state.phaseTime <= 0) {
          state.phase = 'live';
          state.phaseTime = ROUND_SECONDS;
          hooks.onLiveStart();
        }
      } else if (state.phase === 'live') {
        if (state.planted) {
          state.planted.fuse -= dt;
          if (state.planted.fuse <= 0) {
            hooks.onDetonate();
            closeRound('attack', 'Spike detonated');
          }
        } else {
          state.phaseTime -= dt;
          if (state.phaseTime <= 0) closeRound('defend', 'Time expired');
        }
      } else if (state.phase === 'over') {
        state.phaseTime -= dt;
        if (state.phaseTime <= 0) {
          if (state.matchWinner) {
            state.phase = 'match';
            hooks.onMatchEnd(state.matchWinner, state.wins);
          } else {
            state.round += 1;
            openRound();
          }
        }
      }
    },
    timerText() {
      if (state.phase === 'buy') return `BUY ${Math.ceil(state.phaseTime)}`;
      if (state.phase === 'live' && state.planted) return `💥 ${state.planted.fuse.toFixed(1)}`;
      if (state.phase === 'live') {
        const left = Math.max(0, state.phaseTime);
        return `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
      }
      if (state.phase === 'over') return state.lastReason.toUpperCase();
      return '';
    },
  };
}
