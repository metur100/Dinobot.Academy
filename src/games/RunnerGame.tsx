import React, { useEffect, useMemo, useRef, useState } from "react";
import GameShell from "../components/GameShell";

type Props = { onComplete: (stars: number, detail: string) => void; onBack: () => void };

type Obstacle = { id: string; x: number; kind: "wall" | "bot"; y: number; w: number; h: number; alive: boolean };
type Bullet = { id: string; x: number; y: number; vx: number; w: number; h: number };

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const RunnerGame: React.FC<Props> = ({ onComplete, onBack }) => {
  // Responsive “virtual” stage size
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = vw < 860;

  // Stage scales to device width
  const STAGE_W = isMobile ? Math.min(520, vw - 24) : 980;
  const STAGE_H = isMobile ? 460 : 420;
  const GROUND_Y = isMobile ? 360 : 340;

  // Player sizes scale up for tablets/phones
  const PLAYER_W = isMobile ? 88 : 70;
  const PLAYER_H = isMobile ? 96 : 80;

  const playerX = isMobile ? 110 : 160;

  // React snapshot state (render only)
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [hit, setHit] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);

  // Physics refs (authoritative)
  const stateRef = useRef({
    y: GROUND_Y,
    vy: 0,
    jumping: false,
    shooting: false,
    lastShot: 0,
    lastSpawn: 0,
    spawnEveryMs: 950,
    speed: 6,
  });

  // Keep ref values in sync when responsive constants change
  useEffect(() => {
    stateRef.current.y = GROUND_Y;
    stateRef.current.vy = 0;
    stateRef.current.jumping = false;
    stateRef.current.shooting = false;
  }, [GROUND_Y]);

  const playerRect = useMemo(
    () => ({ x: playerX, y: (stateRef.current.y as number) - PLAYER_H, w: PLAYER_W, h: PLAYER_H }),
    [playerX, PLAYER_W, PLAYER_H]
  );

  // Action helpers
  const jump = () => {
    if (!running) return;
    const s = stateRef.current;
    if (s.jumping) return;

    s.jumping = true;
    // stronger jump for mobile feel
    s.vy = isMobile ? -18 : -16;
  };

  const shoot = () => {
    if (!running) return;
    const s = stateRef.current;
    const now = performance.now();
    if (now - s.lastShot < (isMobile ? 320 : 260)) return;
    s.lastShot = now;
    s.shooting = true;

    // turn off “shoot pose” shortly after
    window.setTimeout(() => {
      stateRef.current.shooting = false;
    }, 180);

    const id = String(Math.random()).slice(2);
    const px = playerX;
    const py = s.y - PLAYER_H;

    setBullets((prev) => [
      ...prev,
      {
        id,
        x: px + PLAYER_W - 6,
        y: py + Math.floor(PLAYER_H * 0.45),
        vx: isMobile ? 13 : 12,
        w: isMobile ? 22 : 18,
        h: isMobile ? 10 : 8,
      },
    ]);
  };

  // Keyboard (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
      if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        shoot();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, isMobile]);

  // Spawn
  const spawnObstacle = () => {
    const id = String(Math.random()).slice(2);
    const isBot = Math.random() < 0.55;

    if (isBot) {
      const w = isMobile ? 78 : 64;
      const h = isMobile ? 78 : 68;
      setObstacles((prev) => [...prev, { id, x: STAGE_W + 40, y: GROUND_Y - h, w, h, kind: "bot", alive: true }]);
    } else {
      const tall = Math.random() < 0.4;
      const w = isMobile ? 62 : 52;
      const h = tall ? (isMobile ? 150 : 120) : isMobile ? 92 : 72;
      setObstacles((prev) => [
        ...prev,
        { id, x: STAGE_W + 40, y: GROUND_Y - h, w, h, kind: "wall", alive: true },
      ]);
    }
  };

  // Main loop (single RAF)
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let lastT = performance.now();

    const loop = (t: number) => {
      if (!running) return;

      const dtMs = clamp(t - lastT, 0, 34); // avoid huge jumps
      lastT = t;

      const s = stateRef.current;

      // Progressive difficulty (kid-friendly: slow start, gently faster)
      // Speed grows a bit with score
      const speed = clamp(6 + Math.floor(score / 250), 6, isMobile ? 10 : 12);
      s.speed = speed;
      s.spawnEveryMs = clamp(980 - Math.floor(score / 6), 520, 980);

      // Gravity
      s.vy += (isMobile ? 1.0 : 0.9) * (dtMs / 16.67);
      s.y += s.vy * (dtMs / 16.67);
      if (s.y >= GROUND_Y) {
        s.y = GROUND_Y;
        s.vy = 0;
        s.jumping = false;
      }

      // Spawn timing
      if (t - s.lastSpawn > s.spawnEveryMs) {
        s.lastSpawn = t;
        spawnObstacle();
      }

      // Move obstacles
      setObstacles((prev) =>
        prev
          .map((o) => ({ ...o, x: o.x - s.speed }))
          .filter((o) => o.x > -260)
      );

      // Move bullets
      setBullets((prev) =>
        prev
          .map((b) => ({ ...b, x: b.x + b.vx }))
          .filter((b) => b.x < STAGE_W + 260)
      );

      // Bullet collisions (use latest snapshots in state setters)
      setObstacles((prevObs) => {
        if (bullets.length === 0) return prevObs;
        const bs = bullets;

        return prevObs.map((o) => {
          if (!o.alive) return o;
          const oRect = { x: o.x, y: o.y, w: o.w, h: o.h };
          const hitByBullet = bs.some((b) => rectsOverlap({ x: b.x, y: b.y, w: b.w, h: b.h }, oRect));
          if (!hitByBullet) return o;

          if (o.kind === "bot") return { ...o, alive: false };
          if (o.kind === "wall" && o.h >= (isMobile ? 140 : 110)) return { ...o, alive: false };
          return o;
        });
      });

      // Remove bullets that hit alive obstacles
      setBullets((prevB) => {
        const obsAlive = obstacles.filter((o) => o.alive);
        if (obsAlive.length === 0) return prevB;
        return prevB.filter((b) => {
          const bRect = { x: b.x, y: b.y, w: b.w, h: b.h };
          const hitAny = obsAlive.some((o) => rectsOverlap(bRect, { x: o.x, y: o.y, w: o.w, h: o.h }));
          return !hitAny;
        });
      });

      // Player collision
      const pRect = { x: playerX, y: s.y - PLAYER_H, w: PLAYER_W, h: PLAYER_H };
      const crash = obstacles.some((o) => o.alive && rectsOverlap(pRect, { x: o.x, y: o.y, w: o.w, h: o.h }));

      if (crash) {
        setHit(true);
        setRunning(false);

        window.setTimeout(() => {
          const stars = score >= 25 ? 3 : score >= 12 ? 2 : 1;
          onComplete(stars, `Score: ${score}`);
        }, 650);
        return;
      }

      // Score tick (slower on mobile so it feels fair)
      setScore((s0) => s0 + 1);

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, score, onComplete, isMobile, STAGE_W, PLAYER_H, PLAYER_W, GROUND_Y, playerX, obstacles, bullets]);

  // Player image state (pose)
  const playerImg = stateRef.current.shooting
    ? "/images/optimus-face.jpg"
    : stateRef.current.jumping
      ? "/images/optimus-fortnite.jpg"
      : "/images/optimus-pose.jpg";

  // Big touch controls
  const ctrlBtn: React.CSSProperties = {
    flex: 1,
    minHeight: 74,
    borderRadius: 22,
    fontWeight: 900,
    fontSize: "1.25rem",
    border: "2px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
  };

  return (
    <GameShell current={score} total={9999} score={score} onBack={onBack}>
      <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto" }}>
        {/* HUD */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: "1.2rem" }}>Score: {score}</div>
          <div style={{ opacity: 0.8, fontWeight: 800 }}>
            {isMobile ? "Tap buttons below" : "Space/Up = jump, Enter/Right = shoot"}
          </div>
        </div>

        {/* Stage */}
        <div
          style={{
            width: "100%",
            maxWidth: STAGE_W,
            height: STAGE_H,
            borderRadius: 22,
            border: "2px solid rgba(255,255,255,0.14)",
            background: "linear-gradient(180deg, rgba(30,41,59,0.95), rgba(2,6,23,0.95))",
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
            position: "relative",
            overflow: "hidden",
            margin: "0 auto",
          }}
        >
          {/* ground */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: GROUND_Y,
              height: STAGE_H - GROUND_Y,
              background: "rgba(255,255,255,0.05)",
            }}
          />

          {/* player */}
          <img
            src={playerImg}
            alt="player"
            style={{
              position: "absolute",
              left: playerX,
              top: stateRef.current.y - PLAYER_H,
              width: PLAYER_W,
              height: PLAYER_H,
              objectFit: "cover",
              borderRadius: 18,
              border: "2px solid rgba(255,255,255,0.14)",
              boxShadow: hit ? "0 0 0 8px rgba(239,68,68,0.35)" : "0 18px 34px rgba(0,0,0,0.45)",
              transform: stateRef.current.jumping ? "rotate(-3deg)" : "none",
            }}
          />

          {/* bullets */}
          {bullets.map((b) => (
            <div
              key={b.id}
              style={{
                position: "absolute",
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h,
                borderRadius: 999,
                background: "rgba(56,189,248,0.95)",
                boxShadow: "0 0 18px rgba(56,189,248,0.8)",
              }}
            />
          ))}

          {/* obstacles */}
          {obstacles.filter((o) => o.alive).map((o) => (
            <img
              key={o.id}
              src={o.kind === "bot" ? "/images/Grimlock.webp" : "/images/trex.jpg"}
              alt={o.kind}
              style={{
                position: "absolute",
                left: o.x,
                top: o.y,
                width: o.w,
                height: o.h,
                objectFit: "cover",
                borderRadius: 18,
                border: "2px solid rgba(255,255,255,0.14)",
                boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
                filter: o.kind === "bot" ? "saturate(1.1)" : "none",
              }}
            />
          ))}
        </div>

        {/* Big mobile controls fixed-ish at bottom of the game view */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 12,
            width: "100%",
            maxWidth: STAGE_W,
            marginLeft: "auto",
            marginRight: "auto",
            paddingBottom: 8,
          }}
        >
          <button
            onClick={jump}
            style={{
              ...ctrlBtn,
              background: "linear-gradient(180deg, rgba(255,230,109,0.22), rgba(255,255,255,0.06))",
              border: "2px solid rgba(255,230,109,0.45)",
            }}
          >
            JUMP
          </button>
          <button
            onClick={shoot}
            style={{
              ...ctrlBtn,
              background: "linear-gradient(180deg, rgba(56,189,248,0.22), rgba(255,255,255,0.06))",
              border: "2px solid rgba(56,189,248,0.45)",
            }}
          >
            SHOOT
          </button>
        </div>

        {/* Extra “tap anywhere” controls for kids (optional) */}
        <div style={{ opacity: 0.7, fontSize: "0.95rem", textAlign: "center", marginTop: 6 }}>
          Tip: Tap JUMP to hop over walls. Tap SHOOT to zap bots.
        </div>
      </div>
    </GameShell>
  );
};

export default RunnerGame;
