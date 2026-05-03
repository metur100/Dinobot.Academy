export type SoundName = 'click' | 'success' | 'error' | 'bg';

// Mixed approach:
// - UI sfx: lightweight WebAudio beeps (no asset dependency)
// - Background music: HTMLAudioElement from /public (user provides file)

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

export const sounds = {
  setEnabled(v: boolean) {
    enabled = v;
    if (!enabled) {
      try { bgAudio?.pause(); } catch {}
    }
  },

  play(name: Exclude<SoundName, 'bg'>) {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      if (name === 'click') beep(520, 50, 'square', 0.03);
      if (name === 'success') { beep(740, 70, 'sine', 0.05); setTimeout(() => beep(988, 90, 'sine', 0.05), 80); }
      if (name === 'error') { beep(180, 120, 'sawtooth', 0.04); }
    } catch {
      // ignore
    }
  },

  startBg() {
    if (!enabled) return;
    try {
      if (!bgAudio) {
        // user will place: /public/daynigthmorning.(mp3/ogg/wav)
        // try without extension first? browsers need extension; so we assume mp3.
        bgAudio = new Audio('/daynigthmorning.mp3');
        bgAudio.loop = true;
        bgAudio.volume = 0.25;
      }
      bgAudio.play().catch(() => {
        // autoplay blocked until user gesture; caller already does pointerdown
      });
    } catch {
      // ignore
    }
  },

  stopBg() {
    try { bgAudio?.pause(); } catch {}
  },
};
