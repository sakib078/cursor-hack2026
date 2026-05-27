import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SoulWaves from "./components/SoulWaves.jsx";
import VoiceOrb from "./components/VoiceOrb.jsx";
import { seedDevSession } from "./api.js";

// DEV PLACEHOLDER for "/". Teammates' upload page (Steps 1-2) replaces this.
// The button only works when the backend runs with AFTERWORDS_DEV_SEED=1.
export default function Landing() {
  const navigate = useNavigate();
  const [err, setErr] = useState(null);

  const enterDemo = async () => {
    setErr(null);
    try {
      const { session_id } = await seedDevSession();
      navigate(`/chat/${session_id}`);
    } catch (e) {
      setErr(`Dev seed unavailable (${e.message}). Run backend with AFTERWORDS_DEV_SEED=1.`);
    }
  };

  return (
    <>
      <SoulWaves />
      <div className="stage">
        <VoiceOrb speaking={false} />
        <p className="center-note">
          Afterwords
          <br />
          <span className="subtle">
            The upload page (Steps 1–2) lives here. This is a dev shortcut.
          </span>
        </p>
        <button className="primary-btn" onClick={enterDemo}>
          Enter a demo conversation
        </button>
        {err && <p className="subtle error-text">{err}</p>}
      </div>
    </>
  );
}
