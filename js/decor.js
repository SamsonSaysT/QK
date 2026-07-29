import { el, $, rand, pick, clamp, isNarrow, motionQuery, emit } from './lib/core.js';
import { GIFS } from './config/content.js';

/** Every animated GIF on the page goes through here so REDUCE CHAOS can freeze it. */
export function gif(id, w, attrs = {}) {
  const meta = GIFS.find(g => g.id === id) || { w: w || 32, alt: id.replace(/-/g, ' ') };
  const width = w || meta.w;
  return el('img.gifobj', {
    src: `assets/gifs/${id}.gif`,
    'data-gif': id,
    alt: attrs.decorative === false ? meta.alt : '',
    width,
    loading: 'lazy',
    decoding: 'async',
    ...attrs
  });
}

// Placement zones as [xMin, xMax, yMin, yMax] in viewport percent.
// Deliberately avoids the middle band (wordmark) and the bottom strip (taskbar).
const ZONES = [
  [3, 16, 8, 30], [4, 18, 34, 62], [20, 34, 6, 20], [22, 38, 62, 78],
  [62, 78, 8, 24], [80, 94, 14, 40], [66, 82, 58, 76], [84, 95, 46, 70],
  [44, 58, 4, 14], [40, 56, 78, 88]
];

const SECRET_GIFS = ['bat-flap', 'cd-spin'];
const ROAM = ['skull-spin', 'cross-spin', 'bat-flap', 'heart-broken', 'skeleton-dance',
  'star-chrome', 'flame', 'new-badge', 'cd-spin', 'mail', 'eye-blink'];

export function scatterDecor() {
  const layer = $('#decor');
  if (!layer) return;
  layer.replaceChildren();

  const zones = [...ZONES].sort(() => Math.random() - 0.5);
  const count = isNarrow() ? 6 : 9;

  // bat and disc carry secrets, so they are never dropped from a smaller scatter
  const chosen = ROAM.slice(0, count);
  for (const must of SECRET_GIFS) {
    if (!chosen.includes(must)) chosen[chosen.length - 1] = must;
  }

  chosen.forEach((id, i) => {
    const z = zones[i % zones.length];
    const img = gif(id, null, { class: 'gifobj sticker' });
    img.style.left = rand(z[0], z[1]) + '%';
    img.style.top = rand(z[2], z[3]) + '%';
    img.style.setProperty('--drift-x', rand(-14, 14) + 'px');
    img.style.setProperty('--drift-y', rand(-16, 16) + 'px');
    img.style.setProperty('--drift-t', rand(9, 22) + 's');
    img.style.setProperty('--drift-d', rand(-8, 0) + 's');
    img.style.setProperty('--tilt', rand(-9, 9) + 'deg');
    img.dataset.depth = String(rand(0.2, 1).toFixed(2));

    // two of them are secrets, so they must be clickable
    if (id === 'bat-flap' || id === 'cd-spin') {
      img.classList.add('is-live');
      img.setAttribute('role', 'button');
      img.setAttribute('tabindex', '0');
      img.setAttribute('alt', id === 'bat-flap' ? 'A small bat' : 'A spinning disc');
      img.setAttribute('aria-label', id === 'bat-flap' ? 'A small bat' : 'A spinning disc');
      const fire = () => emit('secret:poke', { which: id === 'bat-flap' ? 'bat' : 'disc' });
      img.addEventListener('click', fire);
      img.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
      });
    }
    layer.append(img);
  });
}

/** Extra debris for MAXIMUM CHAOS. Removed when it's switched off. */
export function chaosDebris(on) {
  const layer = $('#decor');
  if (!layer) return;
  layer.querySelectorAll('.is-debris').forEach(n => n.remove());
  if (!on) return;
  for (let i = 0; i < 10; i++) {
    const img = gif(pick(ROAM), null, { class: 'gifobj sticker is-debris' });
    img.style.left = rand(2, 95) + '%';
    img.style.top = rand(4, 84) + '%';
    img.style.setProperty('--drift-x', rand(-40, 40) + 'px');
    img.style.setProperty('--drift-y', rand(-40, 40) + 'px');
    img.style.setProperty('--drift-t', rand(4, 9) + 's');
    img.style.setProperty('--tilt', rand(-20, 20) + 'deg');
    img.dataset.depth = String(rand(0.4, 1.4).toFixed(2));
    layer.append(img);
  }
}

/**
 * Cursor parallax. Uses a single rAF and writes transforms only — no layout.
 * Switched off entirely on touch layouts and under reduced motion.
 */
export function initParallax() {
  if (isNarrow() || motionQuery.matches) return;
  const targets = () => [...document.querySelectorAll('[data-depth]')];
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, cached = [];

  function recache() { cached = targets(); }
  recache();

  window.addEventListener('pointermove', e => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  function tick() {
    raf = 0;
    cx += (tx - cx) * 0.07;
    cy += (ty - cy) * 0.07;
    for (const node of cached) {
      const d = parseFloat(node.dataset.depth) || 0.4;
      node.style.setProperty('--par-x', (-cx * 16 * d).toFixed(2) + 'px');
      node.style.setProperty('--par-y', (-cy * 14 * d).toFixed(2) + 'px');
    }
    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick);
  }

  document.addEventListener('decor:refresh', recache);
  return recache;
}

/** Pause every decorative animation while the tab is in the background. */
export function initVisibilityGuard() {
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('is-hidden-tab', document.hidden);
  });
}
