import React, { useMemo, useState } from 'react';
import GameShell from '../components/GameShell';

type Props = { onComplete: (stars: number, detail: string) => void; onBack: () => void };

import { PHOTO_POOL } from '../assets/images';
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

const PhotoPuzzleGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [size, setSize] = useState<3 | 4 | 5>(3);
  const [photo, setPhoto] = useState(PHOTOS[0]);

  const total = size * size;

  const [tray, setTray] = useState<number[]>(() => shuffle(range(total)));
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [moves, setMoves] = useState(0);

  const tileCss = useMemo(() => {
    const base = size === 3 ? 140 : size === 4 ? 112 : 92;
    return { w: base, h: base };
  }, [size]);

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

  const onDragStartPiece = (e: React.DragEvent, pieceIndex: number) => {
    e.dataTransfer.setData('text/piece', String(pieceIndex));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropToSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const piece = Number(e.dataTransfer.getData('text/piece'));
    if (Number.isNaN(piece)) return;

    setSlots((prev) => {
      if (prev[slotIndex] !== null) return prev; // slot already filled
      const next = [...prev];
      next[slotIndex] = piece;
      return next;
    });

    setTray((prev) => prev.filter((x) => x !== piece));
    setMoves((m) => m + 1);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const claim = () => {
    if (!isComplete) return;
    onComplete(stars, `Size: ${size}x${size}, Moves: ${moves}`);
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${size}, ${tileCss.w}px)`,
    gap: 10,
  };

  const tileStyle = (filled: boolean): React.CSSProperties => ({
    width: tileCss.w,
    height: tileCss.h,
    borderRadius: 18,
    border: '2px solid rgba(255,255,255,0.14)',
    background: filled ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.18)',
    boxShadow: '0 14px 28px rgba(0,0,0,0.35)',
    overflow: 'hidden',
    position: 'relative',
  });

  const pieceImageStyle = (pieceIndex: number): React.CSSProperties => {
    const x = pieceIndex % size;
    const y = Math.floor(pieceIndex / size);
    return {
      width: tileCss.w * size,
      height: tileCss.h * size,
      objectFit: 'cover',
      transform: `translate(${-x * tileCss.w}px, ${-y * tileCss.h}px)`,
      userSelect: 'none',
      pointerEvents: 'none',
    };
  };

  return (
    <GameShell onBack={onBack} current={0} total={0} score={0}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontWeight: 900, fontSize: '1.6rem', marginBottom: 16 }}>Photo Puzzle</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>Size</div>
          {[3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => reset(n as any, photo)}
              style={{ padding: '12px 16px', borderRadius: 14, fontWeight: 900 }}
            >
              {n}x{n}
            </button>
          ))}
          <div style={{ marginLeft: 10, fontWeight: 900, fontSize: '1.15rem' }}>Photo</div>
          {PHOTOS.map((p) => (
            <button key={p} onClick={() => reset(size, p)} style={{ padding: 8, borderRadius: 14 }}>
              <img src={p} alt="pick" style={{ width: 68, height: 68, borderRadius: 14, objectFit: 'cover' }} />
            </button>
          ))}
          <div style={{ marginLeft: 'auto', fontWeight: 900, fontSize: '1.15rem' }}>Moves: {moves}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          {/* Tray (left) */}
          <div>
            <div style={{ fontWeight: 900, marginBottom: 10, fontSize: '1.25rem' }}>Pieces</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {tray.map((pieceIndex) => (
                <div
                  key={pieceIndex}
                  draggable
                  onDragStart={(e) => onDragStartPiece(e, pieceIndex)}
                  style={{
                    ...tileStyle(true),
                    width: tileCss.w,
                    height: tileCss.h,
                    cursor: 'grab',
                  }}
                >
                  <img src={photo} alt="piece" style={pieceImageStyle(pieceIndex)} />
                </div>
              ))}
            </div>
          </div>

          {/* Board (right) */}
          <div>
            <div style={{ fontWeight: 900, marginBottom: 10, fontSize: '1.25rem' }}>Board</div>
            <div style={gridStyle}>
              {range(total).map((slotIndex) => {
                const filledPiece = slots[slotIndex];
                return (
                  <div
                    key={slotIndex}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDropToSlot(e, slotIndex)}
                    style={tileStyle(filledPiece !== null)}
                  >
                    {filledPiece !== null ? (
                      <img src={photo} alt="placed" style={pieceImageStyle(filledPiece)} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0.35, fontWeight: 900 }}>
                        {slotIndex + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={() => reset(size, photo)} style={{ padding: '14px 18px', borderRadius: 16, fontWeight: 900 }}>
                Reset
              </button>
              <button
                onClick={claim}
                disabled={!isComplete}
                style={{ padding: '14px 18px', borderRadius: 16, fontWeight: 900, opacity: isComplete ? 1 : 0.45 }}
              >
                Claim Stars ({stars || 0})
              </button>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
};

export default PhotoPuzzleGame;
