import React from 'react';
import Icon from './Icon';

type Props = {
  emoji?: string;
  image?: string;
  name: string;
  color: string;
  size?: number;
  animate?: boolean;
  powerLevel?: number;
};

const DinoBot: React.FC<Props> = ({ emoji = '', image, name, color, size = 120, animate = true, powerLevel = 0 }) => {
  const glowHex = color;
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          padding: 10,
          borderRadius: 26,
          background: 'rgba(255,255,255,0.06)',
          border: '2px solid rgba(255,255,255,0.10)',
        }}
      >
        {image ? (
          <Icon
            src={image}
            alt={name}
            size={size}
            radius={24}
            style={{
              filter: `drop-shadow(0 0 22px ${glowHex})`,
              transition: 'filter 0.5s',
            }}
            className={animate ? 'float' : undefined}
          />
        ) : (
          <div style={{ fontSize: size, filter: `drop-shadow(0 0 22px ${glowHex})` }} className={animate ? 'float' : undefined}>
            {emoji}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, fontWeight: 900, fontSize: '1.25rem', color: 'white' }}>{name}</div>
      <div style={{ opacity: 0.9, fontSize: '1.05rem' }}>Power: {powerLevel}%</div>
    </div>
  );
};

export default DinoBot;
