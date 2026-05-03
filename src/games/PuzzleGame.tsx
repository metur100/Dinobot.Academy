import React, { useState, useCallback, useEffect } from 'react';
import { DINOBOTS } from '../data/gameData';
import { useLang } from '../data/LangContext';
import DinoBot from '../components/DinoBot';
import WinScreen from '../components/WinScreen';

interface Props {
  onComplete: (s: number) => void;
  onBack: () => void;
}

type PuzzleDef = {
  nameDE: string;
  nameBS: string;
  image: string;
  bgColor: string;
  borderColor: string;
};

const PUZZLES: PuzzleDef[] = [
  {
    nameDE: 'Grimlock',
    nameBS: 'Grimlock',
    image: '/images/Grimlock.webp',
    bgColor: '#0f1b12',
    borderColor: '#22c55e',
  },
  {
    nameDE: 'Optimus',
    nameBS: 'Optimus',
    image: '/images/optimus-pose.jpg',
    bgColor: '#0f172a',
    borderColor: '#4ecdc4',
  },
  {
    nameDE: 'T-Rex Vulkan',
    nameBS: 'T-Rex Vulkan',
    image: '/images/trex-volcano.jpg',
    bgColor: '#1f0f0f',
    borderColor: '#ff6b35',
  },
  {
    nameDE: 'Bumblebee',
    nameBS: 'Bumblebee',
    image: '/images/bumblebee1.jpg',
    bgColor: '#14110a',
    borderColor: '#a855f7',
  },
];

type PuzzleState = {
  puzzle: PuzzleDef;
  slots: (number | null)[]; // slot i expects tile i
  remaining: number[]; // tile indices remaining to place
  selectedTile: number | null;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initPuzzle(puzzle: PuzzleDef): PuzzleState {
  const indices = shuffle(Array.from({ length: 9 }, (_, i) => i));
  return { puzzle, slots: Array(9).fill(null), remaining: indices, selectedTile: null };
}

function tileImageStyle(tileIdx: number, size: number) {
  const grid = 3;
  const x = tileIdx % grid;
  const y = Math.floor(tileIdx / grid);

  return {
    width: size * grid,
    height: size * grid,
    objectFit: 'cover' as const,
    transform: `translate(${-x * size}px, ${-y * size}px)`,
    userSelect: 'none' as const,
    pointerEvents: 'none' as const,
  };
}

const PuzzleGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const { lang, t } = useLang();

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [state, setState] = useState<PuzzleState>(() => initPuzzle(PUZZLES[0]));
  const [score, setScore] = useState(0);
  const [power, setPower] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [showPreview, setShowPreview] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [correctFlash, setCorrectFlash] = useState<number | null>(null);

  const dinobot = DINOBOTS[5];
  const TOTAL_PUZZLES = PUZZLES.length;

  // Timer
  useEffect(() => {
    if (gameOver || showPreview) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(id);
  }, [gameOver, showPreview, startTime]);

  // Hide preview after 2.5s
  useEffect(() => {
    if (!showPreview) return;
    const id = setTimeout(() => {
      setShowPreview(false);
      setStartTime(Date.now());
    }, 2500);
    return () => clearTimeout(id);
  }, [showPreview]);

  const selectTile = useCallback((tileIdx: number) => {
    setState((s) => ({ ...s, selectedTile: s.selectedTile === tileIdx ? null : tileIdx }));
  }, []);

  const placeInSlot = useCallback(
    (slotIdx: number) => {
      setState((s) => {
        if (s.selectedTile === null) return s;
        if (s.slots[slotIdx] !== null) return s;

        const tileIdx = s.selectedTile;
        const isCorrect = tileIdx === slotIdx;

        const newSlots = [...s.slots];
        newSlots[slotIdx] = tileIdx;

        const newRemaining = s.remaining.filter((i) => i !== tileIdx);

        if (isCorrect) {
          setCorrectFlash(slotIdx);
          setTimeout(() => setCorrectFlash(null), 600);
          setPower((p) => Math.min(100, p + 6));
        } else {
          setWrongFlash(slotIdx);
          setTimeout(() => {
            setWrongFlash(null);
            setState((ss) => {
              const revert = [...ss.slots];
              revert[slotIdx] = null;
              return { ...ss, slots: revert, remaining: [...ss.remaining, tileIdx], selectedTile: null };
            });
          }, 700);
          return { ...s, slots: newSlots, selectedTile: null };
        }

        const allFilled = newSlots.every((v) => v !== null);
        if (allFilled) {
          const allCorrect = newSlots.every((v, i) => v === i);
          if (allCorrect) {
            setScore((sc) => sc + 1);
            setTimeout(() => {
              const nextIdx = puzzleIdx + 1;
              if (nextIdx >= TOTAL_PUZZLES) {
                setGameOver(true);
              } else {
                setPuzzleIdx(nextIdx);
                setState(initPuzzle(PUZZLES[nextIdx]));
                setShowPreview(true);
                setElapsed(0);
              }
            }, 800);
          }
        }

        return { ...s, slots: newSlots, remaining: newRemaining, selectedTile: null };
      });
    },
    [puzzleIdx, TOTAL_PUZZLES]
  );

  const stars = score >= 3 ? 3 : score >= 2 ? 2 : 1;

  if (gameOver) {
    return (
      <WinScreen
        stars={stars}
        dinobot={dinobot}
        powerLevel={power}
        detail={`${t.puzzle.result} ${score}/${TOTAL_PUZZLES}`}
        onBack={onBack}
        onClaim={() => onComplete(stars)}
      />
    );
  }

  const { puzzle, slots, remaining, selectedTile } = state;
  const puzzleName = lang === 'de' ? puzzle.nameDE : puzzle.nameBS;
  const solved = slots.filter((v) => v !== null).length;

  const TILE = 76;

  return (
    <div className="screen" style={{ gap: 16, justifyContent: 'flex-start', paddingTop: 20 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 600, alignItems: 'center' }}>
        <button className="btn btn-muted" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={onBack}>
          {t.back}
        </button>

        <div style={{ fontFamily: 'Fredoka One,cursive', fontSize: '1.1rem', color: '#ffe66d' }}>
          {puzzleIdx + 1}/{TOTAL_PUZZLES}
        </div>

        <div style={{ fontSize: '0.95rem', color: '#7a8fa6' }}>{elapsed}s</div>
      </div>

      <DinoBot {...dinobot} powerLevel={power} size={70} animate={false} />

      {/* Preview overlay */}
      {showPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: 18,
          }}
        >
          <div style={{ fontFamily: 'Fredoka One,cursive', fontSize: '1.5rem', color: '#ffe66d', textAlign: 'center' }}>
            {t.puzzle.preview}: {puzzleName}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              background: puzzle.bgColor,
              padding: 16,
              borderRadius: 20,
              border: `4px solid ${puzzle.borderColor}`,
            }}
          >
            {Array.from({ length: 9 }, (_, tileIdx) => (
              <div
                key={tileIdx}
                style={{
                  width: TILE,
                  height: TILE,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.06)',
                  border: `2px solid ${puzzle.borderColor}44`,
                }}
              >
                <img src={puzzle.image} alt="preview" style={tileImageStyle(tileIdx, TILE)} />
              </div>
            ))}
          </div>

          <div style={{ color: '#7a8fa6', fontSize: '0.9rem' }} className="pulse">
            Merke dir das Bild! / Zapamti sliku!
          </div>
        </div>
      )}

      {/* Main puzzle area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 600 }}>
        <div style={{ fontFamily: 'Fredoka One,cursive', fontSize: '1.2rem', color: puzzle.borderColor }}>
          {t.puzzle.title} — {puzzleName}
        </div>
        <p style={{ color: '#7a8fa6', fontSize: '0.85rem', textAlign: 'center' }}>{t.puzzle.hint}</p>

        {/* Progress */}
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ fontSize: '0.8rem', color: '#7a8fa6', marginBottom: 4 }}>
            {solved}/9 {lang === 'de' ? 'Teile platziert' : 'dijelova postavljeno'}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(solved / 9) * 100}%` }} />
          </div>
        </div>

        {/* Grid (drop zone) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            background: puzzle.bgColor,
            padding: 14,
            borderRadius: 20,
            border: `4px solid ${puzzle.borderColor}`,
            boxShadow: `0 0 24px ${puzzle.borderColor}55`,
          }}
        >
          {slots.map((tileIdx, slotIdx) => {
            const isCorrect = correctFlash === slotIdx;
            const isWrong = wrongFlash === slotIdx;
            const filled = tileIdx !== null;

            return (
              <button
                key={slotIdx}
                onClick={() => !filled && placeInSlot(slotIdx)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  width: TILE,
                  height: TILE,
                  borderRadius: 14,
                  padding: 6,
                  background: isCorrect ? '#22c55e44' : isWrong ? '#ef444444' : filled ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                  border: `3px solid ${
                    isCorrect ? '#22c55e' : isWrong ? '#ef4444' : filled ? `${puzzle.borderColor}88` : `${puzzle.borderColor}33`
                  }`,
                  cursor: filled ? 'default' : 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isCorrect ? '0 0 16px #22c55e' : isWrong ? '0 0 16px #ef4444' : 'none',
                  overflow: 'hidden',
                }}
              >
                {filled ? (
                  <img src={puzzle.image} alt="tile" style={tileImageStyle(tileIdx!, TILE - 12)} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: 12, border: '2px dashed rgba(255,255,255,0.14)' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Tile bank */}
        {remaining.length > 0 && (
          <div style={{ width: '100%', maxWidth: 430 }}>
            <div style={{ fontFamily: 'Fredoka One,cursive', fontSize: '1rem', color: '#7a8fa6', marginBottom: 8, textAlign: 'center' }}>
              {t.puzzle.selectPiece}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'center',
                background: 'var(--card)',
                borderRadius: 16,
                padding: 14,
                border: '2px solid #2a3a4a',
              }}
            >
              {remaining.map((tileIdx) => (
                <button
                  key={tileIdx}
                  onClick={() => selectTile(tileIdx)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    width: 72,
                    height: 72,
                    borderRadius: 14,
                    padding: 6,
                    background: selectedTile === tileIdx ? `${puzzle.borderColor}22` : '#1e2d3d',
                    border: `3px solid ${selectedTile === tileIdx ? puzzle.borderColor : '#2a3a4a'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: selectedTile === tileIdx ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: selectedTile === tileIdx ? `0 0 14px ${puzzle.borderColor}` : 'none',
                    overflow: 'hidden',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <img src={puzzle.image} alt="piece" style={tileImageStyle(tileIdx, 60)} />
                </button>
              ))}
            </div>
          </div>
        )}

        {remaining.length === 0 && solved < 9 && (
          <div style={{ color: '#ffe66d', fontFamily: 'Fredoka One,cursive', fontSize: '1.1rem' }}>
            {lang === 'de' ? 'Fast fertig! Korrigiere die Fehler!' : 'Skoro gotovo! Ispravi greške!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleGame;
