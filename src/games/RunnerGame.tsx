import React, { useEffect, useMemo, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

type Props = { onComplete: (stars: number, detail: string) => void; onBack: () => void };

type Obstacle = { id: string; x: number; kind: 'wall' | 'bot'; y: number; w: number; h: number; alive: boolean };

type Bullet = { id: string; x: number; y: number; vx: number; w: number; h: number };

const W = 980;
const H = 420;
const GROUND = 340;

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const RunnerGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [hit, setHit] = useState(false);

  const playerX = 160;
  const [playerY, setPlayerY] = useState(GROUND);
  const [vy, setVy] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isShooting, setIsShooting] = useState(false);

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);

  const lastShotRef = useRef(0);
  const raf = useRef<number | null>(null);

  const player = useMemo(() => ({ x: playerX, y: playerY - 80, w: 70, h: 80 }), [playerX, playerY]);

  const spawnObstacle = () => {
    const isBot = Math.random() < 0.55;
    const id = String(Math.random()).slice(2);
    if (isBot) {
      setObstacles((prev) => [...prev, { id, x: W + 40, y: GROUND - 68, w: 64, h: 68, kind: 'bot', alive: true }]);
    } else {
      const tall = Math.random() < 0.4;
      setObstacles((prev) => [
        ...prev,
        { id, x: W + 40, y: tall ? GROUND - 120 : GROUND - 72, w: 52, h: tall ? 120 : 72, kind: 'wall', alive: true },
      ]);
    }
  };

  const jump = () => {
    if (!running) return;
    if (isJumping) return;
    setIsJumping(true);
    setVy(-16);
  };

  const shoot = () => {
    if (!running) return;
    const now = performance.now();
    if (now - lastShotRef.current < 260) return;
    lastShotRef.current = now;

    setIsShooting(true);
    setTimeout(() => setIsShooting(false), 180);

    const id = String(Math.random()).slice(2);
    setBullets((prev) => [...prev, { id, x: player.x + player.w - 6, y: player.y + 26, vx: 12, w: 18, h: 8 }]);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        shoot();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, isJumping, player]);

  useEffect(() => {
    const t = setInterval(() => {
      if (running) spawnObstacle();
    }, 900);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    const loop = () => {
      if (!running) return;

      // gravity + ground
      setPlayerY((py) => {
        let next = py + vy;
        if (next >= GROUND) next = GROUND;
        return next;
      });
      setVy((v) => {
        // if on ground and not jumping, keep vy 0
        if (playerY >= GROUND && !isJumping) return 0;
        return v + 0.9;
      });

      if (playerY >= GROUND && isJumping) setIsJumping(false);

      // move obstacles
      setObstacles((prev) => prev.map((o) => ({ ...o, x: o.x - 6 })).filter((o) => o.x > -220));

      // move bullets
      setBullets((prev) => prev.map((b) => ({ ...b, x: b.x + b.vx })).filter((b) => b.x < W + 220));

      // collisions: bullets with obstacles
      setObstacles((prev) => {
        if (bullets.length === 0) return prev;
        const bs = bullets;
        return prev.map((o) => {
          if (!o.alive) return o;
          const oRect = { x: o.x, y: o.y, w: o.w, h: o.h };
          const hitByBullet = bs.some((b) => rectsOverlap({ x: b.x, y: b.y, w: b.w, h: b.h }, oRect));
          if (!hitByBullet) return o;
          // bots can be destroyed; walls: only tall walls can be destroyed
          if (o.kind === 'bot') return { ...o, alive: false };
          if (o.kind === 'wall' && o.h >= 110) return { ...o, alive: false };
          return o;
        });
      });

      // remove bullets that hit something
      setBullets((prev) => {
        if (obstacles.length === 0) return prev;
        const obs = obstacles.filter((o) => o.alive);
        return prev.filter((b) => {
          const bRect = { x: b.x, y: b.y, w: b.w, h: b.h };
          const hitAny = obs.some((o) => rectsOverlap(bRect, { x: o.x, y: o.y, w: o.w, h: o.h }));
          return !hitAny;
        });
      });

      // player collision with alive obstacles (walls always crash; bots crash)
      const pRect = { x: player.x, y: player.y, w: player.w, h: player.h };
      const crash = obstacles.some((o) => o.alive && rectsOverlap(pRect, { x: o.x, y: o.y, w: o.w, h: o.h }));
      if (crash) {
        setHit(true);
        setRunning(false);
        setTimeout(() => {
          const stars = score >= 25 ? 3 : score >= 12 ? 2 : 1;
          onComplete(stars, `Score: ${score}`);
        }, 650);
        return;
      }

      // scoring
      setScore((s) => s + 1);

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [running, vy, playerY, isJumping, bullets, obstacles, player, score, onComplete]);

  const playerImg = isShooting
    ? '/images/optimus-face.jpg'
    : isJumping
      ? '/images/optimus-fortnite.jpg'
      : '/images/optimus-pose.jpg';

  return (
    <GameShell title="Optimus Runner" onBack={onBack}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>Score: {score}</div>
          <button onClick={jump} style={{ padding: '14px 18px', borderRadius: 16, fontWeight: 900 }}>
            Jump
          </button>
          <button onClick={shoot} style={{ padding: '14px 18px', borderRadius: 16, fontWeight: 900 }}>
            Shoot
          </button>
          <div style={{ opacity: 0.85, fontWeight: 800 }}>
            Controls: Space/Up = jump, Enter/Right = shoot
          </div>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: W,
            height: H,
            borderRadius: 22,
            border: '2px solid rgba(255,255,255,0.14)',
            background: 'linear-gradient(180deg, rgba(30,41,59,0.95), rgba(2,6,23,0.95))',
            boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ground */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: GROUND, height: H - GROUND, background: 'rgba(255,255,255,0.05)' }} />

          {/* player */}
          <img
            src={playerImg}
            alt="player"
            style={{
              position: 'absolute',
              left: player.x,
              top: player.y,
              width: player.w,
              height: player.h,
              objectFit: 'cover',
              borderRadius: 18,
              border: '2px solid rgba(255,255,255,0.14)',
              boxShadow: hit ? '0 0 0 6px rgba(239,68,68,0.35)' : '0 18px 34px rgba(0,0,0,0.45)',
            }}
          />

          {/* bullets */}
          {bullets.map((b) => (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h,
                borderRadius: 999,
                background: 'rgba(56,189,248,0.95)',
                boxShadow: '0 0 18px rgba(56,189,248,0.8)',
              }}
            />
          ))}

          {/* obstacles */}
          {obstacles.filter((o) => o.alive).map((o) => (
            <img
              key={o.id}
              src={o.kind === 'bot' ? '/images/Grimlock.webp' : '/images/trex.jpg'}
              alt={o.kind}
              style={{
                position: 'absolute',
                left: o.x,
                top: o.y,
                width: o.w,
                height: o.h,
                objectFit: 'cover',
                borderRadius: 16,
                border: '2px solid rgba(255,255,255,0.14)',
                boxShadow: '0 14px 28px rgba(0,0,0,0.35)',
              }}
            />
          ))}
        </div>
      </div>
    </GameShell>
  );
};

export default RunnerGame;
