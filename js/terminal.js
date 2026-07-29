import { el, store, clean, emit } from './lib/core.js';
import { blip } from './lib/sound.js';
import { register, openWin } from './windows.js';
import { SECRETS } from './config/secrets.js';
import { found, foundCount, resetSecrets } from './secrets.js';

const BANNER = [
  'QK-DOS  v6.66',
  '(c) KERRIGAN NETWORK — all rights reversed',
  '',
  "type HELP for a list of commands",
  ''
];

export function initTerminal() {
  register({
    id: 'terminal', title: 'QK-DOS', icon: 'assets/icons/term.png',
    w: 400, layer: 'winlayer', mobile: 'sheet', className: 'term-win',
    x: vw => Math.max(24, vw / 2 - 120), y: () => 190,
    build: buildTerminal
  });
}

export function openTerminal() { openWin('terminal'); }

function buildTerminal(body, win) {
  const out = el('div.term-out', { role: 'log', 'aria-live': 'polite' });
  const input = el('input.term-in', {
    type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    'aria-label': 'Terminal input', 'data-no-drag': true
  });
  const prompt = el('div.term-line', {},
    el('span.term-caret', { text: 'C:\\QUINN>' }), input);

  body.append(out, prompt);
  BANNER.forEach(l => print(l));

  function print(text, cls) {
    out.append(el('p.term-p' + (cls ? '.' + cls : ''), { text }));
    out.scrollTop = out.scrollHeight;
  }

  const FILES = {
    'readme.txt': 'see README.TXT on the desktop.',
    'sigil.qk': '[binary] 4,096 bytes — refuses to open',
    'tape03.avi': '[corrupt] recovered in PHOTOS.exe',
    'salvation.dll': 'not found',
    'guestbook.dat': `${(store.get('guestbook', []) || []).length} local entries`
  };

  const CMDS = {
    help: () => ['available:', '  HELP  WHOAMI  LS  CAT <file>  SIGIL  SECRETS',
      '  SCORE  CHAOS  666  CLS  RESET  EXIT'],
    whoami: () => ['QUINN KERRIGAN', 'skates. stays up too late. owns a computer.',
      'currently: terminally online'],
    ls: () => ['Directory of C:\\QUINN', '', ...Object.keys(FILES).map(f => '  ' + f.toUpperCase()), '',
      `  ${Object.keys(FILES).length} file(s)`],
    cat: arg => {
      const key = (arg || '').toLowerCase();
      if (!key) return ['usage: CAT <file>'];
      return [FILES[key] || `${key.toUpperCase()}: file not found`];
    },
    sigil: () => ['      \\  |  /', '     --( QK )--', '      /  |  \\',
      '', 'the sigil is already on you'],
    secrets: () => {
      const lines = [`found ${foundCount()} of ${SECRETS.length}`, ''];
      SECRETS.forEach(s => {
        lines.push(found(s.id) ? `  [x] ${s.name} — ${s.found}` : '  [ ] ????????');
      });
      lines.push('', 'undiscovered ones stay undiscovered.');
      return lines;
    },
    score: () => [`SIGIL_SWARM best: ${store.get('best', 0)}`],
    chaos: () => { emit('chaos:max-toggle'); return ['chaos level adjusted.']; },
    '666': () => { emit('secret:night'); return ['the moon turned on you.']; },
    cls: () => { out.replaceChildren(); return []; },
    reset: () => {
      resetSecrets();
      return ['secrets cleared. high score and guestbook kept.',
        'reload to see the entry screen again.'];
    },
    exit: () => { setTimeout(() => import('./windows.js').then(m => m.closeWin('terminal')), 220); return ['bye.']; }
  };

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const raw = clean(input.value, 80);
    input.value = '';
    print('C:\\QUINN> ' + raw, 'term-echo');
    if (!raw) return;
    const [cmd, ...rest] = raw.toLowerCase().split(/\s+/);
    const fn = CMDS[cmd];
    if (!fn) {
      print(`'${cmd.toUpperCase()}' is not recognized. try HELP`, 'term-err');
      blip('deny');
      return;
    }
    blip('tick');
    (fn(rest.join(' ')) || []).forEach(l => print(l));
  });

  return {
    onOpen() { setTimeout(() => input.focus(), 60); },
    onShow() { input.focus(); }
  };
}
