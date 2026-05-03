import React, { useState, useEffect, useCallback } from "react";
import { DINOBOTS } from "../data/gameData";
import { useLang } from "../data/LangContext";
import DinoBot from "../components/DinoBot";
import GameShell from "../components/GameShell";
import WinScreen from "../components/WinScreen";
import { publicUrl } from "../assets/url";

interface Props {
  onComplete: (s: number) => void;
  onBack: () => void;
}
interface Q {
  a: number;
  b: number;
  op: "+" | "-";
  ans: number;
}

const genQ = (): Q => {
  const op = Math.random() > 0.5 ? "+" : "-";
  let a = Math.floor(Math.random() * 10) + 1;
  let b = Math.floor(Math.random() * 10) + 1;
  if (op === "-" && b > a) [a, b] = [b, a];
  return { a, b, op, ans: op === "+" ? a + b : a - b };
};

const genChoices = (ans: number) => {
  const s = new Set<number>([ans]);
  while (s.size < 4) {
    const off = Math.floor(Math.random() * 5) + 1;
    s.add(Math.random() > 0.5 ? ans + off : Math.max(0, ans - off));
  }
  return Array.from(s).sort(() => Math.random() - 0.5);
};

const TOTAL = 8;

const NumbersGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const { t } = useLang();
  const [q, setQ] = useState<Q>(genQ);
  const [choices, setChoices] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [power, setPower] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const dinobot = {
    ...DINOBOTS[1],
    image: DINOBOTS[1].image || publicUrl("images/dinobot1.webp"),
    emoji: "",
  };

  useEffect(() => {
    setChoices(genChoices(q.ans));
  }, [q]);

  const pick = useCallback(
    (c: number) => {
      if (selected !== null) return;
      setSelected(c);
      const ok = c === q.ans;
      if (ok) {
        setScore((s) => s + 1);
        setPower((p) => Math.min(100, p + 13));
      }
      setTimeout(() => {
        const next = answered + 1;
        setAnswered(next);
        if (next >= TOTAL) {
          setGameOver(true);
          return;
        }
        setQ(genQ());
        setSelected(null);
      }, 850);
    },
    [selected, q.ans, answered]
  );

  const stars = score >= 6 ? 3 : score >= 4 ? 2 : 1;

  if (gameOver)
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

  const unitImg = publicUrl("images/optimus-face.jpg");

  return (
    <GameShell current={answered + 1} total={TOTAL} score={score} onBack={onBack}>
      <DinoBot {...dinobot} powerLevel={power} size={85} />
      <div className="card" style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
        <h2 style={{ color: "#4ecdc4", marginBottom: 6, fontSize: "1.25rem" }}>{t.numbers.title}</h2>
        <p style={{ color: "#7a8fa6", marginBottom: 14, fontSize: "0.88rem" }}>{t.numbers.desc}</p>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 2, minHeight: 44, marginBottom: 12 }}>
          {Array.from({ length: q.a }, (_, i) => (
            <img key={i} src={unitImg} alt="unit" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover", marginRight: 6 }} draggable={false} />
          ))}
          <span style={{ fontSize: "1.4rem", margin: "0 6px" }}>{q.op === "+" ? "➕" : "➖"}</span>
          {Array.from({ length: q.b }, (_, i) => (
            <img
              key={i}
              src={unitImg}
              alt="unit"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                objectFit: "cover",
                marginRight: 6,
                opacity: q.op === "-" ? 0.3 : 1,
              }}
              draggable={false}
            />
          ))}
        </div>

        <div
          style={{
            fontSize: "2.8rem",
            fontFamily: "Fredoka One,cursive",
            background: "#1e2d3d",
            borderRadius: 16,
            padding: "14px 20px",
            marginBottom: 22,
            letterSpacing: 4,
          }}
        >
          {q.a} {q.op} {q.b} = ?
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {choices.map((c) => {
            const isSel = selected === c;
            const isOk = c === q.ans;
            let bg = "#1e2d3d",
              border = "#2a3a4a";
            if (isSel) {
              bg = isOk ? "#22c55e22" : "#ef444422";
              border = isOk ? "#22c55e" : "#ef4444";
            } else if (selected !== null && isOk) {
              bg = "#22c55e22";
              border = "#22c55e";
            }
            return (
              <button
                key={c}
                onClick={() => pick(c)}
                style={{
                  padding: "16px",
                  borderRadius: 14,
                  fontSize: "1.9rem",
                  fontFamily: "Fredoka One,cursive",
                  background: bg,
                  color: "#f0f4f8",
                  border: `3px solid ${border}`,
                  transition: "all 0.2s",
                  cursor: selected !== null ? "default" : "pointer",
                }}
              >
                {c}
                {isSel && (isOk ? " ✅" : " ❌")}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};

export default NumbersGame;
