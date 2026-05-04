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

// pick random photos (no fixed start index)
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

  // Rebuild levels on every mount, so first image is not always the same.
  // (If you want “new random image” also when returning from other missions, this is enough.)
  const levels = useMemo(() => buildLevels(), []);
  const [levelIndex, setLevelIndex] = useState(0);

  const level = levels[levelIndex];
  const size = level.size;
  const photo = level.photo;
  const total = size * size;

  const [tray, setTray] = useState<number[]>(() => shuffle(range(total)));
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [moves, setMoves] = useState(0);

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

  const isComplete = slots.length === total && slots.every((v, i) => v === i);

  useEffect(() => {
    if (!isComplete) return;
    const t = window.setTimeout(() => {
      if (levelIndex < levels.length - 1) setLevelIndex((i) => i + 1);
      else onComplete(3, `Finished 9 levels. Moves last level: ${moves}`);
    }, 700);
    return () => window.clearTimeout(t);
  }, [isComplete, levelIndex, levels.length, moves, onComplete]);

  // --- Layout sizing (no vertical scroll sizing) ---
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

    // reserve some space for preview image
    const previewH = clamp(Math.floor(maxH * 0.22), 120, 220);

    const remainForBoard = maxH - trayH - previewH - 22;
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
      previewH,
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
    touchAction: "none", // IMPORTANT: allow pointermove on touch without scrolling
    userSelect: "none",
  });

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
    };
  };

  // -------------------------
  // Drag + Drop (pointer-based)
  // -------------------------
  const boardSlotEls = useRef<(HTMLDivElement | null)[]>([]);
  const trayTileEls = useRef<(HTMLDivElement | null)[]>([]);
  const trayContainerRef = useRef<HTMLDivElement | null>(null);

  const [dragging, setDragging] = useState<{
    from: DragFrom;
    piece: number;
    // current pointer position (viewport)
    x: number;
    y: number;
    // show correct cropped piece sized for board tiles (so it matches drop target)
    ghostW: number;
  } | null>(null);

  const stopDragging = () => setDragging(null);

  const pointToTarget = (x: number, y: number): { kind: "board"; slotIndex: number } | { kind: "tray" } | null => {
    // check board slots
    for (let i = 0; i < boardSlotEls.current.length; i++) {
      const el = boardSlotEls.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { kind: "board", slotIndex: i };
    }

    // tray container
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

    // no target -> revert to origin
    if (!target) {
      stopDragging();
      return;
    }

    if (target.kind === "tray") {
      // dropping into tray
      if (from.kind === "board") {
        clearBoardSlot(from.slotIndex);
        addToTrayFront(piece);
        setMoves((m) => m + 1);
      }
      // tray -> tray does nothing
      stopDragging();
      return;
    }

    // dropping into board slot
    const slotIndex = target.slotIndex;
    const filled = slots[slotIndex];

    if (from.kind === "tray") {
      if (filled !== null) {
        // swap: tray piece goes to board, board piece returns to tray
        setBoardSlot(slotIndex, piece);
        removeFromTray(piece);
        addToTrayFront(filled);
        setMoves((m) => m + 1);
        stopDragging();
        return;
      }

      // empty slot
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
      // move to empty
      clearBoardSlot(from.slotIndex);
      setBoardSlot(slotIndex, piece);
      setMoves((m) => m + 1);
      stopDragging();
      return;
    }

    // swap board <-> board
    clearBoardSlot(from.slotIndex);
    setBoardSlot(from.slotIndex, filled);
    setBoardSlot(slotIndex, piece);
    setMoves((m) => m + 1);
    stopDragging();
  };

  const onPointerDownTray = (e: React.PointerEvent, piece: number, indexInTray: number) => {
    // start drag from tray
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging({
      from: { kind: "tray", piece, indexInTray },
      piece,
      x: e.clientX,
      y: e.clientY,
      ghostW: sizesPx.boardTile, // show “real” puzzle size ghost
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

  const ghostStyle: React.CSSProperties = dragging
    ? {
        position: "fixed",
        left: dragging.x,
        top: dragging.y,
        transform: "translate(-50%, -50%)",
        width: dragging.ghostW,
        height: dragging.ghostW,
        zIndex: 9999,
        pointerEvents: "none",
        borderRadius: Math.max(12, Math.floor(dragging.ghostW * 0.14)),
        overflow: "hidden",
        boxShadow: "0 18px 44px rgba(0,0,0,0.55)",
        border: "3px solid rgba(255,230,109,0.9)",
        background: "rgba(255,255,255,0.08)",
      }
    : {};

  // highlight potential board drop target while dragging
  const hoverTarget = useMemo(() => {
    if (!dragging) return null;
    const t = pointToTarget(dragging.x, dragging.y);
    if (t && t.kind === "board") return t.slotIndex;
    return null;
  }, [dragging, slots]);

  // prevent tray/board from showing duplicate piece while dragging
  const isPieceBeingDraggedFromTray = (piece: number) =>
    dragging?.from.kind === "tray" && dragging.piece === piece;

  const isPieceBeingDraggedFromBoard = (slotIndex: number) =>
    dragging?.from.kind === "board" && dragging.from.slotIndex === slotIndex;

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
            gap,
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          {tray.map((pieceIndex, indexInTray) => {
            const hidden = isPieceBeingDraggedFromTray(pieceIndex);
            return (
              <div
                key={`${pieceIndex}-${indexInTray}`}
                ref={(el) => {
                  trayTileEls.current[indexInTray] = el;
                }}
                onPointerDown={(e) => onPointerDownTray(e, pieceIndex, indexInTray)}
                style={{
                  ...tileStyle(sizesPx.trayTile, true, false),
                  cursor: "grab",
                  opacity: hidden ? 0.15 : 1,
                }}
              >
                {/* Show cropped piece in tray */}
                {!hidden && <img src={photo} alt="" style={pieceImageStyle(pieceIndex, sizesPx.trayTile)} />}
              </div>
            );
          })}
        </div>

        {/* MIDDLE: BOARD */}
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
            const highlight = hoverTarget === slotIndex;

            return (
              <div
                key={slotIndex}
                ref={(el) => {
                  boardSlotEls.current[slotIndex] = el;
                }}
                style={{
                  ...tileStyle(sizesPx.boardTile, filledPiece !== null, highlight),
                  cursor: filledPiece !== null ? "grab" : "pointer",
                }}
              >
                {filledPiece !== null ? (
                  <div
                    onPointerDown={(e) => onPointerDownBoard(e, slotIndex, filledPiece)}
                    style={{ position: "absolute", inset: 0 }}
                  >
                    {!isPieceBeingDraggedFromBoard(slotIndex) && (
                      <img src={photo} alt="" style={pieceImageStyle(filledPiece, sizesPx.boardTile)} />
                    )}
                  </div>
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

        {/* BOTTOM: FULL REFERENCE IMAGE (always visible) */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              width: Math.min(sizesPx.boardW, 520),
              maxWidth: "100%",
              borderRadius: 18,
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.18)",
              boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
            }}
          >
            <img
              src={photo}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: sizesPx.previewH,
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* DRAG GHOST (shows cropped piece while dragging) */}
        {dragging && (
          <div style={ghostStyle}>
            <img src={photo} alt="" style={pieceImageStyle(dragging.piece, dragging.ghostW)} />
          </div>
        )}
      </div>
    </GameShell>
  );
};

export default PhotoPuzzleGame;
