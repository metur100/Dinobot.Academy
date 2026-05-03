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

type SortMode = "mixed" | "easy";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const PhotoPuzzleGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [size, setSize] = useState<3 | 4 | 5>(3);
  const [photo, setPhoto] = useState(PHOTOS[0]);

  const total = size * size;

  const [tray, setTray] = useState<number[]>(() => shuffle(range(total)));
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [moves, setMoves] = useState(0);

  // UI controls
  const [sortMode, setSortMode] = useState<SortMode>("mixed");

  // responsive width
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = vw < 860;

  // Board tile size: fit screen width nicely (and cap for tablets/desktop)
  const boardTile = useMemo(() => {
    // container width (approx): screen - paddings
    const container = clamp(vw - 32, 320, 980);
    const gap = 10;
    const maxBoardWidth = isMobile ? container : Math.min(container, 520);
    const tile = Math.floor((maxBoardWidth - gap * (size - 1)) / size);
    const tileClamped = clamp(tile, size === 5 ? 52 : 64, size === 3 ? 132 : 110);
    return { tile: tileClamped, gap, boardPx: tileClamped * size + gap * (size - 1) };
  }, [vw, size, isMobile]);

  // Tray tile size: smaller than board
  const trayTile = useMemo(() => {
    const t = Math.floor(boardTile.tile * 0.72);
    return clamp(t, 44, 92);
  }, [boardTile.tile]);

  const reset = (newSize = size, newPhoto = photo) => {
    const t = newSize * newSize;
    setSize(newSize as any);
    setPhoto(newPhoto);
    setTray(shuffle(range(t)));
    setSlots(Array(t).fill(null));
    setMoves(0);
  };

  const isComplete = slots.every((v, idx) => v === idx);
  const stars = isComplete ? (moves <= total + 3 ? 3 : moves <= total * 2 ? 2 : 1) : 0;

  // Drag & drop
  const onDragStartPiece = (e: React.DragEvent, pieceIndex: number) => {
    e.dataTransfer.setData("text/piece", String(pieceIndex));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropToSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const piece = Number(e.dataTransfer.getData("text/piece"));
    if (Number.isNaN(piece)) return;

    setSlots((prev) => {
      if (prev[slotIndex] !== null) return prev; // filled
      const next = [...prev];
      next[slotIndex] = piece;
      return next;
    });

    setTray((prev) => prev.filter((x) => x !== piece));
    setMoves((m) => m + 1);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const claim = () => {
    if (!isComplete) return;
    onComplete(stars, `Size: ${size}x${size}, Moves: ${moves}`);
  };

  // Sorting tray order (optional “easy mode”: show pieces in correct order)
  const trayView = useMemo(() => {
    if (sortMode === "easy") return [...tray].sort((a, b) => a - b);
    return tray;
  }, [tray, sortMode]);

  const boardGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${size}, ${boardTile.tile}px)`,
    gap: boardTile.gap,
    width: boardTile.boardPx,
    margin: "0 auto",
  };

  const tileStyle = (w: number, filled: boolean): React.CSSProperties => ({
    width: w,
    height: w,
    borderRadius: Math.max(12, Math.floor(w * 0.14)),
    border: "2px solid rgba(255,255,255,0.14)",
    background: filled ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.18)",
    boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
    overflow: "hidden",
    position: "relative",
    touchAction: "none",
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

  const headerBtnStyle: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 14,
    fontWeight: 900,
    border: "2px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
  };

  return (
    <GameShell onBack={onBack} current={0} total={0} score={0}>
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ fontWeight: 900, fontSize: "clamp(1.2rem, 4.6vw, 1.8rem)", marginBottom: 12 }}>
          Photo Puzzle
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
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
                <img src={p} alt="pick" style={{ width: 62, height: 62, borderRadius: 14, objectFit: "cover" }} />
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", fontWeight: 900, fontSize: "1.05rem" }}>Moves: {moves}</div>
        </div>

        {/* Main layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* Board FIRST on mobile */}
          <div style={{ order: isMobile ? 0 : 1 }}>
            <div style={{ fontWeight: 900, marginBottom: 10, fontSize: "1.15rem" }}>Board</div>

            <div style={boardGridStyle}>
              {range(total).map((slotIndex) => {
                const filledPiece = slots[slotIndex];
                return (
                  <div
                    key={slotIndex}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDropToSlot(e, slotIndex)}
                    style={tileStyle(boardTile.tile, filledPiece !== null)}
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

              <div style={{ width: "100%" }} />

              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, opacity: 0.85 }}>Tray order</div>
                <button
                  onClick={() => setSortMode("mixed")}
                  style={{
                    ...headerBtnStyle,
                    opacity: sortMode === "mixed" ? 1 : 0.7,
                    border: sortMode === "mixed" ? "3px solid #ffe66d" : headerBtnStyle.border,
                  }}
                >
                  Mixed
                </button>
                <button
                  onClick={() => setSortMode("easy")}
                  style={{
                    ...headerBtnStyle,
                    opacity: sortMode === "easy" ? 1 : 0.7,
                    border: sortMode === "easy" ? "3px solid #ffe66d" : headerBtnStyle.border,
                  }}
                >
                  Easy
                </button>
              </div>
            </div>
          </div>

          {/* Tray SECOND on mobile */}
          <div style={{ order: isMobile ? 1 : 0 }}>
            <div style={{ fontWeight: 900, marginBottom: 10, fontSize: "1.15rem" }}>
              Pieces ({tray.length})
            </div>

            {/* Tray grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(auto-fill, minmax(${trayTile}px, 1fr))`,
                gap: 10,
                alignItems: "start",
              }}
            >
              {trayView.map((pieceIndex) => (
                <div
                  key={pieceIndex}
                  draggable
                  onDragStart={(e) => onDragStartPiece(e, pieceIndex)}
                  style={{
                    ...tileStyle(trayTile, true),
                    width: "100%",
                    aspectRatio: "1 / 1",
                    cursor: "grab",
                  }}
                >
                  <img src={photo} alt="piece" style={pieceImageStyle(pieceIndex, trayTile)} />
                </div>
              ))}
            </div>

            {/* small helper */}
            <div style={{ marginTop: 10, opacity: 0.65, fontSize: "0.9rem", textAlign: isMobile ? "center" : "left" }}>
              Drag a piece onto the matching slot number.
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
};

export default PhotoPuzzleGame;
