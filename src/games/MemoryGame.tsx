import React, { useMemo, useState, useEffect } from "react";
import GameShell from "../components/GameShell";
import { MEMORY_POOL } from "../assets/images";

type Props = { onComplete: (stars: number, detail: string) => void; onBack: () => void };

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Rounds:
// 1) 2x2  => 2 pairs (4 cards)
// 2) 4x4  => 8 pairs (16 cards)
// 3) 4x4  => 8 pairs (16 cards) but shifted pool so it feels different
// 4) 6x6  => 18 pairs (36 cards)
const ROUNDS = [
  { grid: 2, pairs: 2, poolShift: 0 },
  { grid: 4, pairs: 8, poolShift: 0 },
  { grid: 4, pairs: 8, poolShift: 8 },
  { grid: 6, pairs: 18, poolShift: 0 },
] as const;

type RoundIndex = 0 | 1 | 2 | 3;

const MemoryGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [roundIndex, setRoundIndex] = useState<RoundIndex>(0);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const [roundsWon, setRoundsWon] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);

  const roundDef = ROUNDS[roundIndex];
  const grid = roundDef.grid;
  const pairs = roundDef.pairs;

  // build deck for the current round (changes when round changes)
  const cards = useMemo(() => {
    const poolLen = Math.max(1, MEMORY_POOL.length);

    // rotate pool per round so it feels different
    const start = (roundDef.poolShift + roundIndex * pairs) % poolLen;
    const rotated = [...MEMORY_POOL.slice(start), ...MEMORY_POOL.slice(0, start)];

    // pick N images for pairs (if not enough images, reuse from rotated)
    const picked: string[] = [];
    for (let i = 0; i < pairs; i++) picked.push(rotated[i % rotated.length]);

    // duplicate for pairs then shuffle
    return shuffle([...picked, ...picked]);
  }, [roundIndex, roundDef.poolShift, pairs]);

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

    const isLast = roundIndex >= ROUNDS.length - 1;

    const t = window.setTimeout(() => {
      if (isLast) {
        // stars based on average moves across all rounds
        const avg = (totalMoves + moves) / ROUNDS.length;
        const stars = avg <= 10 ? 3 : avg <= 16 ? 2 : 1;
        onComplete(stars, `Rounds: ${ROUNDS.length}/${ROUNDS.length}, Total moves: ${totalMoves + moves}`);
      } else {
        setRoundIndex((ri) => (ri + 1) as RoundIndex);
        resetRoundState();
      }
    }, 650);

    return () => window.clearTimeout(t);
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
        window.setTimeout(() => setFlipped([]), 260);
      } else {
        window.setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  return (
    <GameShell onBack={onBack} current={roundIndex + 1} total={ROUNDS.length} score={roundsWon}>
      <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", padding: "0 14px 40px" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 14 }}>
          Moves: {moves} • {grid}×{grid}
        </div>

        <div
          className="memoryGrid"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))`,
            gap: 16,
          }}
        >
          {cards.map((src, idx) => {
            const isFlipped = flipped.includes(idx) || matched.includes(idx);

            return (
              <button
                key={`${roundIndex}-${idx}`}
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
