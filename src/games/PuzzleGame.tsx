import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DINOBOTS } from "../data/gameData";
import { useLang } from "../data/LangContext";
import DinoBot from "../components/DinoBot";
import WinScreen from "../components/WinScreen";
import { publicUrl } from "../assets/url";

interface Props {
  onComplete: (s: number) => void;
  onBack: () => void;
}

type LevelDef = { size: 3 | 4 | 5 };

// 3 levels: 3x3, 4x4, 5x5
const LEVELS: LevelDef[] = [{ size: 3 }, { size: 4 }, { size: 5 }];

// Put your “16 images” here (add/remove freely).
// These should match your public/images filenames.
const IMAGE_POOL: string[] = [
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
  // you can include bumblebee3.webp too if you want 17:
  // publicUrl("images/bumblebee3.webp"),
];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PREVIEW_MS = 2000;     // preview 2 seconds
const REPREVIEW_MS = 2000;   // preview again button: 2 seconds

type GameLevelState = {
  size: number;
  // solutionImages[slotIndex] => image url that belongs there
  solutionImages: string[];
  // trayImages is shuffled set of images the user can pick from (same set as solutionImages)
  trayImages: string[];
  // placedImages[slotIndex] => image url placed, or null
  placedImages: (string | null)[];
  selectedImage: string | null;
};

function buildLevelState(size: number): GameLevelState {
  const total = size * size;

  // Use as many unique images as possible, repeat if not enough for 5x5.
  // (If you want “no repeats ever”, you MUST provide >=25 images for 5x5.)
  const base = shuffle(IMAGE_POOL);
  const solution: string[] = [];
  for (let i = 0; i < total; i++) solution.push(base[i % base.length]);

  const tray = shuffle(solution);

  return {
    size,
    solutionImages: solution,
    trayImages: tray,
    placedImages: Array(total).fill(null),
    selectedImage: null,
  };
}

const imgCover: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  userSelect: "none",
  pointerEvents: "none",
};

const PuzzleGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const { lang, t } = useLang();

  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];

  const [state, setState] = useState<GameLevelState>(() => buildLevelState(level.size));
  const [score, setScore] = useState(0); // levels completed
  const [power, setPower] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [showPreview, setShowPreview] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [correctFlash, setCorrectFlash] = useState<number | null>(null);

  const dinobot = DINOBOTS[5];

  // Reset state when levelIndex changes
  useEffect(() => {
    const s = buildLevelState(LEVELS[levelIndex].size);
    setState(s);
    setShowPreview(true);
    setElapsed(0);
    setStartTime(Date.now());
  }, [levelIndex]);

  // Timer
  useEffect(() => {
    if (gameOver || showPreview) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(id);
  }, [gameOver, showPreview, startTime]);

  // Hide preview after 2s
  useEffect(() => {
    if (!showPreview) return;
    const id = setTimeout(() => {
      setShowPreview(false);
      setStartTime(Date.now());
    }, PREVIEW_MS);
    return () => clearTimeout(id);
  }, [showPreview]);

  const totalSlots = state.size * state.size;
  const solvedCount = state.placedImages.filter(Boolean).length;

  const isLevelComplete = useMemo(() => {
    if (state.placedImages.some((x) => x === null)) return false;
    // Must match exactly each slot
    for (let i = 0; i < totalSlots; i++) {
      if (state.placedImages[i] !== state.solutionImages[i]) return false;
    }
    return true;
  }, [state.placedImages, state.solutionImages, totalSlots]);

  useEffect(() => {
    if (!isLevelComplete) return;

    setScore((s) => s + 1);
    setPower((p) => Math.min(100, p + 25));

    const id = setTimeout(() => {
      if (levelIndex >= LEVELS.length - 1) {
        setGameOver(true);
      } else {
        setLevelIndex((i) => i + 1);
      }
    }, 600);

    return () => clearTimeout(id);
  }, [isLevelComplete, levelIndex]);

  const selectImage = useCallback((img: string) => {
    setState((s) => ({ ...s, selectedImage: s.selectedImage === img ? null : img }));
  }, []);

  const placeInSlot = useCallback((slotIdx: number) => {
    setState((s) => {
      if (!s.selectedImage) return s;
      if (s.placedImages[slotIdx] !== null) return s;

      const img = s.selectedImage;
      const isCorrect = img === s.solutionImages[slotIdx];

      if (!isCorrect) {
        setWrongFlash(slotIdx);
        window.setTimeout(() => setWrongFlash(null), 450);
        return { ...s, selectedImage: null };
      }

      const placed = [...s.placedImages];
      placed[slotIdx] = img;

      const tray = s.trayImages.filter((x) => x !== img);

      setCorrectFlash(slotIdx);
      window.setTimeout(() => setCorrectFlash(null), 450);
      setPower((p) => Math.min(100, p + 4));

      return { ...s, placedImages: placed, trayImages: tray, selectedImage: null };
    });
  }, []);

  const onShowPreviewAgain = () => {
    if (showPreview) return;
    setShowPreview(true);
    window.setTimeout(() => setShowPreview(false), REPREVIEW_MS);
  };

  const stars = score >= 3 ? 3 : score >= 2 ? 2 : 1;

  if (gameOver) {
    return (
      <WinScreen
        stars={stars}
        dinobot={dinobot}
        powerLevel={power}
        detail={`${t.puzzle.result} ${score}/${LEVELS.length}`}
        onBack={onBack}
        onClaim={() => onComplete(stars)}
      />
    );
  }

  // UI sizes
  const TILE = state.size === 3 ? 92 : state.size === 4 ? 78 : 64;
  const bankTile = 70;

  return (
    <div className="screen" style={{ gap: 16, justifyContent: "flex-start", paddingTop: 20 }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 680, alignItems: "center" }}>
        <button className="btn btn-muted" style={{ padding: "8px 16px", fontSize: "0.9rem" }} onClick={onBack}>
          {t.back}
        </button>

        <div style={{ fontFamily: "Fredoka One,cursive", fontSize: "1.1rem", color: "#ffe66d" }}>
          {levelIndex + 1}/{LEVELS.length} • {state.size}×{state.size}
        </div>

        <div style={{ fontSize: "0.95rem", color: "#7a8fa6" }}>{elapsed}s</div>
      </div>

      <DinoBot {...dinobot} powerLevel={power} size={70} animate={false} />

      {/* Preview overlay (shows the SOLUTION board) */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 18,
          }}
        >
          <div style={{ fontFamily: "Fredoka One,cursive", fontSize: "1.5rem", color: "#ffe66d", textAlign: "center" }}>
            {lang === "de" ? "Merke dir die Plätze!" : "Zapamti mjesta!"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${state.size}, ${TILE}px)`,
              gap: 6,
              padding: 14,
              borderRadius: 20,
              border: "4px solid rgba(255,230,109,0.55)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            {state.solutionImages.map((img, idx) => (
              <div
                key={idx}
                style={{
                  width: TILE,
                  height: TILE,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.18)",
                }}
              >
                <img src={img} alt="" style={imgCover} draggable={false} />
              </div>
            ))}
          </div>

          <div style={{ color: "#7a8fa6", fontSize: "0.95rem" }} className="pulse">
            {lang === "de" ? "2 Sekunden…" : "2 sekunde…"}
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ width: "100%", maxWidth: 680, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <button
          className="btn btn-muted"
          onClick={onShowPreviewAgain}
          disabled={showPreview}
          style={{ padding: "10px 16px", fontSize: "0.95rem", opacity: showPreview ? 0.6 : 1 }}
        >
          {lang === "de" ? "Vorschau zeigen" : "Pokaži pregled"}
        </button>

        {/* Progress */}
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ fontSize: "0.85rem", color: "#7a8fa6", marginBottom: 4 }}>
            {solvedCount}/{totalSlots} {lang === "de" ? "platziert" : "postavljeno"}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(solvedCount / totalSlots) * 100}%` }} />
          </div>
        </div>

        {/* Board */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${state.size}, ${TILE}px)`,
            gap: 8,
            padding: 14,
            borderRadius: 20,
            border: "4px solid rgba(78,205,196,0.45)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {state.placedImages.map((img, slotIdx) => {
            const filled = img !== null;
            const isCorrect = correctFlash === slotIdx;
            const isWrong = wrongFlash === slotIdx;

            return (
              <button
                key={slotIdx}
                onClick={() => !filled && placeInSlot(slotIdx)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  width: TILE,
                  height: TILE,
                  borderRadius: 14,
                  padding: 6,
                  background: isCorrect ? "#22c55e33" : isWrong ? "#ef444433" : filled ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.18)",
                  border: `3px solid ${
                    isCorrect ? "#22c55e" : isWrong ? "#ef4444" : filled ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.10)"
                  }`,
                  overflow: "hidden",
                  cursor: filled ? "default" : "pointer",
                }}
              >
                {filled ? (
                  <img src={img!} alt="" style={imgCover} draggable={false} />
                ) : (
                  <div style={{ width: "100%", height: "100%", borderRadius: 12, border: "2px dashed rgba(255,255,255,0.14)" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Tile bank (all different images) */}
        {state.trayImages.length > 0 && (
          <div style={{ width: "100%", maxWidth: 620 }}>
            <div style={{ fontFamily: "Fredoka One,cursive", fontSize: "1rem", color: "#7a8fa6", marginBottom: 8, textAlign: "center" }}>
              {lang === "de" ? "Wähle ein Bild" : "Izaberi sliku"}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "center",
                background: "var(--card)",
                borderRadius: 16,
                padding: 14,
                border: "2px solid #2a3a4a",
              }}
            >
              {state.trayImages.map((img, i) => {
                const sel = state.selectedImage === img;
                return (
                  <button
                    key={`${img}-${i}`}
                    onClick={() => selectImage(img)}
                    style={{
                      appearance: "none",
                      WebkitAppearance: "none",
                      width: bankTile,
                      height: bankTile,
                      borderRadius: 14,
                      padding: 6,
                      background: sel ? "rgba(255,230,109,0.12)" : "#1e2d3d",
                      border: `3px solid ${sel ? "#ffe66d" : "#2a3a4a"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      transform: sel ? "scale(1.06)" : "scale(1)",
                      boxShadow: sel ? "0 0 14px rgba(255,230,109,0.55)" : "none",
                      overflow: "hidden",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <img src={img} alt="" style={imgCover} draggable={false} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleGame;
