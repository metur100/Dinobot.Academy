export type SoundName = "click" | "success" | "error" | "bg";

let audioCtx: AudioContext | null = null;
let bgAudio: HTMLAudioElement | null = null;
let enabled = true;

/** voice lines (one-shots) played on top of bg */
const VOICE_FILES = ["/music/optimus_prime_voice.mp3", "/music/optimus_prime.mp3"] as const;

let voiceTimer: number | null = null;
let voicePlaying = false;

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

  bgAudio = new Audio("/music/autobots.mp3");
  bgAudio.loop = true;
  bgAudio.volume = 0.25;
  bgAudio.preload = "auto";
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
    // if disabled in-between
    if (!enabled) return;

    // don't stack voice lines if something is already playing
    if (voicePlaying) {
      scheduleNextVoice();
      return;
    }

    const src = pickOne(VOICE_FILES);
    const v = new Audio(src);
    voicePlaying = true;

    // voice volume a bit louder than bg; tweak as you like
    v.volume = 0.75;
    v.preload = "auto";

    const done = () => {
      v.onended = null;
      v.onerror = null;
      voicePlaying = false;
      scheduleNextVoice();
    };

    v.onended = done;
    v.onerror = done;

    // play on top of bg
    v.play().catch(() => {
      // autoplay restrictions or load error
      done();
    });
  }, delaySec * 1000);
};

const startVoiceLoop = () => {
  // start scheduling if not already running
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

    // enabled again: don't autoplay; will resume on next user gesture calling startBg()
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
      a.play()
        .then(() => {
          // once bg successfully starts, we can schedule voice lines
          startVoiceLoop();
        })
        .catch(() => {
          // autoplay blocked until user gesture
          // voice loop should not start until bg can actually play
        });
    } catch {
      // ignore
    }
  },

  stopBg() {
    try {
      bgAudio?.pause();
    } catch {}
    stopVoiceLoop();
  },

  setBgVolume(v: number) {
    try {
      const a = ensureBg();
      a.volume = Math.max(0, Math.min(1, v));
    } catch {}
  },

  /** Optional: set voice volume without changing bg */
  setVoiceVolume(v: number) {
    // one-shots are created per play; store desired value in a var if you want.
    // For now, tweak volume in code above (v.volume = 0.75).
    void v;
  },
};
