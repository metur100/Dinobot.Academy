import React, { useEffect, useMemo, useState } from "react";
import GameShell from "../components/GameShell";
import { PHOTO_POOL } from "../assets/images";

type Props = { onComplete: (stars: number, detail: string) => void; onBack: () => void };

const PHOTOS = PHOTO_POOL;

function range(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

type Level = { size: 3 | 4 | 5; photo: string };

const buildLevels = (): Level[] => {
  const sizes: (3 | 4 | 5)[] = [3, 3, 3, 4, 4, 4, 5, 5, 5];
  const photos: string[] = [];
const start = PHOTOS.length > 1 ? 1 : 0; // skip first if possible
for (let i = 0; i < 9; i++) photos.push(PHOTOS[(start + i) % PHOTOS.length]);

  return sizes.map((s, i) => ({ size: s, photo: photos[i] }));
};

const PhotoPuzzleGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  const [vh, setVh] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 768));
  const [isTouch, setIsTouch] = useState(() => (typeof window !== "undefined" ? "ontouchstart" in window : false));

  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    setIsTouch("ontouchstart" in window || (navigator as any).maxTouchPoints > 0);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const levels = useMemo(() => buildLevels(), []);
  const [levelIndex, setLevelIndex] = useState(0);

  const level = levels[levelIndex];
  const size = level.size;
  const photo = level.photo;

  const total = size * size;

  const [tray, setTray] = useState<number[]>(() => shuffle(range(total)));
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [moves, setMoves] = useState(0);

  // OLD logic: click piece, then click slot (no “toggle select” needed)
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);

  const resetBoardForLevel = (idx: number) => {
    const lv = levels[idx];
    const t = lv.size * lv.size;
    setTray(shuffle(range(t)));
    setSlots(Array(t).fill(null));
    setMoves(0);
    setSelectedPiece(null);
  };

  useEffect(() => {
    resetBoardForLevel(levelIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  const isComplete = slots.length === total && slots.every((v, i) => v === i);

  useEffect(() => {
    if (!isComplete) return;
    const t = window.setTimeout(() => {
      if (levelIndex < levels.length - 1) setLevelIndex((i) => i + 1);
      else onComplete(3, `Finished 9 levels. Moves last level: ${moves}`);
    }, 700);
    return () => window.clearTimeout(t);
  }, [isComplete, levelIndex, levels.length, moves, onComplete]);

  // --- No vertical scroll sizing ---
  const gap = 10;
  const pad = 16;
  const maxW = clamp(vw - pad * 2, 320, 980);
  const maxH = clamp(vh - pad * 2 - 90, 420, 1100);

  const trayCols = useMemo(() => {
    const targetRows = vw < 420 ? 2 : 3;
    return clamp(Math.ceil(total / targetRows), 4, 10);
  }, [total, vw]);

  const sizesPx = useMemo(() => {
    const boardTileByWidth = Math.floor((maxW - gap * (size - 1)) / size);

    const trayTile1 = clamp(Math.floor(boardTileByWidth * 0.62), 44, 86);
    const trayRows = Math.ceil(total / trayCols);
    const trayH = trayRows * trayTile1 + gap * (trayRows - 1);

    const remainForBoard = maxH - trayH - 14;
    const boardTileByHeight = Math.floor((remainForBoard - gap * (size - 1)) / size);

    const boardTile = clamp(
      Math.min(boardTileByWidth, boardTileByHeight),
      size === 5 ? 52 : 62,
      size === 3 ? 140 : 120
    );

    const trayTile = clamp(Math.floor(boardTile * 0.62), 44, 86);

    return {
      boardTile,
      trayTile,
      boardW: boardTile * size + gap * (size - 1),
    };
  }, [maxW, maxH, size, total, trayCols]);

  const tileStyle = (w: number, filled: boolean, highlight = false): React.CSSProperties => ({
    width: w,
    height: w,
    borderRadius: Math.max(12, Math.floor(w * 0.14)),
    border: highlight ? "3px solid #ffe66d" : "2px solid rgba(255,255,255,0.14)",
    background: filled ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.18)",
    boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
    overflow: "hidden",
    position: "relative",
    touchAction: "manipulation",
  });

  const pieceImageStyle = (pieceIndex: number, tileW: number): React.CSSProperties => {
    const x = pieceIndex % size;
    const y = Math.floor(pieceIndex / size);
    return {
      width: tileW * size,
      height: tileW * size,
      objectFit: "cover",
      transform: `translate(${-x * tileW}px, ${-y * tileW}px)`,
      userSelect: "none",
      pointerEvents: "none",
    };
  };

  const placePiece = (piece: number, slotIndex: number) => {
    setSlots((prev) => {
      if (prev[slotIndex] !== null) return prev;
      const next = [...prev];
      next[slotIndex] = piece;
      return next;
    });
    setTray((prev) => prev.filter((x) => x !== piece));
    setMoves((m) => m + 1);
    setSelectedPiece(null);
  };

  // RETURN piece if wrong: click placed tile -> return to tray
  const returnPiece = (slotIndex: number) => {
    setSlots((prev) => {
      const piece = prev[slotIndex];
      if (piece === null) return prev;

      const next = [...prev];
      next[slotIndex] = null;

      // put it back to tray front
      setTray((tr) => [piece, ...tr]);
      setMoves((m) => m + 1);
      setSelectedPiece(null);

      return next;
    });
  };

  // OLD click-and-place behavior:
  // - click piece => selected
  // - click empty slot => place selected
  // - click filled slot => return that piece to tray
  const onClickPiece = (piece: number) => {
    setSelectedPiece(piece);
  };

  const onClickSlot = (slotIndex: number) => {
    const filled = slots[slotIndex];
    if (filled !== null) {
      returnPiece(slotIndex);
      return;
    }
    if (selectedPiece === null) return;
    placePiece(selectedPiece, slotIndex);
  };

  // optional desktop drag
  const onDragStartPiece = (e: React.DragEvent, pieceIndex: number) => {
    e.dataTransfer.setData("text/piece", String(pieceIndex));
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDropToSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const piece = Number(e.dataTransfer.getData("text/piece"));
    if (Number.isNaN(piece)) return;
    if (slots[slotIndex] !== null) return;
    placePiece(piece, slotIndex);
  };

  return (
    <GameShell onBack={onBack} current={levelIndex + 1} total={levels.length} score={moves}>
      <div style={{ width: "100%", maxWidth: 980, margin: "0 auto" }}>
        {/* PIECES */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${trayCols}, minmax(0, ${sizesPx.trayTile}px))`,
            gap,
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          {tray.map((pieceIndex) => {
            const isSel = selectedPiece === pieceIndex;
            return (
              <div
                key={pieceIndex}
                draggable={!isTouch}
                onDragStart={!isTouch ? (e) => onDragStartPiece(e, pieceIndex) : undefined}
                onClick={() => onClickPiece(pieceIndex)}
                style={{
                  ...tileStyle(sizesPx.trayTile, true, isSel),
                  cursor: "pointer",
                }}
              >
                <img src={photo} alt="" style={pieceImageStyle(pieceIndex, sizesPx.trayTile)} />
              </div>
            );
          })}
        </div>

        {/* BOARD */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${size}, ${sizesPx.boardTile}px)`,
            gap,
            width: sizesPx.boardW,
            margin: "0 auto",
          }}
        >
          {range(total).map((slotIndex) => {
            const filledPiece = slots[slotIndex];
            const highlight = selectedPiece !== null && filledPiece === null;

            return (
              <div
                key={slotIndex}
                onDragOver={!isTouch ? onDragOver : undefined}
                onDrop={!isTouch ? (e) => onDropToSlot(e, slotIndex) : undefined}
                onClick={() => onClickSlot(slotIndex)}
                style={{
                  ...tileStyle(sizesPx.boardTile, filledPiece !== null, highlight),
                  cursor: "pointer",
                }}
              >
                {filledPiece !== null ? (
                  <img src={photo} alt="" style={pieceImageStyle(filledPiece, sizesPx.boardTile)} />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      opacity: 0.18,
                      fontWeight: 900,
                      fontSize: "1.05rem",
                    }}
                  >
                    {slotIndex + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};

export default PhotoPuzzleGame;
