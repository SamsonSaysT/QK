const NS = 'qk.';

/** localStorage that never throws (private mode, full quota, blocked cookies). */
export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(NS + key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) { try { localStorage.removeItem(NS + key); } catch {} },
  clearAll() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith(NS)).forEach(k => localStorage.removeItem(k));
    } catch {}
  }
};

/** el('div.window#id', {attrs}, ...children) */
export function el(spec, attrs = {}, ...kids) {
  const [tagPart, ...classes] = spec.split('.');
  const [tag, id] = tagPart.split('#');
  const node = document.createElement(tag || 'div');
  if (id) node.id = id;
  if (classes.length) node.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
export const rand = (lo, hi) => lo + Math.random() * (hi - lo);
export const pick = arr => arr[(Math.random() * arr.length) | 0];

/** Strip markup — everything user-typed goes through this. */
export function clean(str, max = 300) {
  return String(str).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function pad(n, len = 2) { return String(n).padStart(len, '0'); }

export function mmss(secs) {
  if (!isFinite(secs) || secs < 0) secs = 0;
  return `${pad(Math.floor(secs / 60))}:${pad(Math.floor(secs % 60))}`;
}

/** True when the layout is in single-column / sheet mode. */
export const mq = window.matchMedia('(max-width: 900px)');
export const isNarrow = () => mq.matches;

/** Honours the OS setting; the REDUCE CHAOS button layers on top of it. */
export const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const bus = new EventTarget();
export const on = (type, fn) => bus.addEventListener(type, fn);
export const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
