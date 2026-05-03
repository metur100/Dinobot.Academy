export type SoundName = "click" | "success" | "error" | "bg";

// UI sfx: WebAudio beeps
// Background music: HTMLAudioElement from /public/music
let audioCtx: AudioContext | null = null;
let bgAudio: HTMLAudioElement | null = null;
let enabled = true;

const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
};

const beep = (freq: number, durMs: number, type: OscillatorType, gainVal: number) => {
  const ctx = getCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gainVal;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + durMs / 1000);
};

const ensureBg = () => {
  if (bgAudio) return bgAudio;

  // Your file: public/music/transformer_autobots.mp3
  bgAudio = new Audio("/music/transformer_autobots.mp3");
  bgAudio.loop = true;
  bgAudio.volume = 0.25;
  bgAudio.preload = "auto";
  return bgAudio;
};

export const sounds = {
  setEnabled(v: boolean) {
    enabled = v;
    if (!enabled) {
      try {
        bgAudio?.pause();
      } catch {}
    } else {
      // if re-enabled, don't auto-play; user gesture will start it
    }
  },

  play(name: Exclude<SoundName, "bg">) {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      if (ctx.state === "suspended") ctx.resume();
      if (name === "click") beep(520, 50, "square", 0.03);
      if (name === "success") {
        beep(740, 70, "sine", 0.05);
        setTimeout(() => beep(988, 90, "sine", 0.05), 80);
      }
      if (name === "error") beep(180, 120, "sawtooth", 0.04);
    } catch {
      // ignore
    }
  },

  startBg() {
    if (!enabled) return;
    try {
      const a = ensureBg();
      a.play().catch(() => {
        // autoplay blocked until a user gesture
      });
    } catch {
      // ignore
    }
  },

  stopBg() {
    try {
      bgAudio?.pause();
    } catch {}
  },

  setBgVolume(v: number) {
    try {
      const a = ensureBg();
      a.volume = Math.max(0, Math.min(1, v));
    } catch {}
  },
};
