import React, { useState, useCallback } from "react";
import { PATTERN_IMAGES, DINOBOTS } from "../data/gameData";
import { useLang } from "../data/LangContext";
import DinoBot from "../components/DinoBot";
import GameShell from "../components/GameShell";
import WinScreen from "../components/WinScreen";
import Icon from "../components/Icon";

interface Props {
  onComplete: (s: number) => void;
  onBack: () => void;
}

const TOTAL = 7;

const genRound = (difficulty: number) => {
  // 2, 3, or 4 items in pattern
  const patLen = 2 + Math.min(difficulty, 2);

  // Make sure we always have enough pool
  const poolSize = Math.min(PATTERN_IMAGES.length, 4 + difficulty);
  const pool = PATTERN_IMAGES.slice(0, Math.max(2, poolSize));

  const pattern: string[] = [];
  for (let i = 0; i < patLen; i++) pattern.push(pool[Math.floor(Math.random() * pool.length)]);

  // show 2 repetitions then ask for next
  const shown = [...pattern, ...pattern];
  const answer = pattern[0];

  // Wrong choices (unique-ish)
  const wrong = pool
    .filter((x) => x !== answer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const choices = [...wrong, answer].sort(() => Math.random() - 0.5);

  return { shown, answer, choices };
};

const PatternsGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const { t } = useLang();

  const [difficulty, setDifficulty] = useState(0);
  const [round, setRound] = useState(() => genRound(0));
  const [selected, setSelected] = useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [power, setPower] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const dinobot = DINOBOTS[7];

  const pick = useCallback(
    (img: string) => {
      if (selected) return;

      setSelected(img);
      const ok = img === round.answer;

      if (ok) {
        setScore((s) => s + 1);
        setPower((p) => Math.min(100, p + 14));
      }

      window.setTimeout(() => {
        const next = answered + 1;
        setAnswered(next);

        if (next >= TOTAL) {
          setGameOver(true);
          return;
        }

        const newDiff = Math.floor(next / 2);
        setDifficulty(newDiff);
        setRound(genRound(newDiff));
        setSelected(null);
      }, 900);
    },
    [selected, round.answer, answered]
  );

  const stars = score >= 5 ? 3 : score >= 3 ? 2 : 1;

  if (gameOver) {
    return (
      <WinScreen
        stars={stars}
        dinobot={dinobot}
        powerLevel={power}
        detail={`${t.youGot} ${score} ${t.outOf} ${TOTAL} ${t.right}`}
        onBack={onBack}
        onClaim={() => onComplete(stars)}
      />
    );
  }

  const Tile: React.FC<{ src: string; size?: number }> = ({ src, size = 64 }) => (
    <div
      style={{
        width: size + 16,
        height: size + 16,
        borderRadius: 14,
        background: "#2a3a4a",
        border: "2px solid #3a4a5a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Icon
        src={src}
        alt="pattern"
        size={size}
        radius={12}
        style={{
          border: "none",
          boxShadow: "none",
          background: "transparent",
        }}
      />
    </div>
  );

  return (
    <GameShell current={answered + 1} total={TOTAL} score={score} onBack={onBack}>
      <DinoBot {...dinobot} powerLevel={power} size={80} />

      <div className="card" style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
        <h2 style={{ color: "#d97706", marginBottom: 6, fontSize: "1.25rem" }}>{t.patterns.title}</h2>
        <p style={{ color: "#7a8fa6", marginBottom: 18, fontSize: "0.88rem" }}>{t.patterns.desc}</p>

        {/* Pattern display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 22,
            background: "#1e2d3d",
            borderRadius: 16,
            padding: "18px",
            border: "3px solid #d97706",
          }}
        >
          {round.shown.map((src, i) => (
            <Tile key={`${src}-${i}`} src={src} />
          ))}

          {/* Missing slot (no emoji) */}
          <div
            className="pulse"
            style={{
              width: 80,
              height: 80,
              borderRadius: 14,
              background: "#d9770633",
              border: "2px dashed #d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Fredoka One,cursive",
              fontSize: "1.6rem",
              color: "#ffe6c7",
              userSelect: "none",
            }}
          >
            ?
          </div>
        </div>

        {/* Choices */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {round.choices.map((src, idx) => {
            const isSel = selected === src;
            const isOk = src === round.answer;

            let bg = "#1e2d3d";
            let border = "#2a3a4a";

            if (isSel) {
              bg = isOk ? "#22c55e22" : "#ef444422";
              border = isOk ? "#22c55e" : "#ef4444";
            } else if (selected && isOk) {
              bg = "#22c55e22";
              border = "#22c55e";
            }

            return (
              <button
                key={`${src}-${idx}`} // important: allow duplicates safely
                onClick={() => pick(src)}
                disabled={!!selected}
                style={{
                  padding: "14px",
                  borderRadius: 14,
                  background: bg,
                  border: `3px solid ${border}`,
                  cursor: selected ? "default" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 92,
                }}
              >
                <Icon
                  src={src}
                  alt="choice"
                  size={70}
                  radius={14}
                  style={{
                    border: "none",
                    boxShadow: "none",
                    background: "transparent",
                    transform: isSel ? "scale(1.03)" : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Optional feedback text instead of emoji */}
        {selected && (
          <div style={{ marginTop: 14, fontSize: "0.9rem", color: "#7a8fa6" }}>
            {selected === round.answer ? t.patterns.correct ?? "Correct!" : t.patterns.wrong ?? "Try again!"}
          </div>
        )}
      </div>
    </GameShell>
  );
};

export default PatternsGame;
