import { el, $, store, clamp, rand, pick } from './lib/core.js';
import { blip } from './lib/sound.js';
import { register } from './windows.js';

const ROUND = 60;               // seconds
const COMBO_WINDOW = 2.6;       // seconds before a combo lapses
const NAMES = [[16, 'SAINTHOOD'], [12, 'TERMINAL'], [8, 'CURSED'], [5, 'UNHOLY'], [3, 'NASTY'], [2, 'COMBO']];

export function initGame() {
  register({
    id: 'game', title: 'SIGIL_SWARM.exe', icon: 'assets/icons/game.png',
    w: 480, layer: 'winlayer', mobile: 'sheet', className: 'game-win',
    x: vw => Math.max(12, vw / 2 - 300), y: () => 84,
    build: buildGame
  });
}

function buildGame(body, win) {
  const cv = el('canvas.g-canvas', { 'aria-label': 'Sigil Swarm play area', role: 'img' });
  const stage = el('div.g-stage', {}, cv);

  const sScore = el('b', { text: '0' });
  const sBest = el('b', { text: String(store.get('best', 0)) });
  const sCombo = el('b', { text: '×1' });
  const sTime = el('b', { text: '60' });

  const hud = el('div.g-hud', {},
    el('span.g-stat', {}, el('i', { text: 'SCORE' }), sScore),
    el('span.g-stat', {}, el('i', { text: 'BEST' }), sBest),
    el('span.g-stat.g-combo', {}, el('i', { text: 'COMBO' }), sCombo),
    el('span.g-stat.g-time', {}, el('i', { text: 'TIME' }), sTime)
  );

  const overlay = el('div.g-over');
  stage.append(overlay);

  const btnStart = el('button.g-btn.g-btn-hero', { type: 'button' }, 'START');
  const btnPause = el('button.g-btn', { type: 'button', 'aria-label': 'Pause' }, 'PAUSE');
  const btnMute = el('button.g-btn', { type: 'button', 'aria-label': 'Mute sound' }, 'MUTE');
  const bar = el('div.g-bar', {}, btnStart, btnPause, btnMute,
    el('span.g-help', { text: 'move · collect silver · dodge red' }));

  body.append(hud, stage, bar);

  // ------------------------------------------------------------- state
  const ctx = cv.getContext('2d', { alpha: false });
  let dpr = 1, W = 0, H = 0;
  let raf = 0, last = 0;
  let mode = 'ready';                // ready | running | paused | over
  let t = 0, score = 0, combo = 1, comboAt = 0, shake = 0, flash = 0;
  let best = store.get('best', 0);
  const px = { x: 0, y: 0, vx: 0, vy: 0, r: 15 };
  const keys = new Set();
  let usingKeys = false;
  let sigils = [], parts = [], calls = [];
  let spawnAcc = 0, qkAcc = 0;

  const still = () => document.body.classList.contains('reduce-chaos');

  // ------------------------------------------------------------- sizing
  function resize() {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.round(r.width);
    H = Math.round(r.height);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!px.x) { px.x = W / 2; px.y = H / 2; }
    px.x = clamp(px.x, 0, W);
    px.y = clamp(px.y, 0, H);
    if (mode !== 'running') draw(0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  // ------------------------------------------------------------- input
  stage.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && e.buttons === 0 && mode !== 'running') return;
    const r = cv.getBoundingClientRect();
    px.x = e.clientX - r.left;
    px.y = e.clientY - r.top;
    usingKeys = false;
  });
  stage.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect();
    px.x = e.clientX - r.left;
    px.y = e.clientY - r.top;
    usingKeys = false;
    if (mode === 'ready' || mode === 'over') start();
    else if (mode === 'running') tryCollect(true);
  });

  function onKey(e) {
    if (!win.classList.contains('is-front')) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      keys.add(k); usingKeys = true; e.preventDefault();
    }
    if (k === 'p') { e.preventDefault(); togglePause(); }
    if (k === ' ' || k === 'enter') {
      e.preventDefault();
      if (mode === 'ready' || mode === 'over') start();
      else if (mode === 'running') tryCollect(true);
    }
  }
  function offKey(e) { keys.delete(e.key.toLowerCase()); }
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', offKey);

  btnStart.addEventListener('click', () => start());
  btnPause.addEventListener('click', () => togglePause());
  btnMute.addEventListener('click', async () => {
    const { toggleMute, isMuted } = await import('./lib/sound.js');
    toggleMute();
    btnMute.textContent = isMuted() ? 'UNMUTE' : 'MUTE';
    btnMute.setAttribute('aria-label', isMuted() ? 'Unmute sound' : 'Mute sound');
  });

  // ------------------------------------------------------------- flow
  function setOverlay(html) {
    overlay.innerHTML = html;
    overlay.classList.toggle('is-on', !!html);
  }

  function start() {
    t = 0; score = 0; combo = 1; comboAt = 0; shake = 0; flash = 0;
    sigils = []; parts = []; calls = [];
    spawnAcc = 0; qkAcc = 0;
    for (let i = 0; i < 7; i++) spawn('silver');
    spawn('red');
    mode = 'running';
    btnStart.textContent = 'RESTART';
    btnPause.textContent = 'PAUSE';
    setOverlay('');
    blip('boot');
    loop(performance.now());
  }

  function togglePause() {
    if (mode === 'running') {
      mode = 'paused';
      btnPause.textContent = 'RESUME';
      setOverlay('<p class="g-big">PAUSED</p><p class="g-sub">press P or resume</p>');
      cancelAnimationFrame(raf); raf = 0;
    } else if (mode === 'paused') {
      mode = 'running';
      btnPause.textContent = 'PAUSE';
      setOverlay('');
      loop(performance.now());
    }
  }

  function gameOver() {
    mode = 'over';
    cancelAnimationFrame(raf); raf = 0;
    const isBest = score > best;
    if (isBest) { best = score; store.set('best', best); sBest.textContent = String(best); }
    setOverlay(
      `<p class="g-big">${isBest ? 'NEW BEST' : 'ROUND OVER'}</p>` +
      `<p class="g-score">${score}</p>` +
      `<p class="g-sub">${isBest ? 'the swarm remembers' : 'best ' + best}</p>` +
      `<p class="g-sub g-again">press SPACE or tap to go again</p>`
    );
    blip(isBest ? 'bonus' : 'close');
  }

  // ------------------------------------------------------------- entities
  function spawn(kind) {
    const edge = (Math.random() * 4) | 0;
    const m = 24;
    let x, y;
    if (edge === 0) { x = rand(0, W); y = -m; }
    else if (edge === 1) { x = W + m; y = rand(0, H); }
    else if (edge === 2) { x = rand(0, W); y = H + m; }
    else { x = -m; y = rand(0, H); }
    const toC = Math.atan2(H / 2 - y, W / 2 - x) + rand(-0.7, 0.7);
    const ramp = 1 + t / ROUND * 1.15;
    const sp = (kind === 'red' ? rand(34, 62) : kind === 'qk' ? rand(20, 34) : rand(22, 46)) * ramp;
    sigils.push({
      kind, x, y,
      vx: Math.cos(toC) * sp, vy: Math.sin(toC) * sp,
      r: kind === 'qk' ? 18 : kind === 'red' ? 13 : 11,
      a: rand(0, 6.3), spin: rand(-2.4, 2.4),
      life: kind === 'qk' ? 4.2 : 999, born: t
    });
  }

  function burst(x, y, colour, n, spd = 130) {
    if (still()) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.283);
      const s = rand(spd * 0.35, spd);
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.25, 0.6), age: 0, c: colour });
    }
  }

  function callout(text, colour) {
    calls.push({ text, colour, x: px.x, y: px.y - 26, age: 0, life: 0.85 });
  }

  function comboName(c) {
    for (const [n, label] of NAMES) if (c >= n) return label;
    return null;
  }

  function tryCollect(fromTap) {
    const reach = fromTap ? px.r + 12 : px.r;
    for (let i = sigils.length - 1; i >= 0; i--) {
      const s = sigils[i];
      const d = Math.hypot(s.x - px.x, s.y - px.y);
      if (d > reach + s.r) continue;
      if (s.kind === 'red') continue;
      sigils.splice(i, 1);
      if (s.kind === 'qk') {
        score += 250 * combo;
        combo += 2;
        burst(s.x, s.y, '#eef1f7', 26, 220);
        callout('QK +' + 250 * (combo - 2), '#6cff3f');
        blip('bonus');
        flash = still() ? 0 : 0.5;
      } else {
        score += 10 * combo;
        combo++;
        burst(s.x, s.y, '#dfe4ee', 9);
        const nm = comboName(combo);
        if (nm && combo % 1 === 0 && NAMES.some(([n]) => n === combo)) {
          callout(`×${combo} ${nm}`, '#a06fe0');
          blip('combo');
        } else blip('collect');
      }
      comboAt = t;
      spawn('silver');
      if (Math.random() < 0.22) spawn('red');
      return true;
    }
    return false;
  }

  function hit(s, i) {
    sigils.splice(i, 1);
    score = Math.max(0, score - 60);
    combo = 1;
    comboAt = t;
    burst(s.x, s.y, '#ff4a54', 16, 190);
    callout('CORRUPTED', '#ff4a54');
    blip('hurt');
    if (!still()) { shake = 7; flash = 0.35; }
    spawn('red');
  }

  // ------------------------------------------------------------- loop
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (mode !== 'running') return;
    step(dt);
    draw(dt);
  }

  function step(dt) {
    t += dt;
    if (t >= ROUND) { t = ROUND; draw(dt); gameOver(); return; }

    // keyboard steering
    if (usingKeys) {
      const ax = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
      const ay = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
      px.vx = px.vx * 0.86 + ax * 78;
      px.vy = px.vy * 0.86 + ay * 78;
      px.x = clamp(px.x + px.vx * dt, 6, W - 6);
      px.y = clamp(px.y + px.vy * dt, 6, H - 6);
    }

    // spawns ramp up over the round
    const rate = 0.85 + (t / ROUND) * 1.5;
    spawnAcc += dt * rate;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      if (sigils.filter(s => s.kind === 'silver').length < 16) spawn('silver');
      if (Math.random() < 0.4 + t / ROUND * 0.35) spawn('red');
    }
    qkAcc += dt;
    if (qkAcc > 9 && Math.random() < dt * 0.5 && !sigils.some(s => s.kind === 'qk')) {
      qkAcc = 0; spawn('qk');
    }

    // move sigils
    for (let i = sigils.length - 1; i >= 0; i--) {
      const s = sigils[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.a += s.spin * dt;
      if (s.kind === 'red') {
        // corrupted sigils drift toward the player, slowly
        const d = Math.hypot(px.x - s.x, px.y - s.y) || 1;
        s.vx += ((px.x - s.x) / d) * 26 * dt;
        s.vy += ((px.y - s.y) / d) * 26 * dt;
      }
      if (s.kind === 'qk' && t - s.born > s.life) { sigils.splice(i, 1); continue; }
      const m = 60;
      if (s.x < -m || s.x > W + m || s.y < -m || s.y > H + m) { sigils.splice(i, 1); continue; }
      if (s.kind === 'red' && Math.hypot(s.x - px.x, s.y - px.y) < px.r + s.r - 4) hit(s, i);
    }

    tryCollect(false);

    if (combo > 1 && t - comboAt > COMBO_WINDOW) combo = 1;

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.94; p.vy = p.vy * 0.94 + 60 * dt;
      if (p.age >= p.life) parts.splice(i, 1);
    }
    for (let i = calls.length - 1; i >= 0; i--) {
      calls[i].age += dt;
      calls[i].y -= 34 * dt;
      if (calls[i].age >= calls[i].life) calls.splice(i, 1);
    }

    shake = Math.max(0, shake - dt * 22);
    flash = Math.max(0, flash - dt * 2.2);

    sScore.textContent = String(score);
    sCombo.textContent = '×' + combo;
    sTime.textContent = String(Math.ceil(ROUND - t));
    hud.classList.toggle('is-hot', combo >= 5);
    hud.classList.toggle('is-late', ROUND - t <= 10);
  }

  // ------------------------------------------------------------- drawing
  function sigilPath(g, r, k) {
    g.beginPath();
    const pts = k === 'qk' ? 6 : 4;
    for (let i = 0; i < pts * 2; i++) {
      const rr = i % 2 ? r * 0.34 : r;
      const a = (i / (pts * 2)) * Math.PI * 2;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
  }

  function draw() {
    if (!W) return;
    const g = ctx;
    g.save();
    if (shake > 0.2) g.translate(rand(-shake, shake) * 0.5, rand(-shake, shake) * 0.5);

    g.fillStyle = '#0b0b10';
    g.fillRect(-10, -10, W + 20, H + 20);

    // arena grid
    g.strokeStyle = 'rgba(120,126,142,0.10)';
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x < W; x += 34) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); }
    for (let y = 0; y < H; y += 34) { g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); }
    g.stroke();

    // sigils
    for (const s of sigils) {
      g.save();
      g.translate(s.x, s.y);
      g.rotate(s.a);
      if (s.kind === 'red') {
        g.fillStyle = '#b0121a';
        g.strokeStyle = '#ff4a54';
      } else if (s.kind === 'qk') {
        const life = 1 - (t - s.born) / s.life;
        g.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 7));
        const grd = g.createLinearGradient(-s.r, -s.r, s.r, s.r);
        grd.addColorStop(0, '#ffffff');
        grd.addColorStop(0.5, '#6cff3f');
        grd.addColorStop(1, '#8f95a4');
        g.fillStyle = grd;
        g.strokeStyle = '#ffffff';
        g.globalAlpha *= clamp(life * 3, 0, 1);
      } else {
        const grd = g.createLinearGradient(-s.r, -s.r, s.r, s.r);
        grd.addColorStop(0, '#ffffff');
        grd.addColorStop(0.45, '#8f95a4');
        grd.addColorStop(1, '#dfe4ee');
        g.fillStyle = grd;
        g.strokeStyle = '#0a0a0d';
      }
      g.lineWidth = 1.4;
      sigilPath(g, s.r, s.kind);
      g.fill();
      g.stroke();
      g.restore();
    }

    // particles
    for (const p of parts) {
      const k = 1 - p.age / p.life;
      g.globalAlpha = k;
      g.fillStyle = p.c;
      g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    g.globalAlpha = 1;

    // player crosshair
    g.save();
    g.translate(px.x, px.y);
    g.strokeStyle = combo >= 5 ? '#a06fe0' : '#eef1f7';
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(0, 0, px.r, 0, 6.2832);
    g.stroke();
    g.beginPath();
    g.moveTo(-px.r - 6, 0); g.lineTo(-4, 0);
    g.moveTo(px.r + 6, 0); g.lineTo(4, 0);
    g.moveTo(0, -px.r - 6); g.lineTo(0, -4);
    g.moveTo(0, px.r + 6); g.lineTo(0, 4);
    g.stroke();
    g.fillStyle = '#ff4a54';
    g.fillRect(-1.5, -1.5, 3, 3);
    g.restore();

    // callouts
    g.textAlign = 'center';
    g.font = '700 13px Silkscreen, monospace';
    for (const c of calls) {
      g.globalAlpha = 1 - c.age / c.life;
      g.fillStyle = c.colour;
      g.fillText(c.text, c.x, c.y);
    }
    g.globalAlpha = 1;

    if (flash > 0.01) {
      g.fillStyle = `rgba(255,74,84,${flash * 0.20})`;
      g.fillRect(0, 0, W, H);
    }
    g.restore();
  }

  // ------------------------------------------------------------- lifecycle
  function onVis() { if (document.hidden && mode === 'running') togglePause(); }
  document.addEventListener('visibilitychange', onVis);

  setOverlay('<p class="g-big">SIGIL SWARM</p>' +
    '<p class="g-sub">collect silver · avoid red · catch QK</p>' +
    '<p class="g-sub g-again">press START</p>');
  requestAnimationFrame(resize);

  return {
    onOpen() { requestAnimationFrame(resize); },
    onResize: resize,
    onShow: resize,
    onClose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keyup', offKey);
      document.removeEventListener('visibilitychange', onVis);
    }
  };
}
