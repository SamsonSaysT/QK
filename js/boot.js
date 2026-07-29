import { $, store, motionQuery } from './lib/core.js';
import { BOOT_LINES } from './config/content.js';
import { setMuted, blip } from './lib/sound.js';

/** Resolves once the visitor is through the door. */
export function runBoot() {
  return new Promise(resolve => {
    const boot = $('#boot');
    if (!boot) return resolve({ sound: false, skipped: true });

    // Repeat visitors go straight in.
    if (store.get('entered', false)) {
      boot.remove();
      document.body.classList.add('is-in');
      return resolve({ sound: false, skipped: true });
    }

    const log = $('#boot-log');
    const actions = $('#boot-actions');
    const still = motionQuery.matches;

    document.body.classList.add('is-booting');
    boot.hidden = false;

    let i = 0;
    const step = () => {
      if (i >= BOOT_LINES.length) {
        actions.classList.add('is-ready');
        $('#enter-sound')?.focus();
        return;
      }
      const [label, value, delay] = BOOT_LINES[i++];
      const row = document.createElement('p');
      row.className = 'boot-row';
      row.innerHTML =
        `<span class="boot-k">${label}</span>` +
        `<span class="boot-dots" aria-hidden="true"></span>` +
        `<span class="boot-v">${value}</span>`;
      log.append(row);
      requestAnimationFrame(() => row.classList.add('is-in'));
      setTimeout(step, still ? 90 : delay);
    };
    setTimeout(step, still ? 60 : 480);

    const enter = withSound => {
      store.set('entered', true);
      setMuted(!withSound);
      if (withSound) blip('boot');
      boot.classList.add('is-out');
      document.body.classList.remove('is-booting');
      document.body.classList.add('is-in');
      setTimeout(() => boot.remove(), still ? 0 : 620);
      resolve({ sound: withSound, skipped: false });
    };

    $('#enter-sound')?.addEventListener('click', () => enter(true));
    $('#enter-silent')?.addEventListener('click', () => enter(false));

    // Enter/Space on the overlay itself takes the loud door.
    boot.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.target.closest('button')) enter(true);
    });
  });
}
