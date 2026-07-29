import { el, $, store, clamp, mmss, emit, on, isNarrow } from './lib/core.js';
import { audioCtx, masterNode, blip, isMuted } from './lib/sound.js';
import { TRACKS } from './config/content.js';
import { register, openWin, isOpen, closeWin } from './windows.js';

const audio = new Audio();
audio.preload = 'metadata';
audio.volume = clamp(store.get('volume', 0.7), 0, 1);

let index = clamp(store.get('track', 0), 0, TRACKS.length - 1);
let shuffle = store.get('shuffle', false);
let repeat = store.get('repeat', 'all');   // 'off' | 'all' | 'one'
let analyser = null, dataArr = null, wired = false;
let ui = {};
let visRaf = 0;
let idlePhase = 0;

// ---------------------------------------------------------------- audio graph
function wireGraph() {
  if (wired) return;
  const ctx = audioCtx();
  if (!ctx) return;
  try {
    const src = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.72;
    dataArr = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser);
    analyser.connect(masterNode());
    wired = true;
  } catch { analyser = null; }
}

// ---------------------------------------------------------------- transport
export function load(i, autoplay = false) {
  index = (i + TRACKS.length) % TRACKS.length;
  store.set('track', index);
  audio.src = TRACKS[index].src;
  paintTrack();
  if (autoplay) play();
}

export function play() {
  wireGraph();
  audio.play().then(() => {
    paintState();
    startVis();
  }).catch(() => paintState());
}

export function pause() { audio.pause(); paintState(); }
export function toggle() { audio.paused ? play() : pause(); }

export function next(auto = false) {
  if (shuffle && TRACKS.length > 1) {
    let n = index;
    while (n === index) n = (Math.random() * TRACKS.length) | 0;
    load(n, true);
  } else if (index === TRACKS.length - 1 && repeat === 'off' && auto) {
    pause();
  } else {
    load(index + 1, !auto || repeat !== 'off' || index < TRACKS.length - 1);
  }
}

export function prev() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  load(index - 1, !audio.paused);
}

audio.addEventListener('ended', () => {
  if (repeat === 'one') { audio.currentTime = 0; play(); }
  else next(true);
});
audio.addEventListener('timeupdate', paintTime);
audio.addEventListener('loadedmetadata', paintTime);
audio.addEventListener('play', paintState);
audio.addEventListener('pause', paintState);
audio.addEventListener('error', () => {
  if (ui.state) ui.state.textContent = 'FILE MISSING';
});

// ---------------------------------------------------------------- painting
function paintTrack() {
  const t = TRACKS[index];
  if (!t) return;
  if (ui.marquee) {
    const label = `${String(index + 1).padStart(2, '0')}. ${t.title} — ${t.artist}`;
    ui.marquee.textContent = label + '   ///   ';
    ui.marquee.parentElement.classList.toggle('is-long', label.length > 22);
  }
  $$all('.pl-row').forEach((row, i) => row.classList.toggle('is-current', i === index));
  document.title = audio.paused
    ? 'QUINN KERRIGAN'
    : `▶ ${t.title} — QUINN KERRIGAN`;
}

function $$all(sel) { return [...document.querySelectorAll(sel)]; }

function paintState() {
  const playing = !audio.paused && !audio.ended;
  if (ui.play) {
    ui.play.classList.toggle('is-playing', playing);
    ui.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    ui.play.querySelector('.glyph').textContent = playing ? '❙❙' : '▶';
  }
  if (ui.state) ui.state.textContent = playing ? 'PLAYING' : (audio.currentTime > 0 ? 'PAUSED' : 'STOPPED');
  document.body.classList.toggle('is-playing', playing);
  paintTrack();
  if (playing) startVis();
}

function paintTime() {
  if (!ui.time) return;
  ui.time.textContent = mmss(audio.currentTime);
  ui.total.textContent = mmss(audio.duration);
  if (ui.seek && !ui.seek.matches(':active') && audio.duration) {
    ui.seek.value = String((audio.currentTime / audio.duration) * 1000);
    ui.seek.setAttribute('aria-valuetext', `${mmss(audio.currentTime)} of ${mmss(audio.duration)}`);
  }
}

// ---------------------------------------------------------------- visualizer
function startVis() {
  if (visRaf) return;
  const loop = () => {
    visRaf = requestAnimationFrame(loop);
    drawVis();
  };
  visRaf = requestAnimationFrame(loop);
}
function stopVis() { cancelAnimationFrame(visRaf); visRaf = 0; }

function drawVis() {
  const cv = ui.vis;
  if (!cv || !cv.isConnected) { stopVis(); return; }
  const ctx = cv.getContext('2d');
  const w = cv.width, h = cv.height;
  const still = document.body.classList.contains('reduce-chaos');
  ctx.clearRect(0, 0, w, h);

  const bars = 24;
  const bw = w / bars;
  const playing = !audio.paused;
  if (analyser && playing) analyser.getByteFrequencyData(dataArr);
  idlePhase += still ? 0.008 : 0.045;

  for (let i = 0; i < bars; i++) {
    let v;
    if (analyser && playing) {
      v = dataArr[Math.floor(i * dataArr.length / bars / 1.7)] / 255;
    } else if (playing) {
      v = 0.25 + 0.22 * Math.abs(Math.sin(idlePhase * 1.6 + i * 0.5));
    } else {
      v = 0.06 + 0.05 * Math.abs(Math.sin(idlePhase + i * 0.7));
    }
    v = Math.pow(clamp(v, 0, 1), 0.85);
    const bh = Math.max(1, v * (h - 3));
    const x = i * bw;
    const g = ctx.createLinearGradient(0, h, 0, h - bh);
    g.addColorStop(0, '#3a3d4a');
    g.addColorStop(0.45, '#b9bfcb');
    g.addColorStop(0.8, '#eef1f7');
    g.addColorStop(1, v > 0.72 ? '#ff4a54' : '#ffffff');
    ctx.fillStyle = g;
    ctx.fillRect(x + 1, h - bh, bw - 2, bh);
  }
  if (!playing && !still) return;
  if (!playing) stopVis();
}

// ---------------------------------------------------------------- markup
const WING = `<svg viewBox="0 0 40 150" aria-hidden="true" focusable="false">
<defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#eef1f7"/><stop offset="35%" stop-color="#565b6b"/>
<stop offset="55%" stop-color="#dfe4ee"/><stop offset="100%" stop-color="#2a2d38"/>
</linearGradient></defs>
<g fill="url(#wg)" stroke="#0a0a0d" stroke-width="0.7">
<path d="M38 6 C 22 20, 12 44, 8 74 C 14 50, 24 30, 38 16 Z"/>
<path d="M38 30 C 24 44, 15 64, 11 92 C 17 70, 26 52, 38 40 Z"/>
<path d="M38 56 C 27 68, 19 86, 15 110 C 21 90, 29 74, 38 64 Z"/>
<path d="M38 82 C 30 92, 24 106, 21 126 C 26 110, 32 98, 38 90 Z"/>
<path d="M38 106 C 33 114, 29 124, 27 140 C 31 128, 35 118, 38 112 Z"/>
</g></svg>`;

function buildAmp(body, win) {
  win.classList.add('amp-win');

  const vis = el('canvas.amp-vis', { width: 152, height: 34, 'aria-hidden': 'true' });
  const time = el('span.amp-time', { text: '00:00' });
  const total = el('span.amp-total', { text: '00:00' });
  const state = el('span.amp-state', { text: 'STOPPED' });
  const marquee = el('span.amp-marquee');

  const seek = el('input.amp-seek', {
    type: 'range', min: '0', max: '1000', value: '0', step: '1',
    'aria-label': 'Seek', 'data-no-drag': true
  });
  seek.addEventListener('input', () => {
    if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
  });

  const vol = el('input.amp-vol', {
    type: 'range', min: '0', max: '100', value: String(Math.round(audio.volume * 100)),
    'aria-label': 'Volume', 'data-no-drag': true
  });
  vol.addEventListener('input', () => {
    audio.volume = vol.value / 100;
    store.set('volume', audio.volume);
  });

  const tbtn = (cls, label, glyph, fn) => el('button.amp-btn.' + cls, {
    type: 'button', 'aria-label': label, title: label, 'data-no-drag': true,
    onclick: () => { fn(); blip('tick'); }
  }, el('span.glyph', { text: glyph }));

  const playBtn = tbtn('amp-play', 'Play', '▶', toggle);
  const shufBtn = tbtn('amp-tog', 'Shuffle', 'SHUF', () => {
    shuffle = !shuffle; store.set('shuffle', shuffle); paintToggles();
  });
  const repBtn = tbtn('amp-tog', 'Repeat', 'REP', () => {
    repeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
    store.set('repeat', repeat); paintToggles();
  });

  function paintToggles() {
    shufBtn.classList.toggle('is-on', shuffle);
    shufBtn.setAttribute('aria-pressed', String(shuffle));
    repBtn.classList.toggle('is-on', repeat !== 'off');
    repBtn.querySelector('.glyph').textContent = repeat === 'one' ? 'REP1' : 'REP';
    repBtn.setAttribute('aria-label', `Repeat: ${repeat}`);
  }

  const core = el('div.amp-core', {},
    el('div.amp-lcd', {},
      el('div.amp-lcd-top', {},
        time, el('span.amp-sep', { text: '/' }), total,
        el('span.amp-kbps', { text: '128' }), el('span.amp-khz', { text: '32K' })
      ),
      vis,
      el('div.amp-ticker', {}, marquee),
      el('div.amp-lcd-bot', {}, el('span.amp-led'), state)
    ),
    seek,
    el('div.amp-row', {},
      tbtn('', 'Previous track', '❙◀', prev),
      playBtn,
      tbtn('', 'Stop', '■', () => { pause(); audio.currentTime = 0; paintTime(); }),
      tbtn('', 'Next track', '▶❙', () => next(false)),
      shufBtn, repBtn,
      el('div.amp-volwrap', {}, el('span.amp-vol-ico', { text: '◧', 'aria-hidden': 'true' }), vol),
      el('button.amp-btn.amp-pl', {
        type: 'button', 'aria-label': 'Toggle playlist', title: 'Playlist', 'data-no-drag': true,
        onclick: () => { isOpen('playlist') ? closeWin('playlist') : openWin('playlist'); }
      }, el('span.glyph', { text: 'PL' }))
    )
  );

  body.append(
    el('div.amp', {},
      el('div.amp-wing.amp-wing-l', { html: WING, 'aria-hidden': 'true' }),
      core,
      el('div.amp-wing.amp-wing-r', { html: WING, 'aria-hidden': 'true' })
    )
  );

  ui = { vis, time, total, state, marquee, seek, vol, play: playBtn };
  paintToggles();
  paintTrack();
  paintState();
  paintTime();
  startVis();

  return {
    onClose() { ui = {}; stopVis(); },
    onResize() { }
  };
}

function buildPlaylist(body) {
  const list = el('ol.pl');
  TRACKS.forEach((t, i) => {
    list.append(el('li', {},
      el('button.pl-row', {
        type: 'button',
        onclick: () => { load(i, true); }
      },
        el('span.pl-n', { text: String(i + 1).padStart(2, '0') }),
        el('span.pl-t', { text: t.title }),
        el('span.pl-a', { text: t.artist })
      )
    ));
  });
  body.append(list, el('p.pl-note', {
    text: 'placeholder instrumentals. swap them in js/config/content.js'
  }));
  paintTrack();
  return {};
}

// ---------------------------------------------------------------- public
export function initPlayer() {
  register({
    id: 'amp', title: 'QK-AMP', icon: 'assets/icons/amp.png',
    w: 300, layer: 'winlayer', mobile: 'dock', persist: true, taskbar: false,
    x: vw => vw - 336, y: vh => vh - 250,
    build: buildAmp
  });
  register({
    id: 'playlist', title: 'PLAYLIST.QK', icon: 'assets/icons/amp.png',
    w: 268, layer: 'winlayer', mobile: 'sheet',
    x: vw => vw - 336, y: vh => vh - 470,
    build: buildPlaylist
  });
  load(index, false);
  store.set('volume', audio.volume);   // make the preference durable from run one
  openWin('amp', { silent: true });

  // media keys / space when nothing focusable is active
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); toggle(); }
  });
}

on('mute', () => { if (ui.state) paintState(); });

export const Player = { play, pause, toggle, next, prev, load, audio, get index() { return index; } };
