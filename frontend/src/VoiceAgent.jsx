import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Conversation } from "@11labs/client";
import SoulWaves from "./components/SoulWaves.jsx";
import VoiceOrb from "./components/VoiceOrb.jsx";
import { getSession, getVoiceToken } from "./api.js";

export default function VoiceAgent() {
  const { sessionId } = useParams();
  const [info, setInfo] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | connecting | listening | speaking
  const [caption, setCaption] = useState(null);
  const [error, setError] = useState(null);

  const convRef = useRef(null);
  const phaseRef = useRef("idle");

  const go = (p) => { phaseRef.current = p; setPhase(p); };

  useEffect(() => {
    getSession(sessionId).then(setInfo).catch((e) => setError(e.message));
  }, [sessionId]);

  const startConversation = async () => {
    go("connecting");
    setError(null);
    try {
      const { signed_url } = await getVoiceToken(sessionId);
      const conv = await Conversation.startSession({
        signedUrl: signed_url,
        onConnect: () => go("listening"),
        onDisconnect: () => {
          convRef.current = null;
          go("idle");
          setCaption(null);
        },
        onModeChange: ({ mode: convMode }) => {
          go(convMode === "speaking" ? "speaking" : "listening");
        },
        onMessage: ({ message, source }) => {
          if (source === "ai") setCaption(message);
        },
        onError: (err) => {
          setError(typeof err === "string" ? err : (err?.message || "Connection error"));
          convRef.current = null;
          go("idle");
        },
      });
      convRef.current = conv;
    } catch (e) {
      setError(e.message || "Failed to start conversation");
      go("idle");
    }
  };

  const stopConversation = async () => {
    if (convRef.current) {
      try { await convRef.current.endSession(); } catch { /* ignore */ }
      convRef.current = null;
    }
    go("idle");
    setCaption(null);
  };

  const handleTap = () => {
    if (phaseRef.current === "connecting") return;
    if (phaseRef.current === "idle") {
      startConversation();
    } else {
      stopConversation();
    }
  };

  if (!info) return (
    <>
      <SoulWaves />
      <div className="stage">
        <VoiceOrb speaking={false} label={error || "Loading…"} />
      </div>
    </>
  );

  const name = info.name;
  const hint = {
    idle: `Tap to speak to ${name}`,
    connecting: "Connecting…",
    listening: "Listening…",
    speaking: `${name} is speaking…`,
  }[phase] ?? `Tap to speak to ${name}`;

  return (
    <>
      <SoulWaves />
      <div className="stage" style={{ gap: 28 }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(22px,4vw,32px)", color: "var(--ink)", margin: 0, fontWeight: 400 }}>
            {name}
          </h2>
          {info.relationship && (
            <p className="subtle" style={{ margin: "4px 0 0" }}>{info.relationship}</p>
          )}
        </div>

        <button
          onClick={handleTap}
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

        {caption && (
          <div className="glass" style={{ padding: "14px 20px", maxWidth: "min(420px,88vw)", borderRadius: 18, fontSize: 15, color: "var(--ink)", textAlign: "center", lineHeight: 1.6 }}>
            {caption}
          </div>
        )}

        {error && (
          <p style={{ color: "var(--peach-deeper)", fontSize: 13, textAlign: "center", maxWidth: "min(380px,88vw)" }}>
            {error}
          </p>
        )}
      </div>
    </>
  );
}
