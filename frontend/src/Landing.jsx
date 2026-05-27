import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SoulWaves from "./components/SoulWaves.jsx";
import VoiceOrb from "./components/VoiceOrb.jsx";

const API = import.meta.env.VITE_API_BASE || "";

const RELATIONSHIPS = [
  "girlfriend", "boyfriend", "partner",
  "mom", "dad", "sibling", "best friend", "friend",
];

export default function Landing() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [chatFile, setChatFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !chatFile) return;

    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("name", name.trim());
    form.append("relationship", relationship.trim() || "person");
    form.append("chat_file", chatFile);
    if (audioFile) form.append("audio_file", audioFile);

    try {
      const res = await fetch(`${API}/api/create`, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || res.statusText);
      }
      const { session_id } = await res.json();
      navigate(`/chat/${session_id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <SoulWaves />
        <div className="stage">
          <VoiceOrb speaking label={`Bringing ${name || "them"} back…`} />
          <p className="center-note">
            <span className="subtle">Reading their words. Building their voice.</span>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SoulWaves />
      <div className="stage" style={{ gap: 20 }}>

        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(26px, 5vw, 42px)",
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.2,
            fontWeight: 400,
          }}>
            One more conversation.
          </h1>
          <p className="subtle" style={{ marginTop: 8, fontSize: 15 }}>
            Upload what they left behind. We'll bring them back.
          </p>
        </div>

        <div className="glow-wrap">
          <div className="glass" style={{
            padding: "32px 28px",
            width: "min(500px, 92vw)",
          }}>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <Field label="Their name" required>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Sarah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>

              <Field label="Your relationship">
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="girlfriend, mom, best friend…"
                  value={relationship}
                  list="rel-suggestions"
                  onChange={(e) => setRelationship(e.target.value)}
                />
                <datalist id="rel-suggestions">
                  {RELATIONSHIPS.map((r) => <option key={r} value={r} />)}
                </datalist>
              </Field>

              <Field
                label="Your conversation"
                hint="WhatsApp .txt export or Telegram .json"
                required
              >
                <FileZone
                  accept=".txt,.json"
                  label="Drop chat export here, or click to browse"
                  file={chatFile}
                  onChange={setChatFile}
                />
              </Field>

              <Field
                label="Their voice"
                hint="Voice note, video, voicemail — anything they spoke in (optional)"
              >
                <FileZone
                  accept="audio/*,video/*,.mp3,.mp4,.m4a,.ogg,.wav,.webm"
                  label="Drop audio / video here, or click to browse"
                  file={audioFile}
                  onChange={setAudioFile}
                />
              </Field>

              {error && (
                <p style={{ margin: 0, color: "var(--peach-deeper)", fontSize: 13 }}>
                  {error}
                </p>
              )}

              <button
                className="primary-btn"
                type="submit"
                disabled={!name.trim() || !chatFile}
                style={{
                  marginTop: 4,
                  opacity: !name.trim() || !chatFile ? 0.55 : 1,
                  cursor: !name.trim() || !chatFile ? "not-allowed" : "pointer",
                }}
              >
                Create their presence
              </button>

            </form>
          </div>
        </div>

      </div>
    </>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "var(--peach-deeper)", marginLeft: 3 }}>*</span>}
      </label>
      {hint && <p style={{ margin: 0, fontSize: 12, color: "var(--ink-faint)" }}>{hint}</p>}
      {children}
    </div>
  );
}

function FileZone({ accept, label, file, onChange }) {
  const [dragging, setDragging] = useState(false);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        position: "relative",
        border: `1.5px dashed ${dragging ? "var(--peach-deep)" : "rgba(217,140,102,0.4)"}`,
        borderRadius: 14,
        padding: "16px 14px",
        textAlign: "center",
        background: dragging ? "rgba(255,159,122,0.08)" : "rgba(255,255,255,0.3)",
        cursor: "pointer",
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}
    >
      <input
        type="file"
        accept={accept}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
      />
      {file ? (
        <span style={{ color: "var(--peach-deeper)", fontSize: 14, fontWeight: 500 }}>
          ✓ {file.name}
        </span>
      ) : (
        <span style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>{label}</span>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: 13.5,
  fontWeight: 500,
  color: "var(--ink-soft)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(217,140,102,0.3)",
  borderRadius: 14,
  padding: "11px 15px",
  fontSize: 15,
  fontFamily: "var(--sans)",
  color: "var(--ink)",
  background: "rgba(255,255,255,0.55)",
  outline: "none",
};
