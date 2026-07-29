import { el, $, store, on, emit, motionQuery } from './lib/core.js';
import { blip } from './lib/sound.js';
import { openWin } from './windows.js';
import { SECRETS, KONAMI } from './config/secrets.js';
import { BAT_LINE } from './config/content.js';

let unlocked = new Set(store.get('secrets', []));

export const found = id => unlocked.has(id);
export const foundCount = () => unlocked.size;

export function resetSecrets() {
  unlocked = new Set();
  store.set('secrets', []);
  setNight(false);
  paintCounter();
}

function paintCounter() {
  const n = $('#secret-count');
  if (!n) return;
  n.textContent = `${unlocked.size}/${SECRETS.length}`;
  n.parentElement?.classList.toggle('is-complete', unlocked.size === SECRETS.length);
}

function unlock(id) {
  const def = SECRETS.find(s => s.id === id);
  if (!def || unlocked.has(id)) return false;
  unlocked.add(id);
  store.set('secrets', [...unlocked]);
  paintCounter();
  toast(`SECRET ${unlocked.size}/${SECRETS.length} — ${def.name}`, def.found);
  blip('bonus');
  if (unlocked.size === SECRETS.length) {
    setTimeout(() => toast('ALL SEVEN', 'nothing left to find. go outside.'), 2400);
  }
  return true;
}

// ---------------------------------------------------------------- toasts
export function toast(title, sub = '') {
  const host = $('#toasts');
  if (!host) return;
  const t = el('div.toast', { role: 'status' },
    el('b', { text: title }),
    sub ? el('span', { text: sub }) : null
  );
  host.append(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  setTimeout(() => {
    t.classList.remove('is-in');
    setTimeout(() => t.remove(), 400);
  }, 3600);
}

// ---------------------------------------------------------------- night mode
let night = false;
export function setNight(on) {
  night = !!on;
  document.body.classList.toggle('night-666', night);
  $('#night-flag')?.toggleAttribute('hidden', !night);
}
export function toggleNight() {
  setNight(!night);
  if (night) unlock('night');
  return night;
}

// ---------------------------------------------------------------- wiring
export function initSecrets() {
  paintCounter();

  // 1 — six taps on the floating night portrait
  let haloTaps = 0, haloTimer = 0;
  const halo = $('#halo-portrait');
  if (halo) {
    const tap = () => {
      haloTaps++;
      clearTimeout(haloTimer);
      haloTimer = setTimeout(() => { haloTaps = 0; }, 2200);
      halo.classList.remove('is-pulsed');
      void halo.offsetWidth;
      halo.classList.add('is-pulsed');
      blip('tick');
      if (haloTaps >= 6) {
        haloTaps = 0;
        toggleNight();
        if (!night) toast('NIGHT MODE 666', 'off');
      }
    };
    halo.addEventListener('click', tap);
    halo.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); }
    });
  }

  // 2 — typing his name anywhere
  let typed = '';
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toUpperCase()).slice(-5);
    if (typed === 'QUINN') {
      typed = '';
      unlock('terminal');
      import('./terminal.js').then(m => m.openTerminal());
    }
  });

  // 3 + 6 — the bat and the disc
  on('secret:poke', e => {
    if (e.detail.which === 'bat') {
      unlock('bat');
      toast('THE BAT', BAT_LINE);
      blip('tick');
    } else {
      unlock('disc');
      toast('THE DISC', 'still spinning after all these years');
      blip('tick');
    }
  });

  // 4 — the skull in the taskbar
  $('#skull-key')?.addEventListener('click', () => {
    unlock('shrine');
    openWin('shrine');
  });

  // 5 — dragging one window across another
  on('bleed', () => {
    if (!unlock('glitch')) return;
    toast('WINDOW BLEED', 'they were not meant to touch');
  });

  // 7 — konami
  let seq = [];
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    seq.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    seq = seq.slice(-KONAMI.length);
    if (seq.join() === KONAMI.join()) {
      seq = [];
      unlock('chaos');
      emit('chaos:max-toggle');
    }
  });

  on('secret:night', () => toggleNight());
}
