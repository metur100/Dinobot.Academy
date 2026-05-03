import React, { useState, useCallback } from 'react';
import { COLORS_LIST, DINOBOTS } from '../data/gameData';
import { useLang } from '../data/LangContext';
import DinoBot from '../components/DinoBot';
import GameShell from '../components/GameShell';
import WinScreen from '../components/WinScreen';

interface Props { onComplete: (s: number) => void; onBack: () => void; }

const genRound = () => {
  const sh = [...COLORS_LIST].sort(() => Math.random() - 0.5);
  return { target: sh[0], opts: sh.slice(0, 4).sort(() => Math.random() - 0.5) };
};

const TOTAL = 8;

const ColorsGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const { lang, t } = useLang();
  const [round, setRound] = useState(genRound);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [power, setPower] = useState(0);
  const [glowHex, setGlowHex] = useState('#555');
  const [gameOver, setGameOver] = useState(false);
  const dinobot = DINOBOTS[3];
  const name = (c: typeof COLORS_LIST[0]) => lang === 'de' ? c.de : c.bs;

  const pick = useCallback((key: string, hex: string) => {
    if (selected) return;
    setSelected(key);
    const ok = key === round.target.key;
    if (ok) { setScore(s => s + 1); setPower(p => Math.min(100, p + 13)); setGlowHex(hex); }
    setTimeout(() => {
      const next = answered + 1;
      setAnswered(next);
      if (next >= TOTAL) { setGameOver(true); return; }
      setRound(genRound()); setSelected(null);
    }, 850);
  }, [selected, round.target.key, answered]);

  const stars = score >= 6 ? 3 : score >= 4 ? 2 : 1;

  if (gameOver) return (
    <WinScreen stars={stars} dinobot={{ ...dinobot, color: glowHex }} powerLevel={power}
      detail={`${t.youGot} ${score} ${t.outOf} ${TOTAL} ${t.colors.result}`}
      onBack={onBack} onClaim={() => onComplete(stars)} />
  );

  return (
    <GameShell current={answered + 1} total={TOTAL} score={score} onBack={onBack}>
      <div style={{ fontSize: 92, filter: `drop-shadow(0 0 22px ${glowHex})`, transition: 'filter 0.5s' }} className="float">{dinobot.emoji}</div>
      <div className="card" style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <h2 style={{ color: '#f97316', marginBottom: 6, fontSize: '1.25rem' }}>{t.colors.title}</h2>
        <p style={{ color: '#7a8fa6', marginBottom: 18, fontSize: '0.88rem' }}>{t.colors.desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: round.target.hex, border: '5px solid white', boxShadow: `0 0 28px ${round.target.hex}`, transition: 'all 0.3s' }} />
          <div style={{ fontFamily: 'Fredoka One,cursive', fontSize: '1.9rem', color: round.target.hex, textShadow: `0 0 10px ${round.target.hex}` }}>{name(round.target)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {round.opts.map(color => {
            const isSel = selected === color.key;
            const isOk = color.key === round.target.key;
            let border = '#2a3a4a';
            if (isSel) border = isOk ? '#22c55e' : '#ef4444';
            else if (selected && isOk) border = '#22c55e';
            return (
              <button key={color.key} onClick={() => pick(color.key, color.hex)} style={{ padding: '13px', borderRadius: 14, background: color.hex + '33', border: `3px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10, cursor: selected ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: color.hex, border: '3px solid white', flexShrink: 0, boxShadow: `0 0 10px ${color.hex}` }} />
                <span style={{ fontFamily: 'Fredoka One,cursive', fontSize: '1rem', color: '#f0f4f8' }}>
                  {name(color)}{isSel && (isOk ? ' ✅' : ' ❌')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};
export default ColorsGame;
