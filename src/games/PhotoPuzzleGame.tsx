import React, { useMemo, useState, useEffect } from "react";
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

const PhotoPuzzleGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [size, setSize] = useState<3 | 4 | 5>(3);
  const [photo, setPhoto] = useState(PHOTOS[0]);

  const total = size * size;

  const [tray, setTray] = useState<number[]>(() => shuffle(range(total)));
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [moves, setMoves] = useState(0);

  // Tap-to-place fallback (needed for mobile Safari)
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);

  // responsive width + touch detection
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  const [isTouch, setIsTouch] = useState(() => (typeof window !== "undefined" ? "ontouchstart" in window : false));

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    setIsTouch("ontouchstart" in window || (navigator as any).maxTouchPoints > 0);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = vw < 860;

  const reset = (newSize = size, newPhoto = photo) => {
    const t = newSize * newSize;
    setSize(newSize as any);
    setPhoto(newPhoto);
    setTray(shuffle(range(t)));
    setSlots(Array(t).fill(null));
    setMoves(0);
    setSelectedPiece(null);
  };

  const isComplete = slots.every((v, idx) => v === idx);
  const stars = isComplete ? (moves <= total + 3 ? 3 : moves <= total * 2 ? 2 : 1) : 0;

  const claim = () => {
    if (!isComplete) return;
    onComplete(stars, `Size: ${size}x${size}, Moves: ${moves}`);
  };

  // Board tile size: fit screen width
  const boardTile = useMemo(() => {
    const container = clamp(vw - 32, 320, 980);
    const gap = 10;
    const maxBoardWidth = isMobile ? container : Math.min(container, 520);
    const tile = Math.floor((maxBoardWidth - gap * (size - 1)) / size);
    const tileClamped = clamp(tile, size === 5 ? 54 : 66, size === 3 ? 132 : 112);
    return { tile: tileClamped, gap, boardPx: tileClamped * size + gap * (size - 1) };
  }, [vw, size, isMobile]);

  // Pieces tray tile size (smaller)
  const trayTile = useMemo(() => clamp(Math.floor(boardTile.tile * 0.72), 52, 96), [boardTile.tile]);

  const boardGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${size}, ${boardTile.tile}px)`,
    gap: boardTile.gap,
    width: boardTile.boardPx,
    margin: "0 auto",
  };

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

  // Desktop drag & drop (keep it for mouse devices)
  const onDragStartPiece = (e: React.DragEvent, pieceIndex: number) => {
    e.dataTransfer.setData("text/piece", String(pieceIndex));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropToSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const piece = Number(e.dataTransfer.getData("text/piece"));
    if (Number.isNaN(piece)) return;
    placePiece(piece, slotIndex);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Shared placement logic
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

  // Tap-to-place (mobile)
  const onTapPiece = (piece: number) => {
    if (selectedPiece === piece) setSelectedPiece(null);
    else setSelectedPiece(piece);
  };

  const onTapSlot = (slotIndex: number) => {
    if (selectedPiece === null) return;
    if (slots[slotIndex] !== null) return;
    placePiece(selectedPiece, slotIndex);
  };

  // Rounds like other games: show progress = placed tiles
  const placed = total - tray.length;
  const currentRound = isComplete ? total : placed + 1;

  const headerBtnStyle: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 14,
    fontWeight: 900,
    border: "2px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
  };

  return (
    <GameShell onBack={onBack} current={currentRound} total={total} score={moves}>
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ fontWeight: 900, fontSize: "clamp(1.2rem, 4.6vw, 1.8rem)", marginBottom: 12 }}>
          Photo Puzzle
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: "1.05rem" }}>Size</div>
          {[3, 4, 5].map((n) => (
            <button key={n} onClick={() => reset(n as any, photo)} style={headerBtnStyle}>
              {n}x{n}
            </button>
          ))}

          <div style={{ marginLeft: 8, fontWeight: 900, fontSize: "1.05rem" }}>Photo</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PHOTOS.map((p) => (
              <button
                key={p}
                onClick={() => reset(size, p)}
                style={{
                  padding: 6,
                  borderRadius: 16,
                  border: p === photo ? "3px solid #38bdf8" : "2px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                <img src={p} alt="pick" style={{ width: 58, height: 58, borderRadius: 14, objectFit: "cover" }} />
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", fontWeight: 900, fontSize: "1.05rem" }}>Moves: {moves}</div>
        </div>

        {/* Pieces at TOP (always visible) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8, fontSize: "1.15rem" }}>
            Pieces ({tray.length})
            {isTouch && (
              <span style={{ marginLeft: 10, opacity: 0.7, fontSize: "0.95rem", fontWeight: 800 }}>
                Tap a piece, then tap a slot
              </span>
            )}
          </div>

          {/* Horizontal tray: no hidden rows */}
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: 6,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {tray.map((pieceIndex) => {
              const isSel = selectedPiece === pieceIndex;
              return (
                <div
                  key={pieceIndex}
                  draggable={!isTouch}
                  onDragStart={!isTouch ? (e) => onDragStartPiece(e, pieceIndex) : undefined}
                  onClick={isTouch ? () => onTapPiece(pieceIndex) : undefined}
                  style={{
                    ...tileStyle(trayTile, true, isSel),
                    flex: "0 0 auto",
                    cursor: isTouch ? "pointer" : "grab",
                  }}
                >
                  <img src={photo} alt="piece" style={pieceImageStyle(pieceIndex, trayTile)} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Board + actions */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 10, fontSize: "1.15rem" }}>Board</div>

            <div style={boardGridStyle}>
              {range(total).map((slotIndex) => {
                const filledPiece = slots[slotIndex];

                // On touch: highlight empty slots if a piece is selected
                const highlight = isTouch && selectedPiece !== null && filledPiece === null;

                return (
                  <div
                    key={slotIndex}
                    onDragOver={!isTouch ? onDragOver : undefined}
                    onDrop={!isTouch ? (e) => onDropToSlot(e, slotIndex) : undefined}
                    onClick={isTouch ? () => onTapSlot(slotIndex) : undefined}
                    style={{
                      ...tileStyle(boardTile.tile, filledPiece !== null, highlight),
                      cursor: isTouch ? "pointer" : "default",
                    }}
                  >
                    {filledPiece !== null ? (
                      <img src={photo} alt="placed" style={pieceImageStyle(filledPiece, boardTile.tile)} />
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "grid",
                          placeItems: "center",
                          opacity: 0.25,
                          fontWeight: 900,
                          fontSize: "clamp(0.9rem, 2.6vw, 1.1rem)",
                        }}
                      >
                        {slotIndex + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => reset(size, photo)} style={{ ...headerBtnStyle, padding: "14px 18px", borderRadius: 16 }}>
                Reset
              </button>

              <button
                onClick={claim}
                disabled={!isComplete}
                style={{
                  ...headerBtnStyle,
                  padding: "14px 18px",
                  borderRadius: 16,
                  opacity: isComplete ? 1 : 0.45,
                  border: isComplete ? "3px solid #22c55e" : "2px solid rgba(255,255,255,0.12)",
                }}
              >
                Claim Stars ({stars || 0})
              </button>

              {isTouch && selectedPiece !== null && (
                <button
                  onClick={() => setSelectedPiece(null)}
                  style={{ ...headerBtnStyle, padding: "14px 18px", borderRadius: 16, border: "3px solid #ef4444" }}
                >
                  Cancel piece
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
};

export default PhotoPuzzleGame;
