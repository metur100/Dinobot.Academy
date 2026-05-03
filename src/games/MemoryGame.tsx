import React, { useMemo, useState, useEffect } from 'react';
import GameShell from '../components/GameShell';
import { MEMORY_POOL } from '../assets/images';

type Props = { onComplete: (stars: number, detail: string) => void; onBack: () => void };

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MemoryGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const cards = useMemo(() => {
    const picked = MEMORY_POOL.slice(0, 8);
    return shuffle([...picked, ...picked]);
  }, []);

  useEffect(() => {
    if (cards.length > 0 && matched.length === cards.length) {
      const stars = moves <= 14 ? 3 : moves <= 20 ? 2 : 1;
      onComplete(stars, `Moves: ${moves}`);
    }
  }, [matched, cards.length, moves, onComplete]);

  const handleFlip = (idx: number) => {
    if (flipped.includes(idx) || matched.includes(idx)) return;
    if (flipped.length === 2) return;

    const next = [...flipped, idx];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;

      if (cards[a] === cards[b]) {
        setMatched((mm) => [...mm, a, b]);
        setTimeout(() => setFlipped([]), 260);
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  return (
    <GameShell onBack={onBack} current={0} total={0} score={0}>
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '0 14px 40px' }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 8 }}>Memory</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 14 }}>Moves: {moves}</div>

        <div
          className="memoryGrid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 16,
          }}
        >
          {cards.map((src, idx) => {
            const isFlipped = flipped.includes(idx) || matched.includes(idx);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleFlip(idx)}
                className="memoryCard"
              >
                {isFlipped ? (
                  <img src={src} alt="card" draggable={false} className="memoryImg" />
                ) : (
                  <div className="memoryBack" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};

export default MemoryGame;
