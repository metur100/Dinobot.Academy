import React from 'react';
import { useLang } from '../data/LangContext';
interface Props { current: number; total: number; score: number; onBack: () => void; children: React.ReactNode; }
const GameShell: React.FC<Props> = ({ current, total, score, onBack, children }) => {
  const { t } = useLang();
  return (
    <div className="screen" style={{ gap:18, justifyContent:'flex-start', paddingTop:22 }}>
      <div style={{ display:'flex', justifyContent:'space-between', width:'100%', maxWidth:600, alignItems:'center' }}>
        <button className="btn btn-muted" style={{ padding:'8px 16px', fontSize:'0.9rem' }} onClick={onBack}>{t.back}</button>
        <div style={{ fontFamily:'Fredoka One,cursive', fontSize:'1.2rem', color:'#ffe66d' }}>{current} / {total}</div>
        <div style={{ fontSize:'1rem', color:'#22c55e', fontWeight:800 }}>✅ {score}</div>
      </div>
      {children}
    </div>
  );
};
export default GameShell;
