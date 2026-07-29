// ---------------------------------------------------------------------------
// TRACKS
// Placeholder instrumentals generated for this build. Swap the src paths for
// music Quinn actually has the right to publish; nothing else needs to change.
// ---------------------------------------------------------------------------
export const TRACKS = [
  { title: 'MIDNIGHT MASS',          artist: 'QK PLACEHOLDER', src: 'assets/audio/01-midnight-mass.mp3' },
  { title: 'CHROME TEETH',           artist: 'QK PLACEHOLDER', src: 'assets/audio/02-chrome-teeth.mp3' },
  { title: 'PARKING LOT SEANCE',     artist: 'QK PLACEHOLDER', src: 'assets/audio/03-parking-lot-seance.mp3' },
  { title: 'NO SIGNAL NO SALVATION', artist: 'QK PLACEHOLDER', src: 'assets/audio/04-no-signal-no-salvation.mp3' }
];

// ---------------------------------------------------------------------------
// STATUS TICKER — one shows at a time under the wordmark
// ---------------------------------------------------------------------------
export const STATUS = [
  'QUINN WAS HERE',
  'ONLINE FOREVER',
  'NO SIGNAL / NO SALVATION',
  'KERRIGAN NETWORK',
  'BEST VIEWED AFTER MIDNIGHT',
  'TERMINALLY ONLINE',
  'WELCOME TO THE SHRINE',
  'SIGNED IN SINCE 2003',
  'DO NOT ADJUST YOUR SET',
  'THE TAPE IS STILL ROLLING'
];

// ---------------------------------------------------------------------------
// GIF INVENTORY — every file lives in assets/gifs/ with a matching -still.png
// spot: where it may be placed. size: rendered px width.
// ---------------------------------------------------------------------------
export const GIFS = [
  { id: 'skull-spin',     w: 44, alt: 'spinning pixel skull',      spot: 'roam' },
  { id: 'cross-spin',     w: 34, alt: 'rotating pixel cross',      spot: 'roam' },
  { id: 'eye-blink',      w: 40, alt: 'blinking pixel eye',        spot: 'chrome' },
  { id: 'bat-flap',       w: 34, alt: 'flapping pixel bat',        spot: 'roam' },
  { id: 'star-chrome',    w: 26, alt: 'twinkling chrome star',     spot: 'sparkle' },
  { id: 'cd-spin',        w: 38, alt: 'spinning compact disc',     spot: 'chrome' },
  { id: 'construction',   w: 96, alt: 'under construction bar',    spot: 'strip' },
  { id: 'fire-divider',   w: 128, alt: 'animated flame divider',   spot: 'strip' },
  { id: 'flame',          w: 22, alt: 'small flame',               spot: 'sparkle' },
  { id: 'heart-broken',   w: 26, alt: 'breaking pixel heart',      spot: 'roam' },
  { id: 'mail',           w: 30, alt: 'envelope opening',          spot: 'chrome' },
  { id: 'skeleton-dance', w: 26, alt: 'dancing pixel skeleton',    spot: 'roam' },
  { id: 'new-badge',      w: 44, alt: 'blinking NEW badge',        spot: 'sparkle' },
  { id: 'thorn-divider',  w: 120, alt: 'thorn divider',            spot: 'strip' }
];

// ---------------------------------------------------------------------------
// BOOT SEQUENCE — [label, value, delay ms]
// ---------------------------------------------------------------------------
export const BOOT_LINES = [
  ['HANDSHAKE',        'OK',          260],
  ['KERRIGAN NETWORK', '33.6 KBPS',   380],
  ['LOCATING HOST',    'FOUND',       300],
  ['CHROME BUFFER',    'FILLED',      240],
  ['SIGIL INTEGRITY',  '99.6%',       320],
  ['SOUL',             'NOT FOUND',   420]
];

// ---------------------------------------------------------------------------
// MISC COPY
// ---------------------------------------------------------------------------
export const README_TEXT = `QUINN KERRIGAN
==============

skates. stays up too late. owns a computer.

this page is a shrine, not a resume. nothing here
is for sale and nothing here is sponsored.

CONTROLS
  drag any window by its title bar
  double-click a title bar to roll it up
  press ESC to close the front window
  type QUINN anywhere for a terminal

there are seven secrets. the taskbar counts them.

built to be opened after midnight.`;

export const BAT_LINE = 'the bat says: go outside eventually';

export const SHRINE_TEXT = [
  'YOU FOUND THE BACK ROOM',
  'nothing is buried here except the parts',
  'that did not fit on the front page.',
  'take a sigil. leave a name in the guestbook.'
];

export const GUESTBOOK_SEED = [
  { name: 'MARA', icon: 'skull-spin',   msg: 'saw the triple rail clip 40 times. still not over it', at: '2003-11-02 03:12' },
  { name: 'd3vin', icon: 'cd-spin',     msg: 'burn me a copy of the midnight mass track', at: '2003-11-04 23:47' },
  { name: 'anon',  icon: 'eye-blink',   msg: 'how do i get the night mode thing to happen', at: '2003-11-09 01:03' },
  { name: 'JULES', icon: 'heart-broken', msg: 'your page crashed my browser and i mean that lovingly', at: '2003-11-15 02:29' }
];
