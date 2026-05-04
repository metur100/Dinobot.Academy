import { publicUrl } from "./url";

export const IMAGES = {
  // App/game icons (home screen)
  letters: publicUrl("images/optimus-face.jpg"),
  numbers: publicUrl("images/optimus-pose.jpg"),
  shapes: publicUrl("images/Grimlock.webp"),
  colors: publicUrl("images/trex-volcano.jpg"),
  memory: publicUrl("images/bumblebee1.jpg"),
  puzzle: publicUrl("images/trex.jpg"),
  counting: publicUrl("images/bumblebee2.jpg"),
  patterns: publicUrl("images/optimus2.jpg"),
  photoPuzzle: publicUrl("images/optimus3.jpg"),
  runner: publicUrl("images/optimus-fortnite.jpg"),

  // Pattern / memory pool icons
  itemA: publicUrl("images/optimus-face.jpg"),
  itemB: publicUrl("images/optimus-fortnite.jpg"),
  itemC: publicUrl("images/optimus-pose.jpg"),
  itemD: publicUrl("images/Grimlock.webp"),
  itemE: publicUrl("images/dinobot1.webp"),
  itemF: publicUrl("images/trex.jpg"),
  itemG: publicUrl("images/dino.jpeg"),
  itemH: publicUrl("images/trex-volcano.jpg"),

  // NEW
  dinosaurs: publicUrl("images/dinosaurs.jpg"),

  // NEW extras (optional but useful)
  itemI: publicUrl("images/Miniforce.webp"),
  itemJ: publicUrl("images/transformers.jpg"),
  itemK: publicUrl("images/optimus-grimlock.jpeg"),

  // Runner sprites
  optimusRun: publicUrl("images/optimus-pose.jpg"),
  optimusJump: publicUrl("images/optimus-fortnite.jpg"),
  optimusShoot: publicUrl("images/optimus-face.jpg"),
  bot: publicUrl("images/Grimlock.webp"),
  wall: publicUrl("images/trex.jpg"),
  ufo: publicUrl("images/bumblebee3.webp"),

  // Generic UI
  confetti: publicUrl("images/bumblebee3.webp"),
} as const;

// IMPORTANT: 6x6 needs 18 unique images => put 18 different URLs here.
export const MEMORY_POOL: string[] = [
  IMAGES.itemA,
  IMAGES.itemB,
  IMAGES.itemC,
  IMAGES.itemD,
  IMAGES.itemE,
  IMAGES.itemF,
  IMAGES.itemG,
  IMAGES.itemH,

  IMAGES.itemI,
  IMAGES.itemJ,
  IMAGES.itemK,
  IMAGES.ufo,
  IMAGES.dinosaurs,

  publicUrl("images/optimus2.jpg"),
  publicUrl("images/optimus3.jpg"),
  publicUrl("images/trex2.jpg"),
  publicUrl("images/bumblebee2.jpg"),
  publicUrl("images/bumblebee1.jpg"),
];

export const PHOTO_POOL: string[] = [
  publicUrl("images/optimus-face.jpg"),
  publicUrl("images/optimus-fortnite.jpg"),
  publicUrl("images/optimus-pose.jpg"),
  publicUrl("images/optimus2.jpg"),
  publicUrl("images/optimus3.jpg"),
  publicUrl("images/optimus-grimlock.jpeg"),
  publicUrl("images/transformers.jpg"),
  publicUrl("images/Miniforce.webp"),
  publicUrl("images/Grimlock.webp"),
  publicUrl("images/dinobot1.webp"),
  publicUrl("images/trex.jpg"),
  publicUrl("images/trex2.jpg"),
  publicUrl("images/trex-volcano.jpg"),
  publicUrl("images/dino.jpeg"),
  publicUrl("images/bumblebee1.jpg"),
  publicUrl("images/bumblebee2.jpg"),
  publicUrl("images/bumblebee3.webp"),
  publicUrl("images/dinosaurs.jpg"),
];
