import React from 'react';

type Props = {
  src: string;
  alt?: string;
  size?: number;
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
};

const Icon: React.FC<Props> = ({ src, alt = '', size = 56, radius = 16, style, className }) => {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: radius,
        background: 'rgba(255,255,255,0.08)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
        border: '2px solid rgba(255,255,255,0.12)',
        ...style,
      }}
    />
  );
};

export default Icon;
