import { store, emit } from './core.js';

let ctx = null;
let master = null;
let muted = store.get('muted', false);

/** Created lazily — browsers only allow this after a real user gesture. */
export function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function masterNode() { audioCtx(); return master; }
export function isMuted() { return muted; }

export function setMuted(next) {
  muted = !!next;
  store.set('muted', muted);
  if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
  document.body.classList.toggle('is-muted', muted);
  emit('mute', { muted });
  return muted;
}

export function toggleMute() { return setMuted(!muted); }

/**
 * Short synthesised interface sound. No files, no latency.
 * kind: tick | collect | combo | bonus | hurt | open | close | deny | boot
 */
export function blip(kind = 'tick') {
  if (muted) return;
  const c = audioCtx();
  if (!c) return;
  const t = c.currentTime;
  const g = c.createGain();
  g.connect(master);

  const tone = (freq, to, dur, type = 'square', vol = 0.14) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.02);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  };

  const noise = (dur, vol = 0.1, hp = 900) => {
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const ng = c.createGain();
    ng.gain.value = vol;
    src.connect(f).connect(ng).connect(master);
    src.start(t);
  };

  switch (kind) {
    case 'collect': tone(880, 1560, 0.09, 'square', 0.10); break;
    case 'combo':   tone(1240, 1900, 0.12, 'triangle', 0.11); break;
    case 'bonus':   tone(520, 1760, 0.30, 'sawtooth', 0.11); noise(0.18, 0.05, 2200); break;
    case 'hurt':    tone(220, 62, 0.26, 'sawtooth', 0.13); noise(0.16, 0.09, 300); break;
    case 'open':    tone(320, 640, 0.10, 'square', 0.07); break;
    case 'close':   tone(560, 200, 0.10, 'square', 0.07); break;
    case 'deny':    tone(180, 120, 0.16, 'square', 0.09); break;
    case 'boot':    tone(110, 440, 0.55, 'sawtooth', 0.07); break;
    default:        tone(1400, 1400, 0.035, 'square', 0.05);
  }
}

document.body?.classList.toggle('is-muted', muted);
