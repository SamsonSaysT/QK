import { el, $, $$, store, pick, pad, rand, isNarrow, on, emit } from './lib/core.js';
import { blip, toggleMute, isMuted } from './lib/sound.js';
import { register, openWin, toggleWin, isOpen } from './windows.js';
import { STATUS } from './config/content.js';
import { COLLAGE } from './config/photos.js';
import { gif } from './decor.js';
import { openGallery } from './gallery.js';

// ------------------------------------------------- ambient collage windows
function buildOnline(body) {
  body.append(
    el('div.amb', {},
      el('img.amb-img', {
        src: COLLAGE.desk.src, alt: COLLAGE.desk.alt, loading: 'lazy', decoding: 'async'
      }),
      el('div.amb-strip', {},
        el('span.amb-led'),
        el('span.amb-txt', { text: 'STATUS: TERMINALLY ONLINE' })
      )
    )
  );
  return {};
}

function buildCam(body) {
  const stamp = () => {
    const d = new Date();
    return `${d.getFullYear()}·${pad(d.getMonth() + 1)}·${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  const time = el('span.osd-stamp', { text: stamp() });
  const t = setInterval(() => { time.textContent = stamp(); }, 1000);
  body.append(
    el('div.amb.amb-cam', {},
      el('img.amb-img.is-masked', {
        src: COLLAGE.diamond.src, alt: COLLAGE.diamond.alt, loading: 'lazy', decoding: 'async'
      }),
      el('div.osd.osd-cam', {},
        el('span.osd-rec', {}, el('i.osd-dot'), 'REC'),
        el('span.osd-batt', {}, el('i.osd-cell'), '31%'),
        time,
        el('span.osd-mode', { text: 'SP  AUTO' })
      ),
      el('div.tracking', { 'aria-hidden': 'true' })
    )
  );
  return { onClose() { clearInterval(t); } };
}

function buildPlates(body) {
  body.append(
    el('div.amb', {},
      el('img.amb-img', {
        src: COLLAGE.plates.src, alt: COLLAGE.plates.alt, loading: 'lazy', decoding: 'async'
      }),
      el('div.amb-strip', {},
        el('span.amb-txt', { text: 'PLATES.JPG  1357×2048  24-BIT' }),
        el('button.amb-open', {
          type: 'button', 'data-no-drag': true,
          onclick: () => openGallery('plates')
        }, 'OPEN')
      )
    )
  );
  return {};
}

// ------------------------------------------------------------- taskbar bits
function initClock() {
  const node = $('#clock');
  if (!node) return;
  const tick = () => {
    const d = new Date();
    const h = d.getHours();
    node.firstElementChild.textContent = pad(h);
    node.lastElementChild.textContent = pad(d.getMinutes());
    node.classList.toggle('is-witching', h >= 0 && h < 5);
  };
  tick();
  setInterval(tick, 1000);
}

function initCounter() {
  const node = $('#hits');
  if (!node) return;
  let n = store.get('hits', 0);
  if (!n) n = 666 + Math.floor(Math.random() * 900);
  n += 1;
  store.set('hits', n);
  const digits = String(n).padStart(6, '0').split('');
  node.replaceChildren(...digits.map((d, i) =>
    el('b.hit-d', { text: d, style: { animationDelay: (i * 55) + 'ms' } })));
  node.setAttribute('aria-label', `${n} visitors`);
}

function initTicker() {
  const node = $('#status-line');
  if (!node) return;
  let last = -1;
  const swap = () => {
    let i = last;
    while (i === last) i = (Math.random() * STATUS.length) | 0;
    last = i;
    node.classList.add('is-swapping');
    setTimeout(() => {
      node.textContent = STATUS[i];
      node.classList.remove('is-swapping');
    }, 160);
  };
  node.textContent = STATUS[0];
  setInterval(swap, 5600);
}

function initStartMenu() {
  const btn = $('#start-btn');
  const menu = $('#start-menu');
  if (!btn || !menu) return;

  const items = [
    ['photos', 'PHOTOS.exe', 'assets/icons/photos.png'],
    ['game', 'SIGIL_SWARM.exe', 'assets/icons/game.png'],
    ['guestbook', 'GUESTBOOK', 'assets/icons/book.png'],
    ['amp', 'QK-AMP', 'assets/icons/amp.png'],
    ['terminal', 'QK-DOS', 'assets/icons/term.png'],
    ['readme', 'README.TXT', 'assets/icons/txt.png']
  ];
  menu.append(...items.map(([id, label, icon]) =>
    el('button.start-item', {
      type: 'button',
      onclick: () => { openWin(id); close(); }
    }, el('img', { src: icon, alt: '', width: 16, height: 16 }), label)
  ));

  const open = () => {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    blip('open');
    menu.querySelector('button')?.focus();
  };
  const close = () => {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  };
  btn.addEventListener('click', () => menu.hidden ? open() : close());
  document.addEventListener('click', e => {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { close(); btn.focus(); }
  });
}

function initMuteButton() {
  const btn = $('#mute-toggle');
  if (!btn) return;
  const paint = () => {
    const m = isMuted();
    btn.setAttribute('aria-pressed', String(m));
    btn.querySelector('span').textContent = m ? 'SOUND OFF' : 'SOUND ON';
  };
  btn.addEventListener('click', () => { toggleMute(); paint(); });
  on('mute', paint);
  paint();
}

// ------------------------------------------------------------- icons + portal
function initIcons() {
  $$('.dicon').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.open;
      if (target === 'photos') openGallery();
      else openWin(target);
    });
  });

  $('#arch-portal')?.addEventListener('click', () => {
    blip('open');
    openGallery('tree');
  });
}

// ------------------------------------------------------------- public
export function initDesktop() {
  register({
    id: 'online', title: 'QUINN_ONLINE.exe', icon: 'assets/icons/game.png',
    w: 244, layer: 'collage', mobile: 'inline', className: 'amb-win',
    x: vw => vw * 0.06, y: () => 132, build: buildOnline
  });
  register({
    id: 'cam', title: 'CAM_01', icon: 'assets/icons/photos.png',
    w: 208, layer: 'collage', mobile: 'inline', className: 'amb-win cam-win',
    x: vw => vw * 0.63, y: () => 420, build: buildCam
  });
  register({
    id: 'plates', title: 'PLATES.JPG', icon: 'assets/icons/photos.png',
    w: 214, layer: 'collage', mobile: 'inline', className: 'amb-win',
    x: vw => vw * 0.17, y: () => 452, build: buildPlates
  });

  openWin('online', { silent: true });
  openWin('cam', { silent: true });
  openWin('plates', { silent: true });

  initClock();
  initCounter();
  initTicker();
  initStartMenu();
  initMuteButton();
  initIcons();
}
