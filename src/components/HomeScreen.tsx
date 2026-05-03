import React from "react";
import { MISSIONS, Mission } from "../data/gameData";
import { useLang } from "../data/LangContext";
import StarRating from "./StarRating";
import { publicUrl } from "../assets/url";

interface Props {
  missionStars: Record<string, number>;
  onSelect: (m: Mission) => void;
}

const HomeScreen: React.FC<Props> = ({ missionStars, onSelect }) => {
  const { lang, setLang, t } = useLang();
  const total = Object.values(missionStars).reduce((a, b) => a + b, 0);
  const max = MISSIONS.length * 3;
  const r = total / max;

  const upgrade =
    r >= 0.8
      ? { label: t.upgrades.ultra, color: "#ffe66d" }
      : r >= 0.5
        ? { label: t.upgrades.power, color: "#4ecdc4" }
        : r >= 0.2
          ? { label: t.upgrades.battle, color: "#ff6b35" }
          : { label: t.upgrades.cadet, color: "#a855f7" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "20px", overflowY: "auto" }}>
      {/* Language switcher */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
        {(["de", "bs"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              padding: "7px 16px",
              borderRadius: 50,
              fontFamily: "Fredoka One,cursive",
              fontSize: "0.95rem",
              background: lang === l ? "#ffe66d" : "var(--card)",
              color: lang === l ? "#0d1117" : "#7a8fa6",
              border: `2px solid ${lang === l ? "#ffe66d" : "#2a3a4a"}`,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {l === "de" ? "🇩🇪 Deutsch" : "🇧🇦 Bosanski"}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { src: publicUrl("images/optimus-face.jpg"), alt: "Optimus" },
            { src: publicUrl("images/Grimlock.webp"), alt: "Grimlock" },
            { src: publicUrl("images/trex.jpg"), alt: "T-Rex" },
            { src: publicUrl("images/optimus-pose.jpg"), alt: "Optimus" },
          ].map((it, i) => (
            <img
              key={i}
              src={it.src}
              alt={it.alt}
              style={{
                width: 62,
                height: 62,
                borderRadius: 18,
                objectFit: "cover",
                border: "3px solid #2a3a4a",
                animation: `float ${2.2 + i * 0.35}s ease-in-out infinite`,
                filter: "drop-shadow(0 0 10px rgba(0,0,0,0.45))",
              }}
              draggable={false}
            />
          ))}
        </div>

        <h1
          style={{
            fontSize: "clamp(1.7rem,6vw,3rem)",
            background: "linear-gradient(135deg,#ff6b35,#ffe66d,#4ecdc4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.1,
            marginBottom: 6,
          }}
        >
          {t.appTitle}
        </h1>

        <p style={{ color: "#7a8fa6", fontSize: "0.9rem" }}>{t.appSubtitle}</p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            marginTop: 14,
            padding: "9px 22px",
            background: "var(--card)",
            borderRadius: 50,
            border: `2px solid ${upgrade.color}`,
            boxShadow: `0 0 18px ${upgrade.color}44`,
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>
            ⭐ {total} / {max}
          </span>
          <span style={{ color: upgrade.color, fontFamily: "Fredoka One,cursive", fontSize: "0.9rem" }}>{upgrade.label}</span>
        </div>
      </div>

      {/* Mission grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
          gap: 14,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {MISSIONS.map((m) => {
          const stars = missionStars[m.id] ?? 0;
          const done = stars > 0;
          const mt = t.missions[m.id as keyof typeof t.missions];

          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              style={{
                background: done ? `linear-gradient(135deg,${m.color}22,${m.color}0d)` : "var(--card)",
                border: `3px solid ${done ? m.color : "#1e2d3d"}`,
                borderRadius: 18,
                padding: "20px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.22s",
                boxShadow: done ? `0 4px 20px ${m.color}44` : "var(--shadow)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              <div style={{ position: "absolute", top: -16, right: -16, width: 70, height: 70, borderRadius: "50%", background: m.color + "1a", filter: "blur(18px)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background: m.color + "22",
                    border: `3px solid ${m.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {m.image ? (
                    <img src={m.image} alt={m.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
                  ) : (
                    <span>{m.icon}</span>
                  )}
                </div>

                <div>
                  <div style={{ fontFamily: "Fredoka One,cursive", fontSize: "1.05rem", color: m.color, marginBottom: 2 }}>{mt?.title}</div>
                  <div style={{ color: "#7a8fa6", fontSize: "0.8rem" }}>{mt?.desc}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <StarRating stars={stars} />
                <span style={{ fontSize: "0.82rem", color: done ? "#22c55e" : "#7a8fa6", fontWeight: 800 }}>{done ? t.done : t.play}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: 36, color: "#2a3a4a", fontSize: "0.8rem" }}>
        <p>{t.dinoFact}</p>
      </div>
    </div>
  );
};

export default HomeScreen;
