import { applyTheme } from './config/theme.js';
import { runBoot } from './boot.js';
import { initDesktop } from './desktop.js';
import { initPlayer, Player } from './player.js';
import { initGame } from './game.js';
import { initGallery } from './gallery.js';
import { initApps } from './apps.js';
import { initTerminal } from './terminal.js';
import { initSecrets } from './secrets.js';
import { initChaos } from './chaos.js';
import { scatterDecor, initParallax, initVisibilityGuard } from './decor.js';

applyTheme();

async function start() {
  // register every window before anything can reference one
  initGallery();
  initGame();
  initApps();
  initTerminal();
  initPlayer();

  initChaos();
  scatterDecor();
  initDesktop();
  initSecrets();
  initParallax();
  initVisibilityGuard();

  document.dispatchEvent(new Event('decor:refresh'));
  measureDock();

  const { sound, skipped } = await runBoot();
  if (sound && !skipped) {
    // the click on ENTER counts as the gesture browsers require
    setTimeout(() => Player.play(), 260);
  }
}

/** Keeps --dock-h in sync with the real docked player height on phones. */
function measureDock() {
  const amp = document.getElementById('win-amp');
  if (!amp) return;
  const sync = () => {
    const narrow = window.matchMedia('(max-width: 900px)').matches;
    document.documentElement.style.setProperty(
      '--dock-h', narrow ? Math.round(amp.getBoundingClientRect().height) + 'px' : '0px');
  };
  new ResizeObserver(sync).observe(amp);
  window.addEventListener('resize', sync);
  sync();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
