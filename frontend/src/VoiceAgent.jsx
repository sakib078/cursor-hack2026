import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Conversation } from "@11labs/client";
import SoulWaves from "./components/SoulWaves.jsx";
import VoiceOrb from "./components/VoiceOrb.jsx";
import { getSession } from "./api.js";

const API = import.meta.env.VITE_API_BASE || "";

// phase: "idle" | "connecting" | "listening" | "speaking"

export default function VoiceAgent() {
  const { sessionId } = useParams();

  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [caption, setCaption] = useState(null);
  const [mode, setMode] = useState("presence");
  const [error, setError] = useState(null);

  const convRef = useRef(null);

  useEffect(() => {
    getSession(sessionId)
      .then(setInfo)
      .catch((e) => setLoadError(e.message));
  }, [sessionId]);

  // ── start ElevenLabs conversation ────────────────────────────────────────
  const startConversation = useCallback(async () => {
    if (convRef.current) return;
    setError(null);
    setPhase("connecting");

    try {
      // 1. Get a signed WebSocket URL from our backend
      const res = await fetch(`${API}/api/voice-token/${sessionId}`);
      if (!res.ok) throw new Error((await res.json()).detail || res.statusText);
      const { signed_url } = await res.json();

      // 2. Open the ElevenLabs conversation
      const conv = await Conversation.startSession({
        signedUrl: signed_url,

        onConnect: () => setPhase("listening"),

        onDisconnect: () => {
          convRef.current = null;
          setPhase("idle");
          setCaption(null);
        },

        // Fires when ElevenLabs switches between listening and speaking
        onModeChange: ({ mode: convMode }) => {
          setPhase(convMode === "speaking" ? "speaking" : "listening");
        },

        // Transcripts / AI replies come through here
        onMessage: ({ message, source }) => {
          if (source === "ai") setCaption(message);
        },

        onError: (err) => {
          setError(typeof err === "string" ? err : err?.message || "Voice error");
          convRef.current = null;
          setPhase("idle");
        },
      });

      convRef.current = conv;
    } catch (e) {
      setError(e.message);
      setPhase("idle");
    }
  }, [sessionId]);

  // ── end conversation ─────────────────────────────────────────────────────
  const endConversation = useCallback(async () => {
    if (!convRef.current) return;
    await convRef.current.endSession();
    convRef.current = null;
    setPhase("idle");
    setCaption(null);
  }, []);

  // ── orb tap ──────────────────────────────────────────────────────────────
  const handleTap = () => {
    if (phase === "idle") startConversation();
    else endConversation();
  };

  // ── render ───────────────────────────────────────────────────────────────
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
  const active = phase !== "idle";

  const hint = {
    idle: `Tap to speak with ${name}`,
    connecting: "Connecting…",
    listening: "Listening…",
    speaking: `${name} is speaking…`,
  }[phase];

  return (
    <>
      <SoulWaves />

      <div className="stage" style={{ gap: 28 }}>
        {/* Name */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(22px, 4vw, 32px)",
            color: "var(--ink)",
            margin: 0,
            fontWeight: 400,
          }}>
            {name}
          </h2>
          {info.relationship && (
            <p className="subtle" style={{ margin: "4px 0 0" }}>
              {info.relationship}
            </p>
          )}
        </div>

        {/* Orb — tap to start/stop */}
        <button
          onClick={handleTap}
          disabled={phase === "connecting"}
          style={{
            background: "none",
            border: "none",
            cursor: phase === "connecting" ? "wait" : "pointer",
            padding: 0,
          }}
          aria-label={hint}
        >
          <VoiceOrb speaking={phase === "speaking"} label={hint} />
        </button>

        {/* Live caption */}
        {caption && active && (
          <div className="glass" style={{
            padding: "14px 20px",
            maxWidth: "min(420px, 88vw)",
            borderRadius: 18,
            fontSize: 15,
            color: "var(--ink)",
            textAlign: "center",
            lineHeight: 1.6,
          }}>
            {caption}
          </div>
        )}

        {/* End call button when active */}
        {active && (
          <button
            onClick={endConversation}
            style={{
              background: "rgba(194,106,69,0.15)",
              border: "1px solid rgba(194,106,69,0.4)",
              color: "var(--peach-deeper)",
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 14,
              cursor: "pointer",
              backdropFilter: "blur(10px)",
            }}
          >
            End conversation
          </button>
        )}

        {/* Coping mode toggle */}
        <button
          className={`support-toggle${mode === "support" ? " on" : ""}`}
          onClick={() => setMode((m) => (m === "support" ? "presence" : "support"))}
        >
          <span className="dot" />
          {mode === "support" ? `Back to ${name}` : "I need support"}
        </button>

        {error && (
          <p style={{ color: "var(--peach-deeper)", fontSize: 13, textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>
    </>
  );
}
