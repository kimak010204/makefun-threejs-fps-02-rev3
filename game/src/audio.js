// Procedural sound: every effect is synthesized with WebAudio — no audio
export function createAudio() {
  let ctx = null;
  let noiseBuf = null;
  let master = null;
  let windOn = false;
  let volume = 0.35;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate * 0.5);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function startWind() {
    if (windOn || !ctx) return;
    windOn = true;
    try {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.11;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain).connect(g.gain);
      src.connect(filter).connect(g).connect(master);
      src.start();
      lfo.start();
    } catch {
    }
  }

  function noise(dur, filterFreq, gain, type = 'lowpass', when = 0) {
    if (!ensure()) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  function tone(freq, dur, gain, type = 'sine', slideTo = 0, when = 0) {
    if (!ensure()) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  return {
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
      startWind();
    },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = volume;
    },
    shot(id) {
      if (id === 'dmr') { noise(0.22, 900, 0.9); tone(160, 0.14, 0.5, 'square', 60); }
      else if (id === 'pistol') { noise(0.12, 1600, 0.7); tone(220, 0.08, 0.35, 'square', 90); }
      else if (id === 'smg') { noise(0.09, 2000, 0.55); tone(260, 0.06, 0.25, 'square', 110); }
      else if (id === 'shotgun') { noise(0.3, 700, 1.0); tone(120, 0.22, 0.6, 'square', 45); }
      else { noise(0.16, 1200, 0.85); tone(180, 0.1, 0.45, 'square', 70); }
    },
    enemyShot(distance) {
      noise(0.12, 1100, Math.max(0.08, 0.5 - distance * 0.012));
    },
    reload() {
      tone(900, 0.05, 0.2, 'square');
      tone(600, 0.05, 0.2, 'square', 0, 0.25);
      tone(1100, 0.05, 0.25, 'square', 0, 0.55);
    },
    dry() { tone(1400, 0.03, 0.15, 'square'); },
    hit() { tone(1900, 0.05, 0.25, 'sine'); },
    kill() {
      tone(880, 0.07, 0.3, 'sine');
      tone(1320, 0.1, 0.3, 'sine', 0, 0.07);
    },
    explosion() {
      noise(0.9, 320, 1.0);
      tone(90, 0.7, 0.7, 'sine', 30);
    },
    plantBeep() { tone(1250, 0.09, 0.3, 'square'); },
    defuseBeep() { tone(980, 0.09, 0.3, 'square'); },
    grenadeBeep() { tone(1500, 0.06, 0.2, 'square'); },
    buy() {
      tone(660, 0.06, 0.25, 'sine');
      tone(990, 0.09, 0.25, 'sine', 0, 0.06);
    },
    click() { tone(700, 0.03, 0.15, 'square'); },
    footstep() { noise(0.05, 500, 0.12); },
    botStep(distance) { noise(0.05, 420, Math.max(0.03, 0.22 - distance * 0.006)); },
    roundStart() {
      tone(392, 0.1, 0.25, 'sine');
      tone(523, 0.14, 0.25, 'sine', 0, 0.1);
    },
    roundWin() {
      tone(523, 0.12, 0.3, 'sine');
      tone(659, 0.12, 0.3, 'sine', 0, 0.12);
      tone(784, 0.2, 0.3, 'sine', 0, 0.24);
    },
    roundLose() {
      tone(392, 0.15, 0.3, 'sine');
      tone(311, 0.25, 0.3, 'sine', 0, 0.15);
    },
    plantStart() {
      tone(1250, 0.05, 0.25, 'square');
      tone(1250, 0.05, 0.25, 'square', 0, 0.2);
    },
    heartbeat() {
      tone(70, 0.1, 0.5, 'sine', 40);
      tone(65, 0.09, 0.4, 'sine', 35, 0.16);
    },
    radioBlip() {
      tone(1150, 0.04, 0.16, 'square');
      tone(1150, 0.04, 0.16, 'square', 0, 0.09);
    },
    flashRing() {
      tone(2600, 0.35, 0.4, 'sine', 900);
      noise(0.06, 3000, 0.5, 'highpass');
    },
    smokeHiss() {
      noise(1.4, 900, 0.22, 'bandpass');
    },
  };
}
