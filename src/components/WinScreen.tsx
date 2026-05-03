import React from 'react';
import { useLang } from '../data/LangContext';
import DinoBot from './DinoBot';
import StarRating from './StarRating';
interface Props { stars: number; dinobot: { emoji: string; name: string; color: string }; powerLevel: number; detail: string; onBack: () => void; onClaim: () => void; }
const WinScreen: React.FC<Props> = ({ stars, dinobot, powerLevel, detail, onBack, onClaim }) => {
  const { t } = useLang();
  return (
    <div className="screen pop" style={{ gap:24 }}>
      <DinoBot {...dinobot} powerLevel={powerLevel} size={140} />
      <div style={{ textAlign:'center' }}>
        <h2 style={{ fontSize:'2.4rem', color:'#ffe66d', marginBottom:8 }}>{t.missionComplete}</h2>
        <p style={{ color:'#7a8fa6', fontSize:'1rem' }}>{detail}</p>
      </div>
      <StarRating stars={stars} />
      <div style={{ display:'flex', gap:16 }}>
        <button className="btn btn-muted" onClick={onBack}>{t.academy}</button>
        <button className="btn btn-yellow" onClick={onClaim}>{t.claimStars}</button>
      </div>
    </div>
  );
};
export default WinScreen;
