import React, { useState, useCallback } from 'react';
import { PATTERN_IMAGES, DINOBOTS } from '../data/gameData';

import { useLang } from '../data/LangContext';
import DinoBot from '../components/DinoBot';
import GameShell from '../components/GameShell';
import WinScreen from '../components/WinScreen';

interface Props { onComplete: (s: number) => void; onBack: () => void; }

const genRound = (difficulty: number) => {
  const patLen = 2 + Math.min(difficulty, 2); // 2, 3, or 4 items in pattern
  const pool = PATTERN_IMAGES.slice(0, 4 + difficulty);
  const pattern: string[] = [];
  for (let i = 0; i < patLen; i++) pattern.push(pool[Math.floor(Math.random() * pool.length)]);
  // Show 2 repetitions then ask for next
  const shown = [...pattern, ...pattern];
  const answer = pattern[0]; // next in sequence
  // Wrong choices
  const wrong = pool.filter(e => e !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...wrong, answer].sort(() => Math.random() - 0.5);
  return { shown, answer, choices };
};

const TOTAL = 7;

const PatternsGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const { t } = useLang();
  const [difficulty, setDifficulty] = useState(0);
  const [round, setRound] = useState(() => genRound(0));
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [power, setPower] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const dinobot = DINOBOTS[7];

  const pick = useCallback((e: string) => {
    if (selected) return;
    setSelected(e);
    const ok = e === round.answer;
    if (ok) { setScore(s => s + 1); setPower(p => Math.min(100, p + 14)); }
    setTimeout(() => {
      const next = answered + 1;
      setAnswered(next);
      if (next >= TOTAL) { setGameOver(true); return; }
      const newDiff = Math.floor(next / 2);
      setDifficulty(newDiff);
      setRound(genRound(newDiff)); setSelected(null);
    }, 900);
  }, [selected, round.answer, answered]);

  const stars = score >= 5 ? 3 : score >= 3 ? 2 : 1;

  if (gameOver) return (
    <WinScreen stars={stars} dinobot={dinobot} powerLevel={power}
      detail={`${t.youGot} ${score} ${t.outOf} ${TOTAL} ${t.right}`}
      onBack={onBack} onClaim={() => onComplete(stars)} />
  );

  return (
    <GameShell current={answered + 1} total={TOTAL} score={score} onBack={onBack}>
      <DinoBot {...dinobot} powerLevel={power} size={80} />
      <div className="card" style={{ width:'100%', maxWidth:560, textAlign:'center' }}>
        <h2 style={{ color:'#d97706', marginBottom:6, fontSize:'1.25rem' }}>{t.patterns.title}</h2>
        <p style={{ color:'#7a8fa6', marginBottom:18, fontSize:'0.88rem' }}>{t.patterns.desc}</p>

        {/* Pattern display */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flexWrap:'wrap', gap:8, marginBottom:22, background:'#1e2d3d', borderRadius:16, padding:'18px', border:'3px solid #d97706' }}>
          {round.shown.map((e, i) => (
            <span key={i} style={{ fontSize:'2.2rem', background:'#2a3a4a', borderRadius:12, padding:'6px 10px', border:'2px solid #3a4a5a' }}>{e}</span>
          ))}
          <span style={{ fontSize:'2.2rem', background:'#d9770633', borderRadius:12, padding:'6px 10px', border:'2px dashed #d97706' }} className="pulse">❓</span>
        </div>

        {/* Choices */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {round.choices.map(e => {
            const isSel = selected === e;
            const isOk = e === round.answer;
            let bg = '#1e2d3d', border = '#2a3a4a';
            if (isSel) { bg = isOk ? '#22c55e22' : '#ef444422'; border = isOk ? '#22c55e' : '#ef4444'; }
            else if (selected && isOk) { bg = '#22c55e22'; border = '#22c55e'; }
            return (
              <button key={e} onClick={() => pick(e)} style={{
                padding:'20px', borderRadius:14, fontSize:'2.4rem',
                background:bg, border:`3px solid ${border}`,
                cursor: selected ? 'default' : 'pointer', transition:'all 0.2s',
              }}>{e}{isSel && (isOk ? ' ✅' : ' ❌')}</button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};
export default PatternsGame;
