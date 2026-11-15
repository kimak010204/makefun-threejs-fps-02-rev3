// HUD: every readout the player sees — health and kevlar, money, ammo and
import { WEAPONS, WEAPON_ORDER, ARMOR_PRICE } from './weapon.js';
import { UTIL_DEFS } from './utility.js';
import { createMinimap } from './minimap.js';
import { createScoreboard } from './scoreboard.js';
import { createDamageFx } from './damagefx.js';

function fmtMoney(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export function createHud(doc) {
  const el = (id) => doc.getElementById(id);
  const root = el('hud');
  const minimap = createMinimap(el('minimap'));
  const scoreboard = createScoreboard();
  const damageFx = createDamageFx(el('damage-layer'), el('damage-arc'));
  const radioLog = el('radio-log');
  const utilBar = el('utility-bar');
  let settings = { sensitivity: 1, volume: 0.35, crosshair: '#e9e2d2' };
  let onSettings = null;
  let bannerTimer = null;
  let hintTimer = null;

  const sensInput = el('setting-sensitivity');
  const volInput = el('setting-volume');
  const crossSelect = el('setting-crosshair');
  function readSettings() {
    settings = {
      sensitivity: parseFloat(sensInput.value),
      volume: parseFloat(volInput.value),
      crosshair: crossSelect.value,
    };
    el('setting-sensitivity-value').textContent = settings.sensitivity.toFixed(2);
    el('setting-volume-value').textContent = `${Math.round(settings.volume * 100)}%`;
    doc.documentElement.style.setProperty('--cross-color', settings.crosshair);
    if (onSettings) onSettings(settings);
  }
  for (const input of [sensInput, volInput, crossSelect]) {
    input.addEventListener('input', readSettings);
  }

  function setPips(node, wins) {
    node.innerHTML = wins.map((w) => `<span class="pip ${w === 'A' ? 'van' : 'emb'}">●</span>`).join('');
  }

  return {
    settings,
    onSettingsChange(cb) { onSettings = cb; },
    applySettings(saved) {
      sensInput.value = saved.sensitivity;
      volInput.value = saved.volume;
      crossSelect.value = saved.crosshair;
      readSettings();
    },
    show() { root.hidden = false; },
    hide() { root.hidden = true; },
    onPlay(cb) { el('play').addEventListener('click', cb); },
    hideOverlay() { el('overlay').hidden = true; },
    showOverlay() { el('overlay').hidden = false; },
    setOverlayCopy(text) { el('overlay-copy').textContent = text; },

    setHealth(hp, max = 100) {
      el('health-num').textContent = Math.max(0, Math.ceil(hp));
      el('health-fill').style.width = `${Math.max(0, (hp / max) * 100)}%`;
      el('health-fill').classList.toggle('low', hp <= 30);
      el('health-box').classList.toggle('critical', hp <= 25);
      el('low-health').classList.toggle('on', hp <= 25);
    },
    setArmor(value) {
      el('armor-box').hidden = value <= 0;
      el('armor-value').textContent = Math.ceil(value);
    },
    setMoney(value) { el('money-value').textContent = fmtMoney(value); },
    setAmmo(mag, reserve, name) {
      el('ammo-mag').textContent = mag;
      el('ammo-reserve').textContent = `/ ${reserve}`;
      el('weapon-name').textContent = name;
      el('ammo').classList.toggle('empty', mag === 0);
    },
    setUtility(util, mode) {
      utilBar.innerHTML = '';
      for (const key of ['frag', 'flash', 'smoke']) {
        const def = UTIL_DEFS[key];
        const slot = doc.createElement('div');
        slot.className = `util-slot${mode === key ? ' sel' : ''}`;
        slot.textContent = `${def.short} `;
        const b = doc.createElement('b');
        b.textContent = util[key];
        slot.appendChild(b);
        utilBar.appendChild(slot);
      }
    },
    setTimer(text, planted) {
      const node = el('timer-value');
      node.textContent = text;
      node.classList.toggle('planted', planted);
    },
    setScore(attack, defend) {
      el('score-attack').textContent = attack;
      el('score-defend').textContent = defend;
    },
    setRoundPips(wins) { setPips(el('round-pips'), wins); },
    setAlive(attack, defend) {
      el('alive-attack').textContent = '●'.repeat(attack) + '○'.repeat(Math.max(0, 5 - attack));
      el('alive-defend').textContent = '●'.repeat(defend) + '○'.repeat(Math.max(0, 5 - defend));
    },
    setPlan(text) {
      const node = el('plan-line');
      node.hidden = !text;
      node.textContent = text || '';
    },
    feed(html, good = false) {
      const line = doc.createElement('div');
      line.className = `feed-line${good ? ' good' : ''}`;
      line.innerHTML = html;
      const feed = el('killfeed');
      feed.prepend(line);
      while (feed.children.length > 5) feed.lastChild.remove();
      window.setTimeout(() => line.remove(), 6000);
    },
    radio(who, text, ember = false) {
      const line = doc.createElement('div');
      line.className = `radio-line${ember ? ' ember' : ''}`;
      line.innerHTML = `<b>${who}</b> ${text}`;
      radioLog.appendChild(line);
      while (radioLog.children.length > 5) radioLog.firstChild.remove();
      window.setTimeout(() => line.remove(), 9000);
    },
    banner(title, sub = '', ms = 2600, detailsHtml = '') {
      const bannerEl = el('banner');
      el('banner-title').textContent = title;
      el('banner-sub').textContent = sub;
      el('banner-details').innerHTML = detailsHtml || '';
      bannerEl.classList.toggle('win-van', title.indexOf('VANGUARD') !== -1);
      bannerEl.classList.toggle('win-emb', title.indexOf('EMBER') !== -1);
      bannerEl.hidden = false;
      window.clearTimeout(bannerTimer);
      bannerTimer = window.setTimeout(() => { bannerEl.hidden = true; }, ms);
    },
    // Round-end team sheet: score line + both rosters (name + K/D), winner's
    // team first. rows come from scoreboard.table(): {name, team, kills, deaths}.
    roundEndDetails(rows, wins) {
      const byTeam = { attack: [], defend: [] };
      for (const r of rows) (byTeam[r.team] || byTeam.attack).push(r);
      const col = (team, label) => {
        const list = byTeam[team];
        if (!list.length) return '';
        const items = list.map((r) => `<li><span>${r.name}</span><span class="kd"><b>${r.kills}</b> / ${r.deaths}</span></li>`).join('');
        return `<div class="banner-team ${team === 'attack' ? 'van' : 'emb'}"><h4>${label}</h4><ul>${items}</ul></div>`;
      };
      const first = wins.attack >= wins.defend ? 'attack' : 'defend';
      const second = first === 'attack' ? 'defend' : 'attack';
      const label = (t) => (t === 'attack' ? 'VANGUARD' : 'EMBER');
      return `<div class="banner-score"><span class="van">VANGUARD ${wins.attack}</span> — <span class="emb">${wins.defend} EMBER</span></div>` +
        `<div class="banner-teams">${col(first, label(first))}${col(second, label(second))}</div>`;
    },
    hint(text, ms = 3000) {
      const node = el('hint');
      node.textContent = text;
      node.hidden = false;
      window.clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => { node.hidden = true; }, ms);
    },
    clearHint() { el('hint').hidden = true; },
    flash(strength) {
      el('flash-overlay').style.opacity = String(Math.max(0, Math.min(1, strength)));
    },
    damageFlash() {
      const node = el('damage-vignette');
      node.classList.add('on');
      window.setTimeout(() => node.classList.remove('on'), 140);
    },
    damageArc(angleDeg) {
      const node = el('damage-arc');
      node.style.setProperty('--arc-rot', `${angleDeg}deg`);
      node.classList.add('on');
      window.setTimeout(() => node.classList.remove('on'), 450);
    },
    damageNumber(camera, point, amount, head = false) { damageFx.spawn(camera, point, amount, head); },
    damageDirection(fromPos, playerPos, playerYaw) { damageFx.direction(fromPos, playerPos, playerYaw); },
    step(dt) { damageFx.step(dt); },
    crosshairGap(px) {
      el('crosshair').style.setProperty('--gap', `${px}px`);
    },
    hitmarker(kill = false) {
      const node = el('hitmarker');
      node.classList.add('on');
      node.classList.toggle('kill', kill);
      window.setTimeout(() => node.classList.remove('on'), 110);
    },
    plantBar(show, label = '', frac = 0) {
      el('plant-bar').hidden = !show;
      el('plant-label').textContent = label;
      el('plant-fill').style.width = `${Math.round(frac * 100)}%`;
    },
    spectate(name) {
      el('spectate-bar').hidden = !name;
      if (name) el('spectate-name').textContent = name;
    },
    minimap,
    scoreboard,
    showScoreboard(rows, title, mvpText = '') {
      el('scoreboard-title').textContent = title;
      const body = el('scoreboard-body');
      body.innerHTML = '';
      for (const r of rows) {
        const tr = doc.createElement('tr');
        const kd = r.deaths ? (r.kills / r.deaths).toFixed(2) : r.kills.toFixed(2);
        tr.innerHTML = `<td class="${r.team === 'attack' ? 'attack' : 'defend'}">${r.name}</td>` +
          `<td>${r.kills}</td><td>${r.deaths}</td><td>${kd}</td><td>${r.damage}</td><td>${r.plants + r.defuses}</td>`;
        body.appendChild(tr);
      }
      const note = doc.querySelector('#scoreboard .mvp-note');
      if (note) note.textContent = mvpText || 'Hold Tab to peek · MVP is named at the end of the match';
      el('scoreboard').hidden = false;
    },
    hideScoreboard() { el('scoreboard').hidden = true; },

    openBuy(state, onBuy) {
      const grid = el('buy-grid');
      grid.innerHTML = '';
      const utilGrid = el('buy-grid-util');
      utilGrid.innerHTML = '';
      el('buy-money').textContent = fmtMoney(state.money);
      el('buy-round').textContent = state.round;
      const refresh = () => this.openBuy(state, onBuy);
      for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
        const def = WEAPONS[WEAPON_ORDER[i]];
        const card = doc.createElement('button');
        card.type = 'button';
        card.className = `buy-card${state.owned.has(def.id) ? ' owned' : ''}${state.money < def.price && !state.owned.has(def.id) ? ' cant' : ''}`;
        card.innerHTML = `<b>${def.name}</b><span class="buy-price">${state.owned.has(def.id) ? 'OWNED' : fmtMoney(def.price)}</span>` +
          `<span class="buy-desc">${def.desc}</span><span class="buy-key">Press ${i + 1}</span>`;
        card.addEventListener('click', () => { if (onBuy({ kind: 'weapon', index: i })) refresh(); });
        grid.appendChild(card);
      }
      for (const key of ['frag', 'flash', 'smoke']) {
        const def = UTIL_DEFS[key];
        const card = doc.createElement('button');
        card.type = 'button';
        const owned = state.util[key] >= def.max;
        card.className = `buy-card${owned ? ' owned' : ''}${state.money < def.price && !owned ? ' cant' : ''}`;
        card.innerHTML = `<b>${def.name}</b><span class="buy-price">${owned ? 'MAX' : fmtMoney(def.price)}</span>` +
          `<span class="buy-desc">${def.desc} · own ${state.util[key]}/${def.max}</span><span class="buy-key">Press ${def.key}</span>`;
        card.addEventListener('click', () => { if (onBuy({ kind: 'util', key })) refresh(); });
        utilGrid.appendChild(card);
      }
      const armor = doc.createElement('button');
      armor.type = 'button';
      armor.className = `buy-card${state.armor > 0 ? ' owned' : ''}${state.money < ARMOR_PRICE && state.armor <= 0 ? ' cant' : ''}`;
      armor.innerHTML = `<b>KEVLAR VEST</b><span class="buy-price">${state.armor > 0 ? 'OWNED' : fmtMoney(ARMOR_PRICE)}</span>` +
        `<span class="buy-desc">50 armor, absorbs half of every hit</span><span class="buy-key">Press 9</span>`;
      armor.addEventListener('click', () => { if (onBuy({ kind: 'armor' })) refresh(); });
      utilGrid.appendChild(armor);
      el('buy-menu').hidden = false;
    },
    closeBuy() { el('buy-menu').hidden = true; },
    buyOpen() { return !el('buy-menu').hidden; },
  };
}
