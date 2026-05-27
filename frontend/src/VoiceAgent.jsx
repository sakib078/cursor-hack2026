import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SoulWaves from "./components/SoulWaves.jsx";
import VoiceOrb from "./components/VoiceOrb.jsx";
import { getSession, sendMessage } from "./api.js";

const SpeechRec =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

// phase: "idle" | "listening" | "thinking" | "speaking"

export default function VoiceAgent() {
  const { sessionId } = useParams();

  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [caption, setCaption] = useState(null);
  const [mode, setMode] = useState("presence");

  const audioRef = useRef(null);
  const recRef = useRef(null);
  const phaseRef = useRef("idle");

  const go = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  useEffect(() => {
    getSession(sessionId)
      .then(setInfo)
      .catch((e) => setLoadError(e.message));
  }, [sessionId]);

  // ── speech recognition ──────────────────────────────────────────────────
  const startListening = () => {
    if (!SpeechRec) {
      setCaption("Voice input needs Chrome.");
      return;
    }
    audioRef.current?.pause();

    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = false;
    let heard = false;

    rec.onstart = () => go("listening");

    rec.onresult = (e) => {
      heard = true;
      const text = e.results[0][0].transcript.trim();
      recRef.current = null;
      go("thinking");
      setCaption(null);
      askAI(text);
    };

    rec.onerror = () => {
      recRef.current = null;
      go("idle");
    };

    rec.onend = () => {
      if (!heard) {
        recRef.current = null;
        go("idle");
      }
    };

    recRef.current = rec;
    rec.start();
  };

  // ── send to backend ──────────────────────────────────────────────────────
  const askAI = async (text) => {
    try {
      const res = await sendMessage(sessionId, text, mode);
      if (res.audio) {
        speakReply(res.audio, res.text);
      } else {
        // ElevenLabs unavailable — show text, let user tap again
        setCaption(res.text);
        go("idle");
      }
    } catch {
      setCaption("Something went wrong. Tap to try again.");
      go("idle");
    }
  };

  // ── play ElevenLabs audio ────────────────────────────────────────────────
  const speakReply = (b64, text) => {
    const audio = new Audio(`data:audio/mpeg;base64,${b64}`);
    audioRef.current = audio;
    setCaption(text);
    go("speaking");

    audio.onended = () => {
      go("idle");
      // Continue the conversation automatically after 700 ms
      setTimeout(startListening, 700);
    };
    audio.onerror = () => go("idle");
    audio.play().catch(() => go("idle"));
  };

  // ── orb tap handler ──────────────────────────────────────────────────────
  const handleTap = () => {
    if (phaseRef.current === "thinking") return;

    if (phaseRef.current === "speaking") {
      audioRef.current?.pause();
      go("idle");
      return;
    }

    if (phaseRef.current === "listening") {
      recRef.current?.stop();
      return;
    }

    startListening();
  };

  // ── render states ────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <>
        <SoulWaves />
        <div className="stage">
          <p className="center-note error-text">{loadError}</p>
        </div>
      </>
    );
  }

  if (!info) {
    return (
      <>
        <SoulWaves />
        <div className="stage">
          <VoiceOrb speaking={false} label="Bringing them back…" />
        </div>
      </>
    );
  }

  const name = info.name;

  const hint =
    phase === "idle"
      ? `Tap to speak to ${name}`
      : phase === "listening"
      ? "Listening…"
      : phase === "thinking"
      ? `${name} is thinking…`
      : `${name} is speaking…`;

  return (
    <>
      <SoulWaves />

      <div className="stage" style={{ gap: 28 }}>
        {/* Name + relationship */}
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(22px, 4vw, 32px)",
              color: "var(--ink)",
              margin: 0,
              fontWeight: 400,
            }}
          >
            {name}
          </h2>
          {info.relationship && (
            <p className="subtle" style={{ margin: "4px 0 0" }}>
              {info.relationship}
            </p>
          )}
        </div>

        {/* Tap-to-talk orb */}
        <button
          onClick={handleTap}
          style={{
            background: "none",
            border: "none",
            cursor: phase === "thinking" ? "wait" : "pointer",
            padding: 0,
          }}
          aria-label={hint}
        >
          <VoiceOrb speaking={phase === "speaking"} label={hint} />
        </button>

        {/* Pulsing mic ring when listening */}
        {phase === "listening" && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--peach-deeper)",
              letterSpacing: "0.05em",
              animation: "breathe 1.5s ease-in-out infinite",
            }}
          >
            speak now
          </p>
        )}

        {/* Caption — last reply */}
        {caption && (
          <div
            className="glass"
            style={{
              padding: "14px 20px",
              maxWidth: "min(420px, 88vw)",
              borderRadius: 18,
              fontSize: 15,
              color: "var(--ink)",
              textAlign: "center",
              lineHeight: 1.6,
              opacity: phase === "thinking" ? 0.4 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            {caption}
          </div>
        )}

        {/* Coping mode toggle */}
        <button
          className={`support-toggle${mode === "support" ? " on" : ""}`}
          onClick={() =>
            setMode((m) => (m === "support" ? "presence" : "support"))
          }
        >
          <span className="dot" />
          {mode === "support" ? `Back to ${name}` : "I need support"}
        </button>
      </div>
    </>
  );
}
