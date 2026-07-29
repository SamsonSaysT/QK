// Palette lives here so it can be retuned without touching CSS.
// These override the defaults declared in css/tokens.css.
export const THEME = {
  '--void':      '#08080b',
  '--pitch':     '#0d0d12',
  '--charcoal':  '#16161d',
  '--iron':      '#23242e',
  '--slate':     '#3a3d4a',
  '--silver':    '#6f7482',
  '--silver-lt': '#b9bfcb',
  '--cold':      '#eef1f7',

  '--blood':     '#b0121a',
  '--blood-lt':  '#ff4a54',
  '--bruise':    '#6b3fa0',
  '--bruise-lt': '#a06fe0',
  '--electric':  '#1b3fff',
  '--rad':       '#6cff3f'
};

// How busy the page is by default. 0 = still, 1 = normal, 1.6 = MAXIMUM CHAOS.
export const CHAOS_DEFAULT = 1;

export function applyTheme(theme = THEME) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme)) root.style.setProperty(k, v);
}
