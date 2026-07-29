import { clamp, isNarrow } from './core.js';

/**
 * Makes `target` draggable by `handle`. Uses pointer events so mouse, pen and
 * touch all behave the same. Disabled entirely in narrow layout so dragging can
 * never fight the page scroll on a phone.
 */
export function draggable(target, handle, opts = {}) {
  const { onStart, onMove, onEnd, bounds = true } = opts;
  let id = null, ox = 0, oy = 0, moved = false;

  function down(e) {
    if (isNarrow() || e.button > 0) return;
    if (e.target.closest('[data-no-drag]')) return;
    id = e.pointerId;
    moved = false;
    const r = target.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    handle.setPointerCapture(id);
    target.classList.add('is-dragging');
    onStart?.(e);
  }

  function move(e) {
    if (e.pointerId !== id) return;
    e.preventDefault();
    moved = true;
    let x = e.clientX - ox;
    let y = e.clientY - oy;
    if (bounds) {
      const pad = 28;
      x = clamp(x, -target.offsetWidth + pad, window.innerWidth - pad);
      y = clamp(y, 0, window.innerHeight - pad);
    }
    target.style.left = x + 'px';
    target.style.top = y + 'px';
    onMove?.(x, y, e);
  }

  function up(e) {
    if (e.pointerId !== id) return;
    try { handle.releasePointerCapture(id); } catch {}
    id = null;
    target.classList.remove('is-dragging');
    onEnd?.(moved, e);
  }

  handle.addEventListener('pointerdown', down);
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', up);
  handle.addEventListener('pointercancel', up);
  handle.style.touchAction = 'none';

  return () => {
    handle.removeEventListener('pointerdown', down);
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', up);
    handle.removeEventListener('pointercancel', up);
  };
}
