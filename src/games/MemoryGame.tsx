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

const ROUNDS_TOTAL = 4;
const PAIRS_PER_ROUND = 8; // 8 pairs => 16 cards

const MemoryGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [round, setRound] = useState(1);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const [roundsWon, setRoundsWon] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);

  // build deck for the current round (changes when round changes)
  const cards = useMemo(() => {
    // rotate pool per round so it feels different
    const start = ((round - 1) * PAIRS_PER_ROUND) % Math.max(1, MEMORY_POOL.length);
    const rotated = [...MEMORY_POOL.slice(start), ...MEMORY_POOL.slice(0, start)];

    const picked = rotated.slice(0, PAIRS_PER_ROUND);
    return shuffle([...picked, ...picked]); // 16
  }, [round]);

  const resetRoundState = () => {
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  // when a round is completed
  useEffect(() => {
    if (cards.length === 0) return;
    if (matched.length !== cards.length) return;

    // round finished
    setRoundsWon((w) => w + 1);
    setTotalMoves((tm) => tm + moves);

    const isLast = round >= ROUNDS_TOTAL;

    const t = setTimeout(() => {
      if (isLast) {
        // stars based on total moves across all rounds (tweak as you like)
        const avg = (totalMoves + moves) / ROUNDS_TOTAL;
        const stars = avg <= 16 ? 3 : avg <= 22 ? 2 : 1;
        onComplete(stars, `Rounds: ${ROUNDS_TOTAL}/${ROUNDS_TOTAL}, Total moves: ${totalMoves + moves}`);
      } else {
        setRound((r) => r + 1);
        resetRoundState();
      }
    }, 650);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched.length, cards.length]);

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
    <GameShell
      onBack={onBack}
      current={round}
      total={ROUNDS_TOTAL}
      score={roundsWon}
    >
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '0 14px 40px' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 14 }}>
          Moves: {moves}
        </div>

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
                key={`${round}-${idx}`}
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
