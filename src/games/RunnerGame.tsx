import React, { useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import { publicUrl } from "../assets/url";

type Props = { onComplete: (stars: number, detail: string) => void; onBack: () => void };

type CarChoice = "optimus" | "bumblebee";
type Obstacle = { id: string; lane: number; y: number; kind: "" | "" };
type Pickup = { id: string; lane: number; y: number; kind: "nitro" };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const randId = () => String(Math.random()).slice(2);

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const RunnerGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = vw < 860;

  const STAGE_W = isMobile ? Math.min(560, vw - 24) : 980;
  const STAGE_H = isMobile ? 580 : 540;

  const LANES = 3;
  const ROAD_PAD = isMobile ? 18 : 24;
  const ROAD_W = STAGE_W - ROAD_PAD * 2;
  const LANE_W = ROAD_W / LANES;

  const CAR_W = isMobile ? 94 : 84;
  const CAR_H = isMobile ? 130 : 120;

  const OB_W = isMobile ? 84 : 72;
  const OB_H = isMobile ? 84 : 72;

  const PICK_W = isMobile ? 70 : 60;
  const PICK_H = isMobile ? 70 : 60;

  const carBaseY = STAGE_H - (isMobile ? 185 : 175);

  const [choice, setChoice] = useState<CarChoice | null>(null);
  const [running, setRunning] = useState(false);
  const [hit, setHit] = useState(false);
  const [distance, setDistance] = useState(0);
  const [nitroMs, setNitroMs] = useState(0);

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  useEffect(() => void (obstaclesRef.current = obstacles), [obstacles]);
  useEffect(() => void (pickupsRef.current = pickups), [pickups]);

  // Stars
  const STAR_THRESHOLDS = [600, 1400, 2400];
  const starsFromScore = (d: number) => (d >= STAR_THRESHOLDS[2] ? 3 : d >= STAR_THRESHOLDS[1] ? 2 : d >= STAR_THRESHOLDS[0] ? 1 : 0);

  const [bestStars, setBestStars] = useState(0);

  // Hint popup only AFTER crash, and only until 3★
  const [showStarHint, setShowStarHint] = useState(false);
  const shownHintThisCrashRef = useRef(false);

  // Banner once at 3★
  const [showStarsUnlocked, setShowStarsUnlocked] = useState(false);
  const bannerShownRef = useRef(false);

  const raf = useRef<number | null>(null);

  const sRef = useRef({
    targetLane: 1,
    laneLerp: 1,
    lastSpawnObs: 0,
    lastSpawnNitro: 0,
    baseSpeed: 4.0,
    speed: 4.0,
  });

  // images (WORKING PATHS)
  const optimusImg = publicUrl("images/optimus-top.png");
  const bumbleImg = publicUrl("images/bumblebee-top.png");
  const obstacleImg = publicUrl("images/obstacle.png");
  const nitroImg = publicUrl("images/nitro.png");

  const carImg = choice === "bumblebee" ? bumbleImg : optimusImg;

  const carX = (laneLerp: number) => ROAD_PAD + laneLerp * LANE_W + LANE_W / 2 - CAR_W / 2;

  const obstacleRect = (o: Obstacle) => ({
    x: ROAD_PAD + o.lane * LANE_W + LANE_W / 2 - OB_W / 2,
    y: o.y,
    w: OB_W,
    h: OB_H,
  });

  const pickupRect = (p: Pickup) => ({
    x: ROAD_PAD + p.lane * LANE_W + LANE_W / 2 - PICK_W / 2,
    y: p.y,
    w: PICK_W,
    h: PICK_H,
  });

  const carRect = (laneLerp: number) => ({
    x: carX(laneLerp),
    y: carBaseY,
    w: CAR_W,
    h: CAR_H,
  });

  const moveLeft = () => {
    if (!running) return;
    sRef.current.targetLane = clamp(sRef.current.targetLane - 1, 0, LANES - 1);
  };
  const moveRight = () => {
    if (!running) return;
    sRef.current.targetLane = clamp(sRef.current.targetLane + 1, 0, LANES - 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        e.preventDefault();
        moveLeft();
      }
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        e.preventDefault();
        moveRight();
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, choice]);

  const spawnObstacle = () => {
    const alive = obstaclesRef.current.filter((o) => o.y < STAGE_H + 120);
    if (alive.length >= 2) return;

    const used = new Set(alive.map((o) => o.lane));
    let lane = Math.floor(Math.random() * LANES);
    if (used.has(lane) && Math.random() < 0.85) lane = (lane + 1) % LANES;

    const kind: Obstacle["kind"] = Math.random() < 0.55 ? "" : "";
    setObstacles((prev) => [...prev, { id: randId(), lane, y: -OB_H - 18, kind }]);
  };

  const spawnNitro = () => {
    const alive = pickupsRef.current.filter((p) => p.y < STAGE_H + 120);
    if (alive.length >= 1) return;
    const lane = Math.floor(Math.random() * LANES);
    setPickups((prev) => [...prev, { id: randId(), lane, y: -PICK_H - 26, kind: "nitro" }]);
  };

  const startGame = (c: CarChoice) => {
    setChoice(c);
    setRunning(true);
    setHit(false);
    setDistance(0);
    setNitroMs(0);
    setObstacles([]);
    setPickups([]);
    setShowStarHint(false);

    shownHintThisCrashRef.current = false;

    const now = performance.now();
    sRef.current.targetLane = 1;
    sRef.current.laneLerp = 1;
    sRef.current.lastSpawnObs = now - 9999;
    sRef.current.lastSpawnNitro = now - 9999;

    window.setTimeout(() => spawnObstacle(), 50);
    window.setTimeout(() => spawnObstacle(), 500);
    window.setTimeout(() => spawnNitro(), 900);
  };

  const restart = () => {
    if (!choice) return;
    startGame(choice);
  };

  const endFail = () => {
    setHit(true);
    setRunning(false);

    const earned = starsFromScore(distance);
    const nextBest = Math.max(bestStars, earned);
    if (nextBest !== bestStars) setBestStars(nextBest);

    // show hint ONLY after crash and only until 3★
    if (nextBest < 3 && !shownHintThisCrashRef.current) {
      shownHintThisCrashRef.current = true;
      setShowStarHint(true);
    }
  };

  // Update bestStars during run + show banner once at 3★
  useEffect(() => {
    const nowStars = starsFromScore(distance);
    if (nowStars > bestStars) setBestStars(nowStars);

    if (nowStars >= 3) {
      setShowStarHint(false);

      if (!bannerShownRef.current) {
        bannerShownRef.current = true;
        setShowStarsUnlocked(true);
        window.setTimeout(() => setShowStarsUnlocked(false), 1400);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distance]);

  useEffect(() => {
    if (!running) return;

    let lastT = performance.now();

    const loop = (t: number) => {
      if (!running) return;

      const dtMs = clamp(t - lastT, 0, 34);
      lastT = t;

      const s = sRef.current;

      const lerpSpeed = isMobile ? 0.2 : 0.18;
      s.laneLerp = s.laneLerp + (s.targetLane - s.laneLerp) * lerpSpeed;

      const nitroOn = nitroMs > 0;

      const base = 4.0;
      const maxExtra = 3.0;
      const ramp = clamp(Math.floor(distance / 520) * 0.2, 0, maxExtra);
      s.baseSpeed = base + ramp;

      const speed = nitroOn ? s.baseSpeed * 1.65 : s.baseSpeed;
      s.speed = speed;

      const spawnObsEvery = 1050;
      const spawnNitroEvery = 2600;

      if (t - s.lastSpawnObs > spawnObsEvery) {
        s.lastSpawnObs = t;
        spawnObstacle();
      }
      if (t - s.lastSpawnNitro > spawnNitroEvery) {
        s.lastSpawnNitro = t;
        if (Math.random() < 0.8) spawnNitro();
      }

      setObstacles((prev) => prev.map((o) => ({ ...o, y: o.y + speed })).filter((o) => o.y < STAGE_H + 240));
      setPickups((prev) => prev.map((p) => ({ ...p, y: p.y + speed })).filter((p) => p.y < STAGE_H + 240));

      const cRect = carRect(s.laneLerp);

      const crash = obstaclesRef.current.some((o) => rectsOverlap(cRect, obstacleRect(o)));
      if (crash) {
        endFail();
        return;
      }

      const gotNitro = pickupsRef.current.some((p) => rectsOverlap(cRect, pickupRect(p)));
      if (gotNitro) {
        setPickups((prev) => prev.filter((p) => !rectsOverlap(cRect, pickupRect(p))));
        setNitroMs((ms) => Math.max(ms, 1400));
      }

      setDistance((d) => d + speed);
      if (nitroMs > 0) setNitroMs((ms) => Math.max(0, ms - dtMs));

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, isMobile, STAGE_H, STAGE_W, ROAD_PAD, ROAD_W, LANE_W, nitroMs, distance]);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const scoreNow = Math.round(distance);

  return (
  <GameShell
    current={scoreNow}
    total={2400}
    score={0}
    onBack={onBack}
  >
      <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          {choice && (
            <button
              onClick={restart}
              style={{
                marginLeft: "auto",
                height: 52,
                borderRadius: 16,
                padding: "0 16px",
                fontWeight: 1000,
                border: "2px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
              }}
            >
              RESTART
            </button>
          )}
        </div>

        {!choice && (
          <div
            style={{
              maxWidth: STAGE_W,
              margin: "0 auto",
              borderRadius: 22,
              border: "2px solid rgba(255,255,255,0.14)",
              background: "linear-gradient(180deg, rgba(30,41,59,0.95), rgba(2,6,23,0.95))",
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              padding: 18,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <button
                onClick={() => startGame("optimus")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  borderRadius: 18,
                  border: "2px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 1000,
                  fontSize: "1.2rem",
                }}
              >
                <img src={optimusImg} alt="Optimus" style={{ width: 92, height: 92, objectFit: "contain" }} draggable={false} />
                Optimus Prime
              </button>

              <button
                onClick={() => startGame("bumblebee")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  borderRadius: 18,
                  border: "2px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 1000,
                  fontSize: "1.2rem",
                }}
              >
                <img src={bumbleImg} alt="Bumblebee" style={{ width: 92, height: 92, objectFit: "contain" }} draggable={false} />
                Bumblebee
              </button>
            </div>
          </div>
        )}

        {choice && (
          <>
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
              <div
                style={{
                  position: "absolute",
                  left: ROAD_PAD,
                  top: 0,
                  width: ROAD_W,
                  height: "100%",
                  borderRadius: 18,
                  background: "linear-gradient(180deg, rgba(148,163,184,0.12), rgba(148,163,184,0.06))",
                  border: "2px solid rgba(255,255,255,0.10)",
                }}
              />
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: ROAD_PAD + i * LANE_W,
                    top: 0,
                    width: 2,
                    height: "100%",
                    background: "rgba(255,255,255,0.08)",
                  }}
                />
              ))}

              {obstacles.map((o) => {
                const r = obstacleRect(o);
                return (
                  <div
                    key={o.id}
                    style={{
                      position: "absolute",
                      left: r.x,
                      top: r.y,
                      width: r.w,
                      height: r.h,
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "2px solid rgba(255,255,255,0.14)",
                      background: o.kind === "" ? "rgba(249,115,22,0.22)" : "rgba(148,163,184,0.18)",
                      boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 1000,
                    }}
                  >
                    <img
                      src={obstacleImg}
                      alt="obstacle"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.95 }}
                      draggable={false}
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                    />
                    {o.kind === "" ? "" : ""}
                  </div>
                );
              })}

              {pickups.map((p) => {
                const r = pickupRect(p);
                return (
                  <div
                    key={p.id}
                    style={{
                      position: "absolute",
                      left: r.x,
                      top: r.y,
                      width: r.w,
                      height: r.h,
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "2px solid rgba(56,189,248,0.35)",
                      background: "rgba(56,189,248,0.18)",
                      boxShadow: "0 0 18px rgba(56,189,248,0.35)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 1100,
                    }}
                  >
                    <img
                      src={nitroImg}
                      alt="nitro"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.95 }}
                      draggable={false}
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                    />
                    NITRO
                  </div>
                );
              })}

              <div
                style={{
                  position: "absolute",
                  left: carX(sRef.current.laneLerp),
                  top: carBaseY,
                  width: CAR_W,
                  height: CAR_H,
                  borderRadius: 18,
                  border: "2px solid rgba(255,255,255,0.14)",
                  overflow: "hidden",
                  background: "rgba(0,0,0,0.14)",
                  boxShadow: hit ? "0 0 0 10px rgba(239,68,68,0.35)" : "0 18px 34px rgba(0,0,0,0.45)",
                }}
              >
                <img src={carImg} alt="car" style={{ width: "100%", height: "100%", objectFit: "contain" }} draggable={false} />
              </div>

              {nitroMs > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: carX(sRef.current.laneLerp) + CAR_W / 2 - 18,
                    top: carBaseY + CAR_H - 6,
                    width: 36,
                    height: 56,
                    borderRadius: 999,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(circle at 50% 20%, rgba(255,230,109,0.95), rgba(255,119,0,0.75) 45%, rgba(255,0,0,0.0) 72%)",
                    filter: "blur(0.25px)",
                    opacity: 0.95,
                  }}
                />
              )}
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
                onClick={moveLeft}
                style={{
                  flex: 1,
                  minHeight: 88,
                  borderRadius: 22,
                  fontWeight: 1000,
                  fontSize: "1.35rem",
                  border: "2px solid rgba(255,230,109,0.45)",
                  background: "linear-gradient(180deg, rgba(255,230,109,0.22), rgba(255,255,255,0.06))",
                  color: "white",
                  boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
                }}
              >
                LEFT
              </button>
              <button
                onClick={moveRight}
                style={{
                  flex: 1,
                  minHeight: 88,
                  borderRadius: 22,
                  fontWeight: 1000,
                  fontSize: "1.35rem",
                  border: "2px solid rgba(56,189,248,0.45)",
                  background: "linear-gradient(180deg, rgba(56,189,248,0.22), rgba(255,255,255,0.06))",
                  color: "white",
                  boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
                }}
              >
                RIGHT
              </button>
            </div>

          </>
        )}
      </div>
    </GameShell>
  );
};

export default RunnerGame;
