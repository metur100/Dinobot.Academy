import React from 'react';
interface Props { stars: number; max?: number; }
const StarRating: React.FC<Props> = ({ stars, max = 3 }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {Array.from({ length: max }, (_, i) => (
      <span key={i} style={{ fontSize: '1.3rem', filter: i < stars ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
    ))}
  </div>
);
export default StarRating;
