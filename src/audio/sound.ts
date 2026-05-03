import { publicUrl } from "../assets/url";

export type SoundName = "click" | "success" | "error" | "bg";

let audioCtx: AudioContext | null = null;
let bgAudio: HTMLAudioElement | null = null;
let enabled = true;

/** voice lines (one-shots) played on top of bg */
const VOICE_FILES = [publicUrl("music/optimus_prime_voice.mp3"), publicUrl("music/optimus_prime.mp3")] as const;

let voiceTimer: number | null = null;
let voicePlaying = false;

const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
};

const unlockAudio = async () => {
  // Helps on mobile Safari: ensure context resumed inside a gesture
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
  } catch {
    // ignore
  }
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

  bgAudio = new Audio(publicUrl("music/autobots.mp3"));
  bgAudio.loop = true;
  bgAudio.volume = 0.25;
  bgAudio.preload = "auto";

  // iOS sometimes needs this hint
  (bgAudio as any).playsInline = true;

  return bgAudio;
};

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickOne = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

const stopVoiceLoop = () => {
  if (voiceTimer !== null) {
    window.clearTimeout(voiceTimer);
    voiceTimer = null;
  }
  voicePlaying = false;
};

const scheduleNextVoice = () => {
  if (!enabled) return;

  // random gap between lines (seconds)
  const delaySec = randInt(18, 45);
  voiceTimer = window.setTimeout(() => {
    if (!enabled) return;

    // don't stack voice lines if something is already playing
    if (voicePlaying) {
      scheduleNextVoice();
      return;
    }

    const src = pickOne(VOICE_FILES);
    const v = new Audio(src);
    voicePlaying = true;

    v.volume = 0.75;
    v.preload = "auto";
    (v as any).playsInline = true;

    const done = () => {
      v.onended = null;
      v.onerror = null;
      voicePlaying = false;
      scheduleNextVoice();
    };

    v.onended = done;
    v.onerror = done;

    v.play().catch(() => {
      // autoplay restrictions or load error
      done();
    });
  }, delaySec * 1000);
};

const startVoiceLoop = () => {
  if (voiceTimer !== null) return;
  scheduleNextVoice();
};

export const sounds = {
  setEnabled(v: boolean) {
    enabled = v;

    if (!enabled) {
      try {
        bgAudio?.pause();
      } catch {}
      stopVoiceLoop();
      return;
    }
    // enabled again: will resume on next user gesture calling startBg()
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

  async startBg() {
    if (!enabled) return;

    // Must run inside a user gesture for mobile
    await unlockAudio();

    try {
      const a = ensureBg();

      // If already playing, don’t restart
      if (!a.paused) {
        startVoiceLoop();
        return;
      }

      await a.play();
      startVoiceLoop();
    } catch {
      // autoplay blocked until user gesture OR file not found.
      // Tip for debugging: open DevTools Network tab and check /Dinobot.Academy/music/autobots.mp3 loads (200).
    }
  },

  stopBg() {
    try {
      bgAudio?.pause();
      if (bgAudio) bgAudio.currentTime = 0;
    } catch {}
    stopVoiceLoop();
  },

  setBgVolume(v: number) {
    try {
      const a = ensureBg();
      a.volume = Math.max(0, Math.min(1, v));
    } catch {}
  },

  setVoiceVolume(v: number) {
    void v;
    // one-shots are created per play; if you want global control, store desired volume in a variable.
  },
};
