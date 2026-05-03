import React, { useEffect, useMemo, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import { publicUrl } from "../assets/url";

type Props = { onComplete: (stars: number, detail: string) => void; onBack: () => void };

type Obstacle = {
  id: string;
  x: number;
  kind: "wall" | "bot";
  y: number;
  w: number;
  h: number;
  alive: boolean;
};

type Bullet = { id: string; x: number; y: number; vx: number; w: number; h: number };

type Splash = { id: string; x: number; y: number; color: string; born: number };

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const LS_3STAR_KEY = "dinobot_runner_3stars_v1";

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
  const STAGE_H = isMobile ? 480 : 430;
  const GROUND_Y = isMobile ? 372 : 350;

  // Player sizes scale up for tablets/phones
  const PLAYER_W = isMobile ? 96 : 78;
  const PLAYER_H = isMobile ? 110 : 90;

  const playerX = isMobile ? 110 : 160;

  // React snapshot state (render only)
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [hit, setHit] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const [showStarsMsg, setShowStarsMsg] = useState(false);

  // Stars are earned only if user reaches a high score (e.g. 5000)
  const STAR_SCORE = 5000;

  // ---- EASY MODE tuning (5-year-old friendly) ----
  const EASY = true;

  const stateRef = useRef({
    y: GROUND_Y,
    vy: 0,
    jumping: false,
    shooting: false,
    lastShot: 0,
    lastSpawn: 0,
    spawnEveryMs: EASY ? 1700 : 950, // fewer spawns
    speed: EASY ? 3.9 : 6, // slower
    maxObstacles: EASY ? 2 : 4, // less clutter
    botChance: EASY ? 0.22 : 0.55, // fewer bots
    minGapPx: EASY ? 260 : 120, // bigger gaps
  });

  // Persisted “already got 3 stars” flag (hide message forever after that)
  const has3Stars = useMemo(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(LS_3STAR_KEY) === "1";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (has3Stars) setShowStarsMsg(false);
  }, [has3Stars]);

  // Keep ref values in sync when responsive constants change
  useEffect(() => {
    stateRef.current.y = GROUND_Y;
    stateRef.current.vy = 0;
    stateRef.current.jumping = false;
    stateRef.current.shooting = false;
  }, [GROUND_Y]);

  useMemo(
    () => ({ x: playerX, y: (stateRef.current.y as number) - PLAYER_H, w: PLAYER_W, h: PLAYER_H }),
    [playerX, PLAYER_W, PLAYER_H]
  );

  // Easier jump: higher + a tiny "coyote time" + short input buffer
  const jumpBufferRef = useRef(0);
  const coyoteRef = useRef(0);

  const jump = () => {
    if (!running) return;
    jumpBufferRef.current = performance.now();
  };

  const doJumpNow = () => {
    const s = stateRef.current;
    if (s.jumping) return;
    s.jumping = true;
    s.vy = isMobile ? -22 : -20;
  };

  const shoot = () => {
    if (!running) return;
    const s = stateRef.current;
    const now = performance.now();

    const cooldown = isMobile ? 360 : 300;
    if (now - s.lastShot < cooldown) return;

    s.lastShot = now;
    s.shooting = true;

    window.setTimeout(() => {
      stateRef.current.shooting = false;
    }, 200);

    const id = String(Math.random()).slice(2);
    const px = playerX;
    const py = s.y - PLAYER_H;

    setBullets((prev) => [
      ...prev,
      {
        id,
        x: px + PLAYER_W - 6,
        y: py + Math.floor(PLAYER_H * 0.5),
        vx: isMobile ? 12 : 11,
        w: isMobile ? 28 : 24,
        h: isMobile ? 12 : 10,
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

  const spawnObstacle = () => {
    const s = stateRef.current;

    if (obstacles.filter((o) => o.alive).length >= s.maxObstacles) return;

    const alive = obstacles.filter((o) => o.alive);
    const rightMost = alive.reduce((m, o) => Math.max(m, o.x + o.w), -Infinity);
    if (Number.isFinite(rightMost) && rightMost > STAGE_W + 40 - s.minGapPx) return;

    const id = String(Math.random()).slice(2);
    const isBot = Math.random() < s.botChance;

    if (isBot) {
      const w = isMobile ? 74 : 60;
      const h = isMobile ? 74 : 64;
      setObstacles((prev) => [...prev, { id, x: STAGE_W + 40, y: GROUND_Y - h, w, h, kind: "bot", alive: true }]);
    } else {
      const tall = EASY ? Math.random() < 0.1 : Math.random() < 0.4;
      const w = isMobile ? 60 : 50;
      const h = tall ? (isMobile ? 130 : 105) : isMobile ? 78 : 62;

      setObstacles((prev) => [
        ...prev,
        { id, x: STAGE_W + 40, y: GROUND_Y - h, w, h, kind: "wall", alive: true },
      ]);
    }
  };

  const addSplash = (x: number, y: number, kind: "bot" | "wall") => {
    const now = performance.now();
    const id = String(Math.random()).slice(2);
    const color = kind === "bot" ? "rgba(56,189,248,0.95)" : "rgba(255,230,109,0.95)";
    setSplashes((prev) => [...prev, { id, x, y, color, born: now }]);
  };

  const raf = useRef<number | null>(null);
  useEffect(() => {
    let lastT = performance.now();

    const loop = (t: number) => {
      if (!running) return;

      const dtMs = clamp(t - lastT, 0, 34);
      lastT = t;

      const s = stateRef.current;

      const baseSpeed = EASY ? 3.9 : 6;
      const maxSpeed = EASY ? (isMobile ? 5.6 : 6.4) : isMobile ? 10 : 12;
      const speed = clamp(baseSpeed + Math.floor(score / (EASY ? 1200 : 250)) * 0.4, baseSpeed, maxSpeed);
      s.speed = speed;

      const baseSpawn = EASY ? 1700 : 980;
      const minSpawn = EASY ? 1200 : 520;
      const spawnEvery = clamp(baseSpawn - Math.floor(score / (EASY ? 140 : 6)), minSpawn, baseSpawn);
      s.spawnEveryMs = spawnEvery;

      const gravity = EASY ? (isMobile ? 0.78 : 0.72) : isMobile ? 1.0 : 0.9;

      const onGround = s.y >= GROUND_Y - 0.5;
      if (onGround) coyoteRef.current = t;

      const buffered = t - jumpBufferRef.current < 180;
      const canUseCoyote = t - coyoteRef.current < 140;

      if (buffered && (onGround || canUseCoyote) && !s.jumping) {
        jumpBufferRef.current = 0;
        doJumpNow();
      }

      s.vy += gravity * (dtMs / 16.67);
      s.y += s.vy * (dtMs / 16.67);

      if (s.y >= GROUND_Y) {
        s.y = GROUND_Y;
        s.vy = 0;
        s.jumping = false;
      }

      if (t - s.lastSpawn > s.spawnEveryMs) {
        s.lastSpawn = t;
        spawnObstacle();
      }

      setObstacles((prev) => prev.map((o) => ({ ...o, x: o.x - s.speed })).filter((o) => o.x > -260));

      setBullets((prev) => prev.map((b) => ({ ...b, x: b.x + b.vx })).filter((b) => b.x < STAGE_W + 260));

      setSplashes((prev) => prev.filter((sp) => t - sp.born < 420));

      setObstacles((prevObs) => {
        if (bullets.length === 0) return prevObs;
        const bs = bullets;

        return prevObs.map((o) => {
          if (!o.alive) return o;

          const oRect = { x: o.x, y: o.y, w: o.w, h: o.h };
          const hitByBullet = bs.some((b) => rectsOverlap({ x: b.x, y: b.y, w: b.w, h: b.h }, oRect));
          if (!hitByBullet) return o;

          addSplash(o.x + o.w * 0.45, o.y + o.h * 0.45, o.kind);
          return { ...o, alive: false };
        });
      });

      setBullets((prevB) => {
        const obsAlive = obstacles.filter((o) => o.alive);
        if (obsAlive.length === 0) return prevB;
        return prevB.filter((b) => {
          const bRect = { x: b.x, y: b.y, w: b.w, h: b.h };
          const hitAny = obsAlive.some((o) => rectsOverlap(bRect, { x: o.x, y: o.y, w: o.w, h: o.h }));
          return !hitAny;
        });
      });

      const pRectRaw = { x: playerX, y: s.y - PLAYER_H, w: PLAYER_W, h: PLAYER_H };
      const pPad = EASY ? 12 : 0;
      const pRect = {
        x: pRectRaw.x + pPad,
        y: pRectRaw.y + pPad,
        w: pRectRaw.w - pPad * 2,
        h: pRectRaw.h - pPad * 2,
      };

      const crash = obstacles.some((o) => {
        if (!o.alive) return false;
        const oPad = EASY ? 10 : 0;
        const oRect = { x: o.x + oPad, y: o.y + oPad, w: o.w - oPad * 2, h: o.h - oPad * 2 };
        return rectsOverlap(pRect, oRect);
      });

      if (crash) {
        setHit(true);
        setRunning(false);
        window.setTimeout(() => onComplete(0, `Score: ${score}`), 450);
        return;
      }

      setScore((s0) => s0 + 1);

      if (!has3Stars && !showStarsMsg && score > Math.floor(STAR_SCORE * 0.6)) setShowStarsMsg(true);

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, score, onComplete, isMobile, STAGE_W, PLAYER_H, PLAYER_W, GROUND_Y, playerX, obstacles, bullets, has3Stars, showStarsMsg]);

  useEffect(() => {
    if (!running) return;
    if (score < STAR_SCORE) return;

    try {
      window.localStorage.setItem(LS_3STAR_KEY, "1");
    } catch {
      // ignore
    }
    setShowStarsMsg(false);

    setHit(false);
    setRunning(false);
    window.setTimeout(() => onComplete(3, `Score: ${score}`), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, running]);

  // FIX: use publicUrl here (no more "/images/...")
  const playerImg = stateRef.current.shooting
    ? publicUrl("images/optimus-face.jpg")
    : stateRef.current.jumping
      ? publicUrl("images/optimus-fortnite.jpg")
      : publicUrl("images/optimus-pose.jpg");

  const ctrlBtn: React.CSSProperties = {
    flex: 1,
    minHeight: 80,
    borderRadius: 22,
    fontWeight: 900,
    fontSize: "1.25rem",
    border: "2px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
  };

  const restart = () => {
    setRunning(true);
    setHit(false);
    setScore(0);
    setObstacles([]);
    setBullets([]);
    setSplashes([]);
    stateRef.current.lastSpawn = performance.now();
    stateRef.current.lastShot = 0;
    stateRef.current.vy = 0;
    stateRef.current.y = GROUND_Y;
    stateRef.current.jumping = false;
    stateRef.current.shooting = false;
    jumpBufferRef.current = 0;
    coyoteRef.current = 0;
  };

  return (
    <GameShell current={score} total={STAR_SCORE} score={score} onBack={onBack}>
      <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: "1.2rem" }}>Score: {score}</div>
          <div style={{ opacity: 0.8, fontWeight: 800 }}>{isMobile ? "Tap buttons below" : "Space/Up = jump, Enter/Right = shoot"}</div>

          {!running && (
            <button
              onClick={restart}
              style={{
                marginLeft: "auto",
                height: 46,
                borderRadius: 16,
                padding: "0 14px",
                fontWeight: 900,
                border: "2px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
              }}
            >
              RESTART
            </button>
          )}
        </div>

        {!has3Stars && showStarsMsg && running && (
          <div
            style={{
              maxWidth: STAGE_W,
              margin: "0 auto 10px auto",
              borderRadius: 16,
              border: "2px solid rgba(255,230,109,0.35)",
              background: "rgba(255,230,109,0.10)",
              padding: "10px 12px",
              fontWeight: 900,
            }}
          >
            Sterne holen: Schaffe {STAR_SCORE} Punkte für ⭐⭐⭐
          </div>
        )}

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
            touchAction: "manipulation",
          }}
        >
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
              userSelect: "none",
            }}
            draggable={false}
          />

          {splashes.map((sp) => {
            const age = performance.now() - sp.born;
            const p = clamp(age / 420, 0, 1);
            const size = 18 + p * 54;
            const opacity = 1 - p;
            return (
              <div
                key={sp.id}
                style={{
                  position: "absolute",
                  left: sp.x - size / 2,
                  top: sp.y - size / 2,
                  width: size,
                  height: size,
                  borderRadius: 999,
                  pointerEvents: "none",
                  background: `radial-gradient(circle, ${sp.color} 0%, rgba(255,255,255,0.0) 70%)`,
                  opacity,
                  filter: "blur(0.2px)",
                  transform: `scale(${1 + p * 0.25})`,
                }}
              />
            );
          })}

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

          {obstacles
            .filter((o) => o.alive)
            .map((o) => (
              <img
                key={o.id}
                src={o.kind === "bot" ? publicUrl("images/Grimlock.webp") : publicUrl("images/trex.jpg")}
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
                  opacity: 0.96,
                  userSelect: "none",
                }}
                draggable={false}
              />
            ))}
        </div>

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

        <div style={{ opacity: 0.7, fontSize: "0.95rem", textAlign: "center", marginTop: 6 }}>
          Tip: Jump over walls. Shoot to clear the way. Reach {STAR_SCORE} for ⭐⭐⭐.
        </div>
      </div>
    </GameShell>
  );
};

export default RunnerGame;
