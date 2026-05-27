// All requests go through Vite's /api proxy to the FastAPI backend.
const BASE = import.meta.env.VITE_API_BASE || "";

async function jsonOrThrow(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail || detail;
    } catch {
      /* keep statusText */
    }
    throw new Error(detail);
  }
  return res.json();
}

export function getSession(sessionId) {
  return fetch(`${BASE}/api/session/${sessionId}`).then(jsonOrThrow);
}

export function sendMessage(sessionId, message, mode) {
  return fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message, mode }),
  }).then(jsonOrThrow);
}

export function getVoiceToken(sessionId) {
  return fetch(`${BASE}/api/voice-token/${sessionId}`).then(jsonOrThrow);
}

// Dev-only: create a test session (requires AFTERWORDS_DEV_SEED=1 on backend).
export function seedDevSession() {
  return fetch(`${BASE}/api/_dev/seed`, { method: "POST" }).then(jsonOrThrow);
}
