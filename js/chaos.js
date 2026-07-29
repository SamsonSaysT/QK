import { $, $$, store, on, emit, motionQuery } from './lib/core.js';
import { chaosDebris } from './decor.js';
import { toast } from './secrets.js';
import { blip } from './lib/sound.js';

let reduced = store.get('reduceChaos', null);
let maximum = false;

/** Swap every GIF for its frozen first frame, or back again. */
function freezeGifs(freeze) {
  $$('[data-gif]').forEach(img => {
    const id = img.dataset.gif;
    const want = freeze ? `assets/gifs/${id}-still.png` : `assets/gifs/${id}.gif`;
    if (!img.src.endsWith(want)) img.src = want;
  });
}

export function isReduced() { return reduced; }

export function setReduced(next, { announce = true } = {}) {
  reduced = !!next;
  store.set('reduceChaos', reduced);
  document.body.classList.toggle('reduce-chaos', reduced);
  freezeGifs(reduced);
  if (reduced && maximum) setMaximum(false, { announce: false });
  const btn = $('#chaos-toggle');
  if (btn) {
    btn.setAttribute('aria-pressed', String(reduced));
    btn.querySelector('span').textContent = reduced ? 'CHAOS OFF' : 'REDUCE CHAOS';
  }
  if (announce) toast(reduced ? 'CHAOS REDUCED' : 'CHAOS RESTORED',
    reduced ? 'motion paused, shrine intact' : 'everything moves again');
  return reduced;
}

export function toggleReduced() { blip('tick'); return setReduced(!reduced); }

export function setMaximum(next, { announce = true } = {}) {
  if (next && reduced) {
    if (announce) toast('CHAOS IS REDUCED', 'turn it back on first');
    return false;
  }
  maximum = !!next;
  document.body.classList.toggle('max-chaos', maximum);
  chaosDebris(maximum);
  document.dispatchEvent(new Event('decor:refresh'));
  if (announce) toast(maximum ? 'MAXIMUM CHAOS' : 'CHAOS NORMALISED',
    maximum ? 'you asked for it' : 'back to merely a lot');
  return maximum;
}

export function initChaos() {
  // First visit: follow the OS preference. After that, the button wins.
  if (reduced === null) reduced = motionQuery.matches;
  setReduced(reduced, { announce: false });

  motionQuery.addEventListener?.('change', e => {
    if (store.get('reduceChaos', null) === null) setReduced(e.matches, { announce: false });
  });

  $('#chaos-toggle')?.addEventListener('click', () => toggleReduced());
  on('chaos:max-toggle', () => setMaximum(!maximum));

  // Newly added GIFs must respect the current setting too.
  new MutationObserver(muts => {
    if (!reduced) return;
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const imgs = node.matches?.('[data-gif]') ? [node] : [...(node.querySelectorAll?.('[data-gif]') || [])];
        imgs.forEach(img => {
          const id = img.dataset.gif;
          img.src = `assets/gifs/${id}-still.png`;
        });
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}
