import React, { useEffect, useMemo, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import { PHOTO_POOL } from "../assets/images";

type Props = { onComplete: (stars: number, detail: string) => void; onBack: () => void };

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

const pickRandomPhotos = (count: number) => {
  if (PHOTO_POOL.length === 0) return [];
  const pool = shuffle(PHOTO_POOL);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
  return out;
};

const buildLevels = (): Level[] => {
  const sizes: (3 | 4 | 5)[] = [3, 3, 3, 4, 4, 4, 5, 5, 5];
  const photos = pickRandomPhotos(9);
  return sizes.map((s, i) => ({ size: s, photo: photos[i] }));
};

type DragFrom =
  | { kind: "tray"; piece: number; indexInTray: number }
  | { kind: "board"; piece: number; slotIndex: number };

const PhotoPuzzleGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  const [vh, setVh] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 768));

  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
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

  const isComplete = slots.length === total && slots.every((v, i) => v === i);

  useEffect(() => {
    if (!isComplete) return;
    const t = window.setTimeout(() => {
      if (levelIndex < levels.length - 1) setLevelIndex((i) => i + 1);
      else onComplete(3, `Finished 9 levels. Moves last level: ${moves}`);
    }, 700);
    return () => window.clearTimeout(t);
  }, [isComplete, levelIndex, levels.length, moves, onComplete]);

  // ---- sizing
  const pad = 16;
  const maxW = clamp(vw - pad * 2, 320, 980);
  const maxH = clamp(vh - pad * 2 - 90, 420, 1100);

  // IMPORTANT: smaller gaps so image is recognizable
  const boardGap = clamp(Math.round(maxW * 0.006), 2, 6); // 2..6
  const trayGap = clamp(Math.round(maxW * 0.012), 6, 12); // 6..12

  const trayCols = useMemo(() => {
    const targetRows = vw < 420 ? 2 : 3;
    return clamp(Math.ceil(total / targetRows), 4, 10);
  }, [total, vw]);

  const sizesPx = useMemo(() => {
    // board tiles, account for boardGap
    const boardTileByWidth = Math.floor((maxW - boardGap * (size - 1)) / size);

    // tray tiles based on board, account for trayGap
    const trayTile1 = clamp(Math.floor(boardTileByWidth * 0.62), 44, 92);
    const trayRows = Math.ceil(total / trayCols);
    const trayH = trayRows * trayTile1 + trayGap * (trayRows - 1);

    // reference preview height: keep smaller but clear
    const previewH = clamp(Math.floor(maxH * 0.22), 120, 240);

    const remainForBoard = maxH - trayH - previewH - 24;
    const boardTileByHeight = Math.floor((remainForBoard - boardGap * (size - 1)) / size);

    const boardTile = clamp(
      Math.min(boardTileByWidth, boardTileByHeight),
      size === 5 ? 54 : 64,
      size === 3 ? 150 : 125
    );

    const trayTile = clamp(Math.floor(boardTile * 0.62), 44, 92);

    return {
      boardTile,
      trayTile,
      boardW: boardTile * size + boardGap * (size - 1),
      previewH,
    };
  }, [maxW, maxH, size, total, trayCols, boardGap, trayGap]);

  // ---- shared “crop wrapper” so board + reference match 1:1
  const cropWrapStyle = (w: number): React.CSSProperties => ({
    width: w,
    height: w, // square => same crop basis as the puzzle board
    overflow: "hidden",
    borderRadius: Math.max(12, Math.floor(w * 0.14)),
    position: "relative",
    background: "rgba(0,0,0,0.18)",
  });

  const tileFrameStyle = (w: number, filled: boolean, highlight = false): React.CSSProperties => ({
    width: w,
    height: w,
    borderRadius: Math.max(12, Math.floor(w * 0.14)),
    border: highlight ? "3px solid #ffe66d" : "2px solid rgba(255,255,255,0.14)",
    background: filled ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.18)",
    boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
    overflow: "hidden",
    position: "relative",
    touchAction: "none",
    userSelect: "none",
  });

  // This draws the correct “piece” from the SAME square-cropped image.
  const pieceImageStyle = (pieceIndex: number, tileW: number): React.CSSProperties => {
    const x = pieceIndex % size;
    const y = Math.floor(pieceIndex / size);
    return {
      width: tileW * size,
      height: tileW * size,
      objectFit: "cover",
      transform: `translate(${-x * tileW}px, ${-y * tileW}px)`,
      pointerEvents: "none",
      userSelect: "none",
      display: "block",
    };
  };

  // -------------------------
  // Drag + Drop (pointer-based)
  // -------------------------
  const boardSlotEls = useRef<(HTMLDivElement | null)[]>([]);
  const trayContainerRef = useRef<HTMLDivElement | null>(null);

  const [dragging, setDragging] = useState<{
    from: DragFrom;
    piece: number;
    x: number;
    y: number;
    ghostW: number;
  } | null>(null);

  const stopDragging = () => setDragging(null);

  const resetBoardForLevel = (idx: number) => {
    const lv = levels[idx];
    const t = lv.size * lv.size;
    setTray(shuffle(range(t)));
    setSlots(Array(t).fill(null));
    setMoves(0);
    stopDragging();
  };

  useEffect(() => {
    resetBoardForLevel(levelIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  const pointToTarget = (x: number, y: number): { kind: "board"; slotIndex: number } | { kind: "tray" } | null => {
    for (let i = 0; i < boardSlotEls.current.length; i++) {
      const el = boardSlotEls.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { kind: "board", slotIndex: i };
    }
    const trayEl = trayContainerRef.current;
    if (trayEl) {
      const r = trayEl.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { kind: "tray" };
    }
    return null;
  };

  const removeFromTray = (piece: number) => setTray((prev) => prev.filter((p) => p !== piece));
  const addToTrayFront = (piece: number) => setTray((prev) => [piece, ...prev]);

  const clearBoardSlot = (slotIndex: number) => {
    setSlots((prev) => {
      if (prev[slotIndex] === null) return prev;
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const setBoardSlot = (slotIndex: number, piece: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = piece;
      return next;
    });
  };

  const handleDrop = (dropX: number, dropY: number) => {
    if (!dragging) return;

    const target = pointToTarget(dropX, dropY);
    const piece = dragging.piece;
    const from = dragging.from;

    if (!target) {
      stopDragging();
      return;
    }

    if (target.kind === "tray") {
      if (from.kind === "board") {
        clearBoardSlot(from.slotIndex);
        addToTrayFront(piece);
        setMoves((m) => m + 1);
      }
      stopDragging();
      return;
    }

    const slotIndex = target.slotIndex;
    const filled = slots[slotIndex];

    if (from.kind === "tray") {
      if (filled !== null) {
        // swap tray->board
        setBoardSlot(slotIndex, piece);
        removeFromTray(piece);
        addToTrayFront(filled);
        setMoves((m) => m + 1);
        stopDragging();
        return;
      }
      setBoardSlot(slotIndex, piece);
      removeFromTray(piece);
      setMoves((m) => m + 1);
      stopDragging();
      return;
    }

    // from board
    if (from.slotIndex === slotIndex) {
      stopDragging();
      return;
    }

    if (filled === null) {
      clearBoardSlot(from.slotIndex);
      setBoardSlot(slotIndex, piece);
      setMoves((m) => m + 1);
      stopDragging();
      return;
    }

    // swap board<->board
    clearBoardSlot(from.slotIndex);
    setBoardSlot(from.slotIndex, filled);
    setBoardSlot(slotIndex, piece);
    setMoves((m) => m + 1);
    stopDragging();
  };

  const onPointerDownTray = (e: React.PointerEvent, piece: number, indexInTray: number) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging({
      from: { kind: "tray", piece, indexInTray },
      piece,
      x: e.clientX,
      y: e.clientY,
      ghostW: sizesPx.boardTile,
    });
  };

  const onPointerDownBoard = (e: React.PointerEvent, slotIndex: number, piece: number) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging({
      from: { kind: "board", piece, slotIndex },
      piece,
      x: e.clientX,
      y: e.clientY,
      ghostW: sizesPx.boardTile,
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    handleDrop(e.clientX, e.clientY);
  };

  const onPointerCancel = () => stopDragging();

  const hoverTarget = useMemo(() => {
    if (!dragging) return null;
    const t = pointToTarget(dragging.x, dragging.y);
    if (t && t.kind === "board") return t.slotIndex;
    return null;
  }, [dragging, slots]);

  const isPieceBeingDraggedFromTray = (piece: number) =>
    dragging?.from.kind === "tray" && dragging.piece === piece;

  const isPieceBeingDraggedFromBoard = (slotIndex: number) =>
    dragging?.from.kind === "board" && dragging.from.slotIndex === slotIndex;

  const ghostStyle: React.CSSProperties =
    dragging
      ? {
          position: "fixed",
          left: dragging.x,
          top: dragging.y,
          transform: "translate(-50%, -50%)",
          width: dragging.ghostW,
          height: dragging.ghostW,
          zIndex: 9999,
          pointerEvents: "none",
        }
      : {};

  return (
    <GameShell onBack={onBack} current={levelIndex + 1} total={levels.length} score={moves}>
      <div
        style={{ width: "100%", maxWidth: 980, margin: "0 auto" }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* TOP: TRAY */}
        <div
          ref={trayContainerRef}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${trayCols}, minmax(0, ${sizesPx.trayTile}px))`,
            gap: trayGap,
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          {tray.map((pieceIndex, indexInTray) => {
            const hidden = isPieceBeingDraggedFromTray(pieceIndex);
            return (
              <div
                key={`${pieceIndex}-${indexInTray}`}
                onPointerDown={(e) => onPointerDownTray(e, pieceIndex, indexInTray)}
                style={{
                  ...tileFrameStyle(sizesPx.trayTile, true, false),
                  cursor: "grab",
                  opacity: hidden ? 0.2 : 1,
                }}
              >
                <div style={{ position: "absolute", inset: 0 }}>
                  <div style={cropWrapStyle(sizesPx.trayTile)}>
                    {!hidden && <img src={photo} alt="" style={pieceImageStyle(pieceIndex, sizesPx.trayTile)} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MIDDLE: BOARD */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${size}, ${sizesPx.boardTile}px)`,
            gap: boardGap,
            width: sizesPx.boardW,
            margin: "0 auto",
          }}
        >
          {range(total).map((slotIndex) => {
            const filledPiece = slots[slotIndex];
            const highlight = hoverTarget === slotIndex;

            return (
              <div
                key={slotIndex}
                ref={(el) => {
                  boardSlotEls.current[slotIndex] = el;
                }}
                style={{
                  ...tileFrameStyle(sizesPx.boardTile, filledPiece !== null, highlight),
                  cursor: filledPiece !== null ? "grab" : "default",
                }}
              >
                {filledPiece !== null ? (
                  <div onPointerDown={(e) => onPointerDownBoard(e, slotIndex, filledPiece)} style={{ position: "absolute", inset: 0 }}>
                    <div style={cropWrapStyle(sizesPx.boardTile)}>
                      {!isPieceBeingDraggedFromBoard(slotIndex) && (
                        <img src={photo} alt="" style={pieceImageStyle(filledPiece, sizesPx.boardTile)} />
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      opacity: 0.14,
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

        {/* BOTTOM: REFERENCE IMAGE (same crop as board) */}
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", width: "100%" }}>
          <div
            style={{
              width: Math.min(sizesPx.boardW, 520),
              maxWidth: "100%",
              borderRadius: 18,
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.18)",
              boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
              padding: 10,
            }}
          >
            {/* square crop wrapper => EXACT same crop basis as the board */}
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: 14,
                overflow: "hidden",
                background: "rgba(0,0,0,0.18)",
              }}
            >
              <img
                src={photo}
                alt=""
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover", // crop is now identical to the board because container is square too
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>

        {/* DRAG GHOST */}
        {dragging && (
          <div style={ghostStyle}>
            <div style={cropWrapStyle(dragging.ghostW)}>
              <img src={photo} alt="" style={pieceImageStyle(dragging.piece, dragging.ghostW)} />
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
};

export default PhotoPuzzleGame;
