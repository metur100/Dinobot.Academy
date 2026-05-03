// src/assets/images.ts
// Central place to map all former emoji/icons to local images.
// NOTE: These paths assume files exist under /public/images.

export const IMAGES = {
  // App/game icons (home screen)
  letters: '/images/optimus-face.jpg',
  numbers: '/images/optimus-pose.jpg',
  shapes: '/images/Grimlock.webp',
  colors: '/images/trex-volcano.jpg',
  memory: '/images/bumblebee1.jpg',
  puzzle: '/images/trex.jpg',
  counting: '/images/bumblebee2.jpg',
  patterns: '/images/optimus2.jpg',
  photoPuzzle: '/images/optimus3.jpg',
  runner: '/images/optimus-fortnite.jpg',

  // Pattern / memory pool icons (use ONLY existing files)
  itemA: '/images/optimus-face.jpg',
  itemB: '/images/optimus-fortnite.jpg',
  itemC: '/images/optimus-pose.jpg',
  itemD: '/images/Grimlock.webp',
  itemE: '/images/dinobot1.webp',
  itemF: '/images/trex.jpg',
  itemG: '/images/trex2.jpg',
  itemH: '/images/trex-volcano.jpg',

  // Runner sprites
  optimusRun: '/images/optimus-pose.jpg',
  optimusJump: '/images/optimus-fortnite.jpg',
  optimusShoot: '/images/optimus-face.jpg',
  bot: '/images/Grimlock.webp',
  wall: '/images/trex.jpg',
  ufo: '/images/bumblebee3.webp', // placeholder image that exists

  // Generic UI
  confetti: '/images/bumblebee3.webp', // placeholder image that exists
} as const;

export const MEMORY_POOL: string[] = [
  IMAGES.itemA,
  IMAGES.itemB,
  IMAGES.itemC,
  IMAGES.itemD,
  IMAGES.itemE,
  IMAGES.itemF,
  IMAGES.itemG,
  IMAGES.itemH,
];

export const PHOTO_POOL: string[] = [
  '/images/optimus-face.jpg',
  '/images/optimus-fortnite.jpg',
  '/images/optimus-pose.jpg',
  '/images/Grimlock.webp',
  '/images/dinobot1.webp',
  '/images/trex.jpg',
  '/images/trex2.jpg',
  '/images/trex-volcano.jpg',
  '/images/bumblebee1.jpg',
  '/images/bumblebee2.jpg',
  '/images/bumblebee3.webp',
];
