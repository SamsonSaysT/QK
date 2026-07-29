import { el, $, clamp, pick } from './lib/core.js';
import { blip } from './lib/sound.js';
import { register, openWin, get } from './windows.js';
import { PHOTOS } from './config/photos.js';

const TRANSITIONS = {
  coffin: 't-iris', crt: 't-crt', camcorder: 't-roll', halo: 't-iris',
  arch: 't-dissolve', polaroid: 't-drop', vhs: 't-crt', corrupt: 't-glitch'
};

let go = null;

export function initGallery() {
  register({
    id: 'photos', title: 'PHOTOS.exe', icon: 'assets/icons/photos.png',
    w: 460, layer: 'winlayer', mobile: 'sheet', className: 'photo-win',
    x: vw => clamp(vw / 2 - 380, 20, vw - 480), y: () => 62,
    build: buildGallery
  });
}

/** Opens the portal, optionally on a named photo. */
export function openGallery(id) {
  openWin('photos');
  if (id && go) go(PHOTOS.findIndex(p => p.id === id));
}

function buildGallery(body, win) {
  let i = 0;
  const frame = el('div.pv-frame');
  const stage = el('div.pv-stage', {}, frame);
  const title = el('span.pv-title');
  const line = el('span.pv-line');
  const count = el('span.pv-count');

  const prevBtn = el('button.pv-btn', { type: 'button', 'aria-label': 'Previous photo' }, '◀ PREV');
  const nextBtn = el('button.pv-btn', { type: 'button', 'aria-label': 'Next photo' }, 'NEXT ▶');
  const strip = el('div.pv-strip', { role: 'tablist', 'aria-label': 'Choose a photo' });

  PHOTOS.forEach((p, n) => {
    strip.append(el('button.pv-thumb', {
      type: 'button', role: 'tab', 'aria-label': p.title,
      'aria-selected': 'false', 'data-n': String(n),
      onclick: () => go(n)
    }, el('img', { src: p.thumb, alt: '', loading: 'lazy', width: 44, height: 44 })));
  });

  body.append(
    stage,
    el('div.pv-meta', {}, title, line),
    el('div.pv-nav', {}, prevBtn, count, nextBtn),
    strip
  );

  // ------------------------------------------------------------ rendering
  function render(p) {
    frame.dataset.frame = p.frame;
    frame.replaceChildren();

    let media;
    if (p.type === 'video') {
      media = el('video.pv-media', {
        src: p.src, poster: p.poster, controls: true, playsinline: true,
        preload: 'none', loop: true, 'aria-label': p.alt
      });
    } else {
      media = el('img.pv-media', {
        src: p.mask || p.mid || p.src, alt: p.alt, loading: 'lazy', decoding: 'async'
      });
      if (p.mask) media.classList.add('is-masked');
    }
    frame.append(media);

    // per-interface chrome
    if (p.frame === 'camcorder') {
      frame.append(
        el('div.osd.osd-cam', {},
          el('span.osd-rec', {}, el('i.osd-dot'), 'REC'),
          el('span.osd-batt', {}, el('i.osd-cell'), '31%'),
          el('span.osd-stamp', { text: stamp() }),
          el('span.osd-mode', { text: 'SP  AUTO' })
        ),
        el('div.tracking', { 'aria-hidden': 'true' })
      );
    }
    if (p.frame === 'vhs') {
      frame.append(el('div.osd.osd-vhs', {},
        el('span', { text: '▶  PLAY' }), el('span', { text: 'SP' }), el('span', { text: stamp() })));
    }
    if (p.frame === 'crt') {
      frame.append(el('div.crt-glass', { 'aria-hidden': 'true' }), el('span.crt-led'));
    }
    if (p.frame === 'corrupt') {
      frame.append(
        el('div.glitch-slice', { 'aria-hidden': 'true', style: { backgroundImage: `url(${p.mid || p.src})` } }),
        el('div.osd.osd-err', {}, el('span', { text: 'READ ERROR AT 0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0') }))
      );
    }
    if (p.frame === 'polaroid') {
      frame.append(el('span.tape.tape-a', { 'aria-hidden': 'true' }), el('span.tape.tape-b', { 'aria-hidden': 'true' }));
    }
    if (p.frame === 'halo') {
      frame.append(el('div.halo-ring', { 'aria-hidden': 'true' }));
    }

    title.textContent = p.title;
    line.textContent = p.line;
    count.textContent = `${i + 1} / ${PHOTOS.length}`;
    strip.querySelectorAll('.pv-thumb').forEach((b, n) => {
      const on = n === i;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
    });

    // transition
    const still = document.body.classList.contains('reduce-chaos');
    const cls = still ? 't-fade' : (TRANSITIONS[p.frame] || 't-fade');
    frame.classList.remove(...Object.values(TRANSITIONS), 't-fade');
    void frame.offsetWidth;
    frame.classList.add(cls);

    // warm the neighbour
    const nxt = PHOTOS[(i + 1) % PHOTOS.length];
    if (nxt.type !== 'video') new Image().src = nxt.mask || nxt.mid || nxt.src;
  }

  function stamp() {
    const d = new Date();
    return `${d.getFullYear()}·${String(d.getMonth() + 1).padStart(2, '0')}·${String(d.getDate()).padStart(2, '0')}  ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  go = function (n) {
    if (n === undefined || n < 0 || Number.isNaN(n)) n = 0;
    i = (n + PHOTOS.length) % PHOTOS.length;
    render(PHOTOS[i]);
    blip('tick');
  };

  prevBtn.addEventListener('click', () => go(i - 1));
  nextBtn.addEventListener('click', () => go(i + 1));

  function onKey(e) {
    if (!win.classList.contains('is-front')) return;
    if (e.key === 'ArrowLeft') { go(i - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { go(i + 1); e.preventDefault(); }
  }
  document.addEventListener('keydown', onKey);

  go(0);

  return {
    onClose() { document.removeEventListener('keydown', onKey); go = null; }
  };
}
