import React, { useState, useCallback, useEffect } from "react";
import { LangProvider, useLang } from "./data/LangContext";
import { Mission } from "./data/gameData";
import HomeScreen from "./components/HomeScreen";
/* import LettersGame  from './games/LettersGame';
import NumbersGame  from './games/NumbersGame';
import ShapesGame   from './games/ShapesGame';
import ColorsGame   from './games/ColorsGame'; */
import MemoryGame from "./games/MemoryGame";
import PuzzleGame from "./games/PuzzleGame";
/* import CountingGame from './games/CountingGame';
import PatternsGame from './games/PatternsGame'; */
import PhotoPuzzleGame from "./games/PhotoPuzzleGame";
import RunnerGame from "./games/RunnerGame";
import { sounds } from "./audio/sound";
import StarRating from "./components/StarRating";

const STORAGE_KEY = "dinobot-stars-v2";
const load = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};
const save = (data: Record<string, number>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

type View = "home" | Mission["game"];

const Inner: React.FC = () => {
  const { t } = useLang();
  const [view, setView] = useState<View>("home");
  const [missionId, setMissionId] = useState("");
  const [stars, setStars] = useState<Record<string, number>>(load);
  const [celebration, setCelebration] = useState(false);

  const [lastEarned, setLastEarned] = useState(0);
  const [lastMissionId, setLastMissionId] = useState("");

  const handleSelect = useCallback((m: Mission) => {
    setMissionId(m.id);
    setView(m.game);
  }, []);

  const handleComplete = useCallback(
    (earned: number) => {
      setLastEarned(earned);
      setLastMissionId(missionId);

      setStars((prev) => {
        const updated = { ...prev, [missionId]: Math.max(prev[missionId] ?? 0, earned) };
        save(updated);
        return updated;
      });

      // Show overlay only if earned > 0
      if (earned > 0) {
        setCelebration(true);
      }
    },
    [missionId]
  );

  const handleBack = useCallback(() => setView("home"), []);
  const gp = { onComplete: handleComplete, onBack: handleBack };

  useEffect(() => {
    // Start BG music after first user gesture (mobile friendly)
    const onFirstGesture = () => {
      sounds.startBg();
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };

    window.addEventListener("pointerdown", onFirstGesture, { passive: true });
    window.addEventListener("touchstart", onFirstGesture, { passive: true });
    window.addEventListener("keydown", onFirstGesture);

    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, []);

  return (
    <>
      {celebration && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="pop" style={{ textAlign: "center", minWidth: 320 }}>
            <div style={{ height: 12 }} />

            <h2
              style={{
                fontFamily: "Fredoka One,cursive",
                fontSize: "2.3rem",
                background: "linear-gradient(135deg,#ff6b35,#ffe66d)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
              }}
            >
              {t.claimStars}
            </h2>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
              <StarRating stars={lastEarned} />
            </div>

            <div style={{ height: 16 }} />

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                className="btn btn-muted"
                onClick={() => {
                  setCelebration(false);
                  // stay in game (no forced home)
                }}
              >
                OK
              </button>

              <button
                className="btn btn-yellow"
                onClick={() => {
                  setCelebration(false);
                  setView("home");
                }}
              >
                {t.academy}
              </button>
            </div>

            <div style={{ height: 10, opacity: 0.65, fontSize: "0.9rem" }}>
              Mission: {lastMissionId} • Stars: {lastEarned}
            </div>
          </div>
        </div>
      )}

      {view === "home" && <HomeScreen missionStars={stars} onSelect={handleSelect} />}
      {/* {view === 'letters'  && <LettersGame  {...gp} />}
      {view === 'numbers'  && <NumbersGame  {...gp} />}
      {view === 'shapes'   && <ShapesGame   {...gp} />}
      {view === 'colors'   && <ColorsGame   {...gp} />} */}
      {view === "memory" && <MemoryGame {...gp} />}
      {view === "puzzle" && <PuzzleGame {...gp} />}
      {/* {view === 'counting' && <CountingGame {...gp} />}
      {view === 'patterns' && <PatternsGame {...gp} />} */}
      {view === "photoPuzzle" && <PhotoPuzzleGame {...gp} />}
      {view === "runner" && <RunnerGame {...gp} />}
    </>
  );
};

const App: React.FC = () => (
  <LangProvider>
    <Inner />
  </LangProvider>
);

export default App;
