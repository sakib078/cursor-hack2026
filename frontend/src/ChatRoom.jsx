import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SoulWaves from "./components/SoulWaves.jsx";
import VoiceOrb from "./components/VoiceOrb.jsx";
import { getSession, sendMessage } from "./api.js";

export default function ChatRoom() {
  const { sessionId } = useParams();

  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("presence"); // "presence" | "support"
  const [sending, setSending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);

  const audioRef = useRef(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  // ---- Step 1-2 handoff: load the session teammates created --------------
  useEffect(() => {
    let live = true;
    getSession(sessionId)
      .then((data) => {
        if (!live) return;
        setInfo(data);
        setMessages(data.history || []);
      })
      .catch((e) => live && setLoadError(e.message));
    return () => {
      live = false;
    };
  }, [sessionId]);

  // auto-scroll to the newest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // ---- their voice -------------------------------------------------------
  const playVoice = (base64) => {
    if (!base64) return;
    audioRef.current?.pause();
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audioRef.current = audio;
    setSpeaking(true);
    audio.onended = () => setSpeaking(false);
    audio.onerror = () => setSpeaking(false);
    audio.play().catch(() => setSpeaking(false)); // autoplay may be blocked
  };

  // ---- send --------------------------------------------------------------
  const handleSend = async (text) => {
    const body = (text ?? input).trim();
    if (!body || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: body }]);
    setSending(true);
    try {
      const res = await sendMessage(sessionId, body, mode);
      setMessages((m) => [...m, { role: "assistant", content: res.text }]);
      playVoice(res.audio);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `…(${e.message})`, system: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  // ---- voice input: "or speaks" (Web Speech API) -------------------------
  const SpeechRec =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggleListening = () => {
    if (!SpeechRec) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (ev) => setInput(ev.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  // ---- render states -----------------------------------------------------
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
          <VoiceOrb speaking={false} />
          <p className="center-note">Bringing them back…</p>
        </div>
      </>
    );
  }

  const name = info.name || "Them";
  const orbLabel =
    mode === "support"
      ? "Here with you"
      : speaking
        ? `${name} is speaking…`
        : `${name} is here`;

  return (
    <>
      <SoulWaves />
      <div className="stage">
        <VoiceOrb speaking={speaking} label={orbLabel} />

        <div className="glow-wrap">
          <div className="glass chat-card">
            <div className="chat-header">
              {info.photo_url ? (
                <img className="avatar" src={info.photo_url} alt={name} />
              ) : (
                <div className="avatar">{name[0]?.toUpperCase()}</div>
              )}
              <div className="who">
                <span className="name">{name}</span>
                {info.relationship && <span className="rel">{info.relationship}</span>}
              </div>
              <span className="mode-pill">
                {mode === "support" ? "support" : "presence"}
              </span>
            </div>

            <div className="messages" ref={scrollRef}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`bubble ${m.role === "user" ? "me" : "them"}`}
                  style={m.system ? { opacity: 0.6, fontStyle: "italic" } : undefined}
                >
                  {m.content}
                </div>
              ))}
              {sending && (
                <div className="bubble them typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            <div className="composer">
              {SpeechRec && (
                <button
                  className={`icon-btn${listening ? " listening" : ""}`}
                  onClick={toggleListening}
                  title={listening ? "Listening…" : "Speak"}
                  aria-label="Speak"
                >
                  <MicIcon />
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={mode === "support" ? "Say what you feel…" : `Message ${name}…`}
              />
              <button
                className="icon-btn send"
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
                aria-label="Send"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Step 4 — Coping Mode toggle */}
        <button
          className={`support-toggle${mode === "support" ? " on" : ""}`}
          onClick={() => setMode((m) => (m === "support" ? "presence" : "support"))}
        >
          <span className="dot" />
          {mode === "support" ? `Back to ${name}` : "I need support"}
        </button>
      </div>
    </>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 12l16-7-7 16-2-7-7-2z" fill="currentColor" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M6 11a6 6 0 0 0 12 0M12 17v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
