import React, { useState, useCallback } from 'react';
import { COUNTING_ITEMS, DINOBOTS } from '../data/gameData';
import { useLang } from '../data/LangContext';
import DinoBot from '../components/DinoBot';
import GameShell from '../components/GameShell';
import WinScreen from '../components/WinScreen';

interface Props { onComplete: (s: number) => void; onBack: () => void; }

const genRound = () => {
  const item = COUNTING_ITEMS[Math.floor(Math.random() * COUNTING_ITEMS.length)];
  const count = Math.floor(Math.random() * 9) + 1;
  const wrong1 = count === 1 ? 2 : count - 1;
  const wrong2 = count >= 9 ? count - 2 : count + 1;
  const wrong3 = count <= 2 ? count + 2 : count - 2 < 0 ? count + 3 : count - 2;
  const choices = [count, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
  return { item, count, choices };
};

const TOTAL = 7;

const CountingGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const { lang, t } = useLang();
  const [round, setRound] = useState(genRound);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [power, setPower] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const dinobot = DINOBOTS[6];
  const itemName = (item: typeof COUNTING_ITEMS[0]) => lang === 'de' ? item.de : item.bs;

  const pick = useCallback((n: number) => {
    if (selected !== null) return;
    setSelected(n);
    const ok = n === round.count;
    if (ok) { setScore(s => s + 1); setPower(p => Math.min(100, p + 14)); }
    setTimeout(() => {
      const next = answered + 1;
      setAnswered(next);
      if (next >= TOTAL) { setGameOver(true); return; }
      setRound(genRound()); setSelected(null);
    }, 900);
  }, [selected, round.count, answered]);

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
        <h2 style={{ color:'#0ea5e9', marginBottom:6, fontSize:'1.25rem' }}>{t.counting.title}</h2>
        <p style={{ color:'#7a8fa6', marginBottom:18, fontSize:'0.88rem' }}>
          {t.counting.desc} ({itemName(round.item)})
        </p>

        {/* Emoji grid */}
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:6, marginBottom:22, minHeight:120, alignContent:'center', background:'#1e2d3d', borderRadius:16, padding:'16px', border:'3px solid #0ea5e9' }}>
          {Array.from({ length: round.count }, (_, i) => (
            <img key={i} className="bounce" src={round.item.image || '/images/optimus-face.jpg'} alt={round.item.key} style={{ width: 66, height: 66, borderRadius: 16, objectFit:'cover', animationDelay:`${i*0.08}s`, marginRight: 8 }} />
          ))}
        </div>

        {/* Number choices */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {round.choices.map(n => {
            const isSel = selected === n;
            const isOk = n === round.count;
            let bg = '#1e2d3d', border = '#2a3a4a';
            if (isSel) { bg = isOk ? '#22c55e22' : '#ef444422'; border = isOk ? '#22c55e' : '#ef4444'; }
            else if (selected !== null && isOk) { bg = '#22c55e22'; border = '#22c55e'; }
            return (
              <button key={n} onClick={() => pick(n)} style={{
                padding:'18px', borderRadius:14, fontSize:'2.4rem',
                fontFamily:'Fredoka One,cursive', background:bg, color:'#f0f4f8',
                border:`3px solid ${border}`, transition:'all 0.2s',
                cursor: selected !== null ? 'default' : 'pointer',
              }}>{n}{isSel && (isOk ? ' ✅' : ' ❌')}</button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};
export default CountingGame;
