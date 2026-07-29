import { el, $, store, clamp, isNarrow, emit, on } from './lib/core.js';
import { draggable } from './lib/drag.js';
import { blip } from './lib/sound.js';

const Z_BASE = 60;
let zTop = Z_BASE;

const defs = new Map();
const live = new Map();

/**
 * def = {
 *   id, title, icon, w, h, x, y,
 *   layer: 'collage' | 'winlayer'      where it lives on desktop
 *   mobile: 'inline' | 'sheet' | 'dock' | 'hidden'
 *   taskbar: bool, shadeable: bool, persist: bool
 *   build(body, win)  -> { onOpen, onClose, onShow, onHide }
 * }
 */
export function register(def) {
  defs.set(def.id, {
    layer: 'winlayer', mobile: 'sheet', taskbar: true, shadeable: true, ...def
  });
}

export function isOpen(id) { return live.has(id); }
export function get(id) { return live.get(id); }

export function openWin(id, { silent = false } = {}) {
  const def = defs.get(id);
  if (!def) return null;

  if (live.has(id)) { focusWin(id); return live.get(id); }

  // phones show one app sheet at a time
  if (isNarrow() && def.mobile === 'sheet') {
    for (const [otherId, w] of live) {
      if (defs.get(otherId)?.mobile === 'sheet') closeWin(otherId, { silent: true });
    }
  }

  const win = el('section.win', {
    id: 'win-' + id,
    role: 'dialog',
    'aria-label': def.title,
    'data-win': id,
    tabindex: '-1',
    class: 'win' + (def.className ? ' ' + def.className : '')
  });

  const bar = el('header.win-bar', {},
    def.icon ? el('img.win-ico', { src: def.icon, alt: '', width: 16, height: 16 }) : null,
    el('h2.win-title', { text: def.title }),
    el('div.win-btns', { 'data-no-drag': true },
      def.shadeable ? el('button.win-btn', {
        type: 'button', 'data-act': 'shade', 'aria-label': 'Roll up ' + def.title, title: 'Roll up'
      }, el('span.win-btn-g', { text: '–' })) : null,
      el('button.win-btn', {
        type: 'button', 'data-act': 'close', 'aria-label': 'Close ' + def.title, title: 'Close'
      }, el('span.win-btn-g', { text: '×' }))
    )
  );

  const body = el('div.win-body');
  win.append(bar, body);

  // ---- geometry
  const saved = def.persist ? store.get('pos.' + id) : null;
  const w = def.w || 340;
  const h = def.h || 260;
  win.style.width = w + 'px';
  if (def.h) win.style.setProperty('--win-h', h + 'px');

  const vw = window.innerWidth, vh = window.innerHeight;
  let x = saved?.x ?? (typeof def.x === 'function' ? def.x(vw, vh) : def.x ?? 120);
  let y = saved?.y ?? (typeof def.y === 'function' ? def.y(vw, vh) : def.y ?? 90);
  win.style.left = clamp(x, 4, Math.max(4, vw - 90)) + 'px';
  win.style.top = clamp(y, 4, Math.max(4, vh - 90)) + 'px';

  const host = def.layer === 'collage' ? $('#collage') : $('#winlayer');
  host.append(win);

  const api = def.build?.(body, win) || {};
  const rec = { id, def, win, bar, body, api, shaded: false };
  live.set(id, rec);

  // ---- interactions
  bar.addEventListener('pointerdown', () => focusWin(id));
  win.addEventListener('pointerdown', () => focusWin(id), true);

  bar.addEventListener('click', e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'close') closeWin(id);
    if (act === 'shade') shadeWin(id);
  });
  bar.addEventListener('dblclick', e => {
    if (!e.target.closest('[data-no-drag]') && def.shadeable) shadeWin(id);
  });

  draggable(win, bar, {
    onStart: () => focusWin(id),
    onMove: () => checkBleed(win),
    onEnd: () => {
      if (def.persist) {
        store.set('pos.' + id, { x: parseInt(win.style.left, 10), y: parseInt(win.style.top, 10) });
      }
    }
  });

  if (isNarrow() && def.mobile === 'sheet') {
    win.classList.add('is-sheet');
    document.body.classList.add('sheet-open');
  }

  addTaskButton(rec);
  focusWin(id);
  win.classList.add('is-entering');
  setTimeout(() => win.classList.remove('is-entering'), 320);
  if (!silent) blip('open');
  api.onOpen?.();
  emit('win:open', { id });
  return rec;
}

export function closeWin(id, { silent = false } = {}) {
  const rec = live.get(id);
  if (!rec) return;
  rec.api.onClose?.();
  rec.win.remove();
  live.delete(id);
  removeTaskButton(id);
  if (![...live.keys()].some(k => defs.get(k)?.mobile === 'sheet' && isNarrow())) {
    document.body.classList.remove('sheet-open');
  }
  if (!silent) blip('close');
  emit('win:close', { id });
}

export function toggleWin(id) {
  if (live.has(id)) {
    const rec = live.get(id);
    // clicking the taskbar button of the front window rolls it up instead
    if (rec.win.classList.contains('is-front') && !rec.shaded && rec.def.shadeable) shadeWin(id);
    else if (rec.shaded) { shadeWin(id, false); focusWin(id); }
    else focusWin(id);
  } else openWin(id);
}

export function focusWin(id) {
  const rec = live.get(id);
  if (!rec) return;
  for (const r of live.values()) r.win.classList.remove('is-front');
  rec.win.classList.add('is-front');
  rec.win.style.zIndex = ++zTop;
  $('#taskbar')?.querySelectorAll('.task-btn').forEach(b =>
    b.classList.toggle('is-front', b.dataset.task === id));
  emit('win:focus', { id });
}

export function shadeWin(id, force) {
  const rec = live.get(id);
  if (!rec) return;
  rec.shaded = force === undefined ? !rec.shaded : force;
  rec.win.classList.toggle('is-shaded', rec.shaded);
  rec.win.querySelector('[data-act="shade"] .win-btn-g')?.replaceChildren(
    document.createTextNode(rec.shaded ? '+' : '–'));
  blip('tick');
  rec.shaded ? rec.api.onHide?.() : rec.api.onShow?.();
}

export function frontWindow() {
  return [...live.values()].find(r => r.win.classList.contains('is-front'));
}

// --------------------------------------------------------------- taskbar
function addTaskButton(rec) {
  if (!rec.def.taskbar) return;
  const strip = $('#task-strip');
  if (!strip) return;
  const btn = el('button.task-btn', {
    type: 'button', 'data-task': rec.id, title: rec.def.title,
    onclick: () => toggleWin(rec.id)
  },
    rec.def.icon ? el('img', { src: rec.def.icon, alt: '', width: 14, height: 14 }) : null,
    el('span', { text: rec.def.title })
  );
  strip.append(btn);
}

function removeTaskButton(id) {
  $('#task-strip')?.querySelector(`[data-task="${id}"]`)?.remove();
}

// --------------------------------------------- "windows touched" secret
let bleedArmed = true;
function checkBleed(win) {
  if (!bleedArmed) return;
  const a = win.getBoundingClientRect();
  for (const rec of live.values()) {
    if (rec.win === win) continue;
    const b = rec.win.getBoundingClientRect();
    const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ox > 40 && oy > 40) {
      bleedArmed = false;
      setTimeout(() => { bleedArmed = true; }, 4000);
      emit('bleed', { a: win.dataset.win, b: rec.id });
      win.classList.add('is-bleeding');
      rec.win.classList.add('is-bleeding');
      setTimeout(() => {
        win.classList.remove('is-bleeding');
        rec.win.classList.remove('is-bleeding');
      }, 460);
      return;
    }
  }
}

// --------------------------------------------------------------- keyboard
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const front = frontWindow();
  if (front) { closeWin(front.id); e.preventDefault(); }
});

// keep windows on screen when the viewport changes
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const narrow = isNarrow();
    for (const rec of live.values()) {
      rec.win.classList.toggle('is-sheet', narrow && rec.def.mobile === 'sheet');
      if (!narrow) {
        const r = rec.win.getBoundingClientRect();
        if (r.left > window.innerWidth - 60) rec.win.style.left = (window.innerWidth - 200) + 'px';
        if (r.top > window.innerHeight - 60) rec.win.style.top = (window.innerHeight - 160) + 'px';
      }
      rec.api.onResize?.();
    }
    document.body.classList.toggle('sheet-open',
      narrow && [...live.keys()].some(k => defs.get(k)?.mobile === 'sheet'));
  }, 140);
});

on('win:open', () => { /* hook point */ });
