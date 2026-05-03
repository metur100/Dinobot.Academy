import React, { useState, useCallback } from 'react';
import { SHAPES, DINOBOTS } from '../data/gameData';
import { useLang } from '../data/LangContext';
import DinoBot from '../components/DinoBot';
import GameShell from '../components/GameShell';
import WinScreen from '../components/WinScreen';

interface Props { onComplete: (s: number) => void; onBack: () => void; }

const PAL = ['#ff6b35','#4ecdc4','#a855f7','#ffe66d','#22c55e','#3b82f6','#e11d48','#f97316'];
const rndColor = () => PAL[Math.floor(Math.random() * PAL.length)];

const genRound = () => {
  const shuffled = [...SHAPES].sort(() => Math.random() - 0.5);
  const target = shuffled[0];
  const opts = shuffled.slice(0, 4).sort(() => Math.random() - 0.5);
  return { target, opts, tColor: rndColor(), oColors: opts.map(rndColor) };
};

const TOTAL = 8;

const ShapesGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const { lang, t } = useLang();
  const [round, setRound] = useState(genRound);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [power, setPower] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const dinobot = DINOBOTS[2];
  const name = (s: typeof SHAPES[0]) => lang === 'de' ? s.de : s.bs;

  const pick = useCallback((key: string) => {
    if (selected) return;
    setSelected(key);
    const ok = key === round.target.key;
    if (ok) { setScore(s => s + 1); setPower(p => Math.min(100, p + 13)); }
    setTimeout(() => {
      const next = answered + 1;
      setAnswered(next);
      if (next >= TOTAL) { setGameOver(true); return; }
      setRound(genRound()); setSelected(null);
    }, 850);
  }, [selected, round.target.key, answered]);

  const stars = score >= 6 ? 3 : score >= 4 ? 2 : 1;

  if (gameOver) return (
    <WinScreen stars={stars} dinobot={dinobot} powerLevel={power}
      detail={`${t.youGot} ${score} ${t.outOf} ${TOTAL} ${t.shapes.result}`}
      onBack={onBack} onClaim={() => onComplete(stars)} />
  );

  return (
    <GameShell current={answered + 1} total={TOTAL} score={score} onBack={onBack}>
      <DinoBot {...dinobot} powerLevel={power} size={80} />
      <div className="card" style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <h2 style={{ color: '#a855f7', marginBottom: 6, fontSize: '1.25rem' }}>{t.shapes.title}</h2>
        <p style={{ color: '#7a8fa6', marginBottom: 14, fontSize: '0.88rem' }}>{t.shapes.desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 22, padding: '18px', background: '#1e2d3d', borderRadius: 16, border: '3px solid #a855f7', boxShadow: '0 0 18px #a855f744' }}>
          {round.target.render(round.tColor, 96)}
          <div style={{ fontFamily: 'Fredoka One,cursive', fontSize: '1.4rem', color: '#a855f7' }}>{name(round.target)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {round.opts.map((sh, i) => {
            const isSel = selected === sh.key;
            const isOk = sh.key === round.target.key;
            let border = '#2a3a4a', bg = '#1e2d3d';
            if (isSel) { border = isOk ? '#22c55e' : '#ef4444'; bg = isOk ? '#22c55e22' : '#ef444422'; }
            else if (selected && isOk) { border = '#22c55e'; bg = '#22c55e22'; }
            return (
              <button key={sh.key} onClick={() => pick(sh.key)} style={{ padding: '16px', borderRadius: 14, background: bg, border: `3px solid ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: selected ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                {sh.render(round.oColors[i], 64)}
                <span style={{ fontFamily: 'Fredoka One,cursive', fontSize: '0.92rem', color: '#f0f4f8' }}>
                  {name(sh)}{isSel && (isOk ? ' ✅' : ' ❌')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};
export default ShapesGame;
