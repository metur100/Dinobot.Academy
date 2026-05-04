import type { Lang } from "./i18n";
import React from "react";
import { publicUrl } from "../assets/url";

export interface Mission {
  id: string;
  icon?: string;
  image?: string;
  color: string;
  game:
    | "letters"
    | "numbers"
    | "shapes"
    | "colors"
    | "memory"
    | "puzzle"
    | "counting"
    | "patterns"
    | "photoPuzzle"
    | "runner";
  stars: number;
  unlocked: boolean;
}

export const MISSIONS: Mission[] = [
  { id: "letters", icon: "🔤", image: publicUrl("images/optimus-face.jpg"), color: "#ff6b35", game: "letters", stars: 0, unlocked: true },
  { id: "numbers", icon: "🔢", image: publicUrl("images/optimus-fortnite.jpg"), color: "#4ecdc4", game: "numbers", stars: 0, unlocked: true },
  { id: "shapes", icon: "🔷", image: publicUrl("images/trex-volcano.jpg"), color: "#a855f7", game: "shapes", stars: 0, unlocked: true },
  { id: "colors", icon: "🎨", image: publicUrl("images/optimus-pose.jpg"), color: "#f97316", game: "colors", stars: 0, unlocked: true },
  { id: "memory", icon: "🧠", image: publicUrl("images/optimus-face.jpg"), color: "#22c55e", game: "memory", stars: 0, unlocked: true },
  { id: "puzzle", icon: "🧩", image: publicUrl("images/trex.jpg"), color: "#e11d48", game: "puzzle", stars: 0, unlocked: true },
  { id: "counting", icon: "🔢", image: publicUrl("images/trex-volcano.jpg"), color: "#0ea5e9", game: "counting", stars: 0, unlocked: true },
  { id: "patterns", icon: "🔁", image: publicUrl("images/optimus-pose.jpg"), color: "#d97706", game: "patterns", stars: 0, unlocked: true },
  { id: "photoPuzzle", icon: "🧩", image: publicUrl("images/Grimlock.webp"), color: "#38bdf8", game: "photoPuzzle", stars: 0, unlocked: true },
  { id: "runner", icon: "🏃", image: publicUrl("images/optimus-pose.jpg"), color: "#f43f5e", game: "runner", stars: 0, unlocked: true },
];

// -------- Letters --------
export const WORDS: Record<Lang, string[]> = {
  de: [
    "DINO", "ROAR", "HORN", "ZAHN", "KLAUE",
    "ROBOT", "KRAFT", "STAHL", "FEUER", "LASER",
    "PANZER", "ENERGIE", "DRACHE", "BLITZ", "WACHE",
  ],
  bs: [
    "DINO", "RIKA", "ROG", "ZUB", "KANDZA",
    "ROBOT", "SNAGA", "CELIK", "VATRA", "LASER",
    "OKLOP", "ENERGIJA", "ZMAJ", "MUNJA", "STRAZ",
  ],
};

export const WORDS_BY_LEVEL: Record<Lang, string[][]> = {
  de: [
    ["DINO", "ROAR", "HORN", "ZAHN", "KLAUE"],
    ["ROBOT", "KRAFT", "STAHL", "FEUER", "LASER"],
    ["PANZER", "ENERGIE", "DRACHE", "BLITZ", "WACHE"],
  ],
  bs: [
    ["DINO", "RIKA", "ROG", "ZUB", "KANDZA"],
    ["ROBOT", "SNAGA", "CELIK", "VATRA", "LASER"],
    ["OKLOP", "ENERGIJA", "ZMAJ", "MUNJA", "STRAZ"],
  ],
};

// -------- Shared DinoBots --------
export const DINOBOTS = [
  { name: "Grimlock", emoji: "", image: publicUrl("images/Grimlock.webp"), color: "#ef4444" },
  // UPDATED: use new file dino.jpeg instead of trex2.jpg (so the new image is actually used)
  { name: "Swoop", emoji: "", image: publicUrl("images/dino.jpeg"), color: "#3b82f6" },
  { name: "Snarl", emoji: "", image: publicUrl("images/trex.jpg"), color: "#22c55e" },
  { name: "Sludge", emoji: "", image: publicUrl("images/trex-volcano.jpg"), color: "#a855f7" },
  { name: "Slag", emoji: "", image: publicUrl("images/bumblebee1.jpg"), color: "#f97316" },
  { name: "Slash", emoji: "", image: publicUrl("images/dinobot1.webp"), color: "#e11d48" },
  { name: "Paddles", emoji: "", image: publicUrl("images/bumblebee2.jpg"), color: "#0ea5e9" },
  { name: "Striker", emoji: "", image: publicUrl("images/optimus-face.jpg"), color: "#d97706" },
];

// -------- Colors --------
export const COLORS_LIST = [
  { key: "red", hex: "#ef4444", de: "Rot", bs: "Crvena" },
  { key: "blue", hex: "#3b82f6", de: "Blau", bs: "Plava" },
  { key: "green", hex: "#22c55e", de: "Gruen", bs: "Zelena" },
  { key: "yellow", hex: "#ffe66d", de: "Gelb", bs: "Zuta" },
  { key: "purple", hex: "#a855f7", de: "Lila", bs: "Ljubicaste" },
  { key: "orange", hex: "#f97316", de: "Orange", bs: "Narandzasta" },
  { key: "pink", hex: "#e11d48", de: "Pink", bs: "Roza" },
  { key: "cyan", hex: "#4ecdc4", de: "Tuerkis", bs: "Tirkizna" },
];

// -------- Counting --------
export const COUNTING_ITEMS = [
  { key: "bolt", emoji: "", image: publicUrl("images/optimus-face.jpg"), de: "Schrauben", bs: "Vijci" },
  { key: "star", emoji: "", image: publicUrl("images/optimus-pose.jpg"), de: "Sterne", bs: "Zvijezde" },
  { key: "dino", emoji: "", image: publicUrl("images/Grimlock.webp"), de: "Dinos", bs: "Dinosauri" },
  { key: "gear", emoji: "", image: publicUrl("images/trex.jpg"), de: "Zahnräder", bs: "Zupcanici" },
  { key: "orb", emoji: "", image: publicUrl("images/bumblebee3.webp"), de: "Kugeln", bs: "Kugle" },
  { key: "fire", emoji: "", image: publicUrl("images/trex-volcano.jpg"), de: "Feuer", bs: "Vatra" },
];

// -------- Patterns --------
export const PATTERN_IMAGES = [
  publicUrl("images/optimus-face.jpg"),
  publicUrl("images/optimus-fortnite.jpg"),
  publicUrl("images/optimus-pose.jpg"),
  publicUrl("images/optimus2.jpg"),
  publicUrl("images/optimus3.jpg"),
  publicUrl("images/optimus-grimlock.jpeg"),  // NEW
  publicUrl("images/transformers.jpg"),       // NEW
  publicUrl("images/Miniforce.webp"),         // NEW
  publicUrl("images/Grimlock.webp"),
  publicUrl("images/dinobot1.webp"),
  publicUrl("images/trex.jpg"),
  publicUrl("images/trex2.jpg"),
  publicUrl("images/trex-volcano.jpg"),
  publicUrl("images/dino.jpeg"),              // NEW
  publicUrl("images/bumblebee1.jpg"),
  publicUrl("images/bumblebee2.jpg"),
  publicUrl("images/bumblebee3.webp"),
];

// -------- Shapes --------
export type ShapeDef = {
  key: string;
  de: string;
  bs: string;
  render: (color: string, size: number) => JSX.Element;
};

const Svg = ({ size, children }: { size: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
    {children}
  </svg>
);

export const SHAPES: ShapeDef[] = [
  {
    key: "circle",
    de: "Kreis",
    bs: "Krug",
    render: (color, size) => (
      <Svg size={size}>
        <circle cx="50" cy="50" r="34" fill={color} stroke="#ffffff" strokeWidth="6" />
      </Svg>
    ),
  },
  {
    key: "square",
    de: "Quadrat",
    bs: "Kvadrat",
    render: (color, size) => (
      <Svg size={size}>
        <rect x="20" y="20" width="60" height="60" rx="8" fill={color} stroke="#ffffff" strokeWidth="6" />
      </Svg>
    ),
  },
  {
    key: "triangle",
    de: "Dreieck",
    bs: "Trougao",
    render: (color, size) => (
      <Svg size={size}>
        <path d="M50 18 L84 78 H16 Z" fill={color} stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    key: "diamond",
    de: "Raute",
    bs: "Romb",
    render: (color, size) => (
      <Svg size={size}>
        <path d="M50 14 L86 50 L50 86 L14 50 Z" fill={color} stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    key: "star",
    de: "Stern",
    bs: "Zvijezda",
    render: (color, size) => (
      <Svg size={size}>
        <path
          d="M50 12 L60 38 L88 38 L66 54 L74 80 L50 64 L26 80 L34 54 L12 38 L40 38 Z"
          fill={color}
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    key: "heart",
    de: "Herz",
    bs: "Srce",
    render: (color, size) => (
      <Svg size={size}>
        <path
          d="M50 78 C25 62 16 48 16 36 C16 26 24 20 34 20 C42 20 48 24 50 30 C52 24 58 20 66 20 C76 20 84 26 84 36 C84 48 75 62 50 78 Z"
          fill={color}
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
];
