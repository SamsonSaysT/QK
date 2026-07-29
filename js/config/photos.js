// Every image on the site is registered here. Add, remove or reorder freely.
// `frame` picks the viewer interface used in PHOTOS.exe:
//   coffin | crt | camcorder | halo | arch | polaroid | vhs | corrupt
const Q = 'assets/quinn/';

export const PHOTOS = [
  {
    id: 'plates',
    frame: 'coffin',
    title: 'PLATES.JPG',
    line: 'STOLEN NUMBERS / NOTHING TO DECLARE',
    src: Q + 'quinn-01-hoodie-license-plates.webp',
    mid: Q + 'quinn-01-hoodie-license-plates-mid.webp',
    thumb: Q + 'quinn-01-hoodie-license-plates-thumb.webp',
    alt: 'Quinn in a dark hoodie standing in front of a wall covered in old license plates.'
  },
  {
    id: 'desk',
    frame: 'crt',
    title: 'BATTLESTATION.JPG',
    line: 'STATUS: TERMINALLY ONLINE',
    src: Q + 'quinn-02-gaming-chair.webp',
    mid: Q + 'quinn-02-gaming-chair-mid.webp',
    thumb: Q + 'quinn-02-gaming-chair-thumb.webp',
    alt: 'Quinn sitting in a gaming chair at a computer setup.'
  },
  {
    id: 'interview',
    frame: 'camcorder',
    title: 'TAPE_03.AVI',
    line: 'REC / NO AUDIO RECOVERED',
    src: Q + 'quinn-03-interview-outdoors.webp',
    mid: Q + 'quinn-03-interview-outdoors-mid.webp',
    thumb: Q + 'quinn-03-interview-outdoors-thumb.webp',
    mask: Q + 'quinn-03-interview-diamond.webp',
    alt: 'Quinn being interviewed outdoors on a bright day.'
  },
  {
    id: 'night',
    frame: 'halo',
    title: 'MOON.PNG',
    line: 'IT WAS ALREADY TOMORROW',
    src: Q + 'quinn-04-night-closeup.webp',
    mid: Q + 'quinn-04-night-closeup-mid.webp',
    thumb: Q + 'quinn-04-night-closeup-thumb.webp',
    mask: Q + 'quinn-04-night-halo.webp',
    alt: 'Close-up portrait of Quinn at night, lit by a camera flash.'
  },
  {
    id: 'tree',
    frame: 'arch',
    title: 'CATHEDRAL.JPG',
    line: 'FULL LENGTH / FULL COVERAGE',
    src: Q + 'quinn-05-tree-fullbody.webp',
    mid: Q + 'quinn-05-tree-fullbody-mid.webp',
    thumb: Q + 'quinn-05-tree-fullbody-thumb.webp',
    mask: Q + 'quinn-05-gothic-arch.webp',
    alt: 'Full body photograph of Quinn standing in front of a tree, tattoos visible.'
  },
  {
    id: 'bench',
    frame: 'polaroid',
    title: 'BENCH.JPG',
    line: 'SESSION / UNDATED',
    src: Q + 'quinn-06-skate-bench.webp',
    mid: Q + 'quinn-06-skate-bench-mid.webp',
    thumb: Q + 'quinn-06-skate-bench-thumb.webp',
    alt: 'Quinn skating at a bench.'
  },
  {
    id: 'rail',
    frame: 'vhs',
    type: 'video',
    title: 'FRONT_BOARD.MOV',
    line: 'TRIPLE RAIL / LANDED',
    src: Q + 'quinn-07-skate-rail.mp4',
    poster: Q + 'quinn-07-skate-rail-poster.webp',
    thumb: Q + 'quinn-07-skate-rail-poster.webp',
    alt: 'Video clip of Quinn riding a front board down a triple rail.'
  },
  {
    id: 'post',
    frame: 'corrupt',
    title: 'SOCIAL.BMP',
    line: 'ARCHIVED FROM THE FEED',
    src: Q + 'quinn-06-instagram-post.webp',
    mid: Q + 'quinn-06-instagram-post.webp',
    thumb: Q + 'quinn-06-skate-bench-thumb.webp',
    alt: 'Screenshot of an Instagram post showing Quinn skating.'
  }
];

// Images used by the home collage and page chrome.
export const COLLAGE = {
  coffin:  { src: Q + 'quinn-01-coffin.webp',             sm: Q + 'quinn-01-coffin-sm.webp',
             alt: 'Quinn photographed in front of a wall of license plates, cropped into a coffin shape.' },
  cutout:  { src: Q + 'quinn-05-transparent-cutout.webp',  sm: Q + 'quinn-05-transparent-cutout-sm.webp',
             alt: 'Full body cut-out of Quinn standing.' },
  arch:    { src: Q + 'quinn-05-gothic-arch.webp',         sm: Q + 'quinn-05-gothic-arch-sm.webp',
             alt: 'Quinn photographed in front of a tree, cropped into a gothic arch.' },
  halo:    { src: Q + 'quinn-04-night-halo.webp',          sm: Q + 'quinn-04-night-halo-sm.webp',
             alt: 'Circular night portrait of Quinn.' },
  diamond: { src: Q + 'quinn-03-interview-diamond.webp',   sm: Q + 'quinn-03-interview-diamond-sm.webp',
             alt: 'Quinn outdoors, cropped into a diamond.' },
  desk:    { src: Q + 'quinn-02-gaming-chair-mid.webp',    alt: 'Quinn at his computer.' },
  plates:  { src: Q + 'quinn-01-hoodie-license-plates-mid.webp', alt: 'Quinn in front of license plates.' }
};
