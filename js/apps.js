import { el, $, store, clean, pad, pick } from './lib/core.js';
import { blip } from './lib/sound.js';
import { register, openWin } from './windows.js';
import { GUESTBOOK_SEED, README_TEXT, SHRINE_TEXT, GIFS } from './config/content.js';
import { COLLAGE } from './config/photos.js';
import { gif } from './decor.js';

const ICON_CHOICES = ['skull-spin', 'cd-spin', 'eye-blink', 'bat-flap', 'heart-broken', 'cross-spin', 'flame'];

// ---------------------------------------------------------------- guestbook
function buildGuestbook(body) {
  const list = el('ol.gb-list');
  let chosen = ICON_CHOICES[0];
  let lastPost = 0;

  const entries = () => [...GUESTBOOK_SEED, ...store.get('guestbook', [])];

  function paint() {
    list.replaceChildren();
    entries().forEach((e, n) => {
      list.append(el('li.gb-entry', {},
        el('div.gb-head', {},
          el('img.gb-ico', { src: `assets/gifs/${e.icon}.gif`, alt: '', width: 20, height: 20,
            'data-gif': e.icon, loading: 'lazy' }),
          el('b.gb-name', { text: e.name }),
          el('span.gb-n', { text: '#' + pad(n + 1, 3) }),
          el('time.gb-at', { text: e.at })
        ),
        el('p.gb-msg', { text: e.msg })
      ));
    });
  }

  const name = el('input.gb-in', {
    type: 'text', maxlength: '24', placeholder: 'NAME', 'aria-label': 'Your name', 'data-no-drag': true
  });
  const msg = el('textarea.gb-in.gb-ta', {
    maxlength: '140', rows: '2', placeholder: 'SAY SOMETHING', 'aria-label': 'Your message', 'data-no-drag': true
  });

  const picker = el('div.gb-picker', { role: 'radiogroup', 'aria-label': 'Pick an icon' });
  ICON_CHOICES.forEach(id => {
    const b = el('button.gb-pick', {
      type: 'button', role: 'radio', 'aria-checked': String(id === chosen),
      'aria-label': id.replace('-', ' '), 'data-no-drag': true,
      onclick: () => {
        chosen = id;
        picker.querySelectorAll('.gb-pick').forEach(x =>
          x.setAttribute('aria-checked', String(x.dataset.id === id)));
        picker.querySelectorAll('.gb-pick').forEach(x => x.classList.toggle('is-on', x.dataset.id === id));
        blip('tick');
      }
    }, el('img', { src: `assets/gifs/${id}.gif`, alt: '', width: 18, height: 18, 'data-gif': id }));
    b.dataset.id = id;
    if (id === chosen) b.classList.add('is-on');
    picker.append(b);
  });

  const note = el('p.gb-note', { text: 'entries are saved in this browser only' });

  const send = el('button.gb-send', {
    type: 'button',
    onclick: () => {
      const n = clean(name.value, 24) || 'ANON';
      const m = clean(msg.value, 140);
      if (!m) { note.textContent = 'write something first'; blip('deny'); return; }
      if (Date.now() - lastPost < 20000) {
        note.textContent = 'slow down — one message every 20 seconds';
        blip('deny');
        return;
      }
      lastPost = Date.now();
      const d = new Date();
      const mine = store.get('guestbook', []);
      mine.push({
        name: n.toUpperCase(), icon: chosen, msg: m,
        at: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      });
      store.set('guestbook', mine.slice(-40));
      name.value = ''; msg.value = '';
      note.textContent = 'signed. it is in the book now';
      paint();
      blip('bonus');
      list.lastElementChild?.scrollIntoView({ block: 'nearest' });
    }
  }, 'SIGN THE BOOK');

  body.append(
    el('div.gb-marquee', {}, el('span', { text: '  ✦  SIGN THE BOOK  ✦  NO FLAMING  ✦  NO NARCS  ✦  QUINN READS EVERY ONE  ' })),
    list,
    el('div.gb-form', {},
      el('div.gb-row', {}, name, picker),
      msg,
      el('div.gb-row.gb-row-end', {}, note, send)
    )
  );
  paint();
  return {};
}

// ---------------------------------------------------------------- readme
function buildReadme(body) {
  body.append(el('pre.txt-body', { text: README_TEXT }));
  return {};
}

// ---------------------------------------------------------------- shrine
function buildShrine(body, win) {
  const rays = `<svg viewBox="0 0 300 300" aria-hidden="true" focusable="false" class="shrine-rays">
  ${Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * 360;
    return `<path d="M150 150 L 142 -40 L 158 -40 Z" transform="rotate(${a} 150 150)"/>`;
  }).join('')}
  </svg>`;

  body.append(
    el('div.shrine', {},
      el('div.shrine-halo', { html: rays, 'aria-hidden': 'true' }),
      el('img.shrine-figure', {
        src: COLLAGE.cutout.src, alt: COLLAGE.cutout.alt, loading: 'lazy', decoding: 'async'
      }),
      el('div.shrine-gifs', {},
        gif('flame', 26), gif('skull-spin', 34), gif('cross-spin', 26),
        gif('flame', 26), gif('star-chrome', 20)
      ),
      el('div.shrine-text', {},
        el('h3.shrine-h', { text: SHRINE_TEXT[0] }),
        ...SHRINE_TEXT.slice(1).map(t => el('p', { text: t }))
      ),
      el('img.shrine-thorn', { src: 'assets/gifs/thorn-divider.gif', alt: '', 'data-gif': 'thorn-divider', width: 200 })
    )
  );
  return {};
}

// ---------------------------------------------------------------- register
export function initApps() {
  register({
    id: 'guestbook', title: 'GUESTBOOK', icon: 'assets/icons/book.png',
    w: 372, layer: 'winlayer', mobile: 'sheet', className: 'gb-win',
    x: vw => clamp(vw - 460, 40, vw - 400), y: () => 120,
    build: buildGuestbook
  });
  register({
    id: 'readme', title: 'README.TXT', icon: 'assets/icons/txt.png',
    w: 330, layer: 'winlayer', mobile: 'sheet', className: 'txt-win',
    x: () => 150, y: () => 150,
    build: buildReadme
  });
  register({
    id: 'shrine', title: 'BACK_ROOM', icon: 'assets/icons/skull.png',
    w: 400, layer: 'winlayer', mobile: 'sheet', className: 'shrine-window',
    x: vw => clamp(vw / 2 - 200, 20, vw - 420), y: () => 70,
    build: buildShrine
  });
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
