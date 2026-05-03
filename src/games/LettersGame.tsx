import React, { useState, useCallback } from 'react';
import { WORDS, DINOBOTS } from '../data/gameData';
import { useLang } from '../data/LangContext';
import DinoBot from '../components/DinoBot';
import GameShell from '../components/GameShell';
import WinScreen from '../components/WinScreen';

interface Props { onComplete: (s: number) => void; onBack: () => void; }

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TOTAL = 6;
const MAX_WRONG = 6;

const LettersGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const { lang, t } = useLang();
  const words = WORDS[lang];
  const [wordIdx, setWordIdx] = useState(() => Math.floor(Math.random() * words.length));
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [shake, setShake] = useState(false);
  const [power, setPower] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const dinobot = DINOBOTS[0];
  const word = words[wordIdx % words.length];

  const advance = useCallback((scored: boolean) => {
    const next = answered + 1;
    setAnswered(next);
    if (scored) { setScore(s => s + 1); setPower(p => Math.min(100, p + 17)); }
    if (next >= TOTAL) { setGameOver(true); return; }
    setWordIdx(i => (i + 1) % words.length);
    setGuessed([]); setWrong(0); setCorrect(false);
  }, [answered, words.length]);

  const pick = useCallback((l: string) => {
    if (guessed.includes(l) || correct || wrong >= MAX_WRONG) return;
    const ng = [...guessed, l];
    setGuessed(ng);
    if (!word.includes(l)) {
      const nw = wrong + 1;
      setWrong(nw);
      setShake(true); setTimeout(() => setShake(false), 550);
      if (nw >= MAX_WRONG) setTimeout(() => advance(false), 800);
    } else {
      if (word.split('').every(c => ng.includes(c))) {
        setCorrect(true);
        setTimeout(() => advance(true), 900);
      }
    }
  }, [guessed, correct, wrong, word, advance]);

  const stars = score >= 5 ? 3 : score >= 3 ? 2 : 1;

  if (gameOver) return (
    <WinScreen stars={stars} dinobot={dinobot} powerLevel={power}
      detail={`${t.youGot} ${score} ${t.outOf} ${TOTAL} ${t.letters.result}`}
      onBack={onBack} onClaim={() => onComplete(stars)} />
  );

  return (
    <GameShell current={answered + 1} total={TOTAL} score={score} onBack={onBack}>
      <DinoBot {...dinobot} powerLevel={power} size={90} />
      <div className="card" style={{ width:'100%', maxWidth:600, textAlign:'center' }}>
        <h2 style={{ color:'#4ecdc4', marginBottom:6, fontSize:'1.6rem' }}>{t.letters.title}</h2>
        <p style={{ color:'#7a8fa6', marginBottom:18, fontSize:'1.05rem' }}>{t.letters.hint}</p>

        {/* Word blanks */}
        <div className={shake ? 'shake' : ''} style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:5, marginBottom:18 }}>
          {word.split('').map((l, i) => (
            <div key={i} style={{
              width:62, height:74, borderRadius:11,
              background: guessed.includes(l) ? (correct ? '#22c55e22' : '#4ecdc422') : '#1e2d3d',
              border:`3px solid ${guessed.includes(l) ? (correct ? '#22c55e' : '#4ecdc4') : '#2a3a4a'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'2.2rem', fontFamily:'Fredoka One,cursive',
              color: guessed.includes(l) ? '#f0f4f8' : 'transparent',
              transition:'all 0.25s',
            }}>{l}</div>
          ))}
        </div>

        {/* Wrong indicators */}
        <div style={{ marginBottom:14, minHeight:26 }}>
          {Array.from({length: MAX_WRONG}, (_, i) => (
            <span key={i} style={{ fontSize:'1.2rem', opacity: i < wrong ? 1 : 0.12 }}>💥</span>
          ))}
        </div>

        {/* Keyboard */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' }}>
          {ALPHA.map(l => {
            const hit = guessed.includes(l);
            const good = hit && word.includes(l);
            const bad = hit && !word.includes(l);
            return (
              <button key={l} onClick={() => pick(l)} disabled={hit} style={{
                width:48, height:48, borderRadius:8, fontSize:'1.05rem', fontWeight:800,
                background: good ? '#22c55e' : bad ? '#ef4444' : '#1e2d3d',
                color:'#f0f4f8',
                border:`2px solid ${good ? '#22c55e' : bad ? '#ef4444' : '#2a3a4a'}`,
                opacity: hit ? 0.55 : 1, cursor: hit ? 'not-allowed' : 'pointer',
              }}>{l}</button>
            );
          })}
        </div>

        {wrong >= MAX_WRONG && (
          <div style={{ marginTop:16, color:'#ef4444' }}>
            {t.letters.wordWas} <strong style={{ color:'#ffe66d' }}>{word}</strong>
          </div>
        )}
      </div>
    </GameShell>
  );
};
export default LettersGame;
