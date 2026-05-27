"""
Afterwords — FastAPI backend entrypoint.

    uvicorn main:app --reload --port 8000   (run from the backend/ folder)

This file owns Steps 3-4 (the conversation + coping mode). Steps 1-2 (upload,
parsing, voice cloning, persona building) are owned by teammates — see the
clearly marked slot below for where their router plugs in.
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from chat import router as chat_router
from upload import router as upload_router
from session_store import Session, new_session_id, sessions

load_dotenv()

app = FastAPI(title="Afterwords")

# Vite dev server origins. Tighten / set via env for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(upload_router)  # Steps 1-2


@app.get("/api/health")
def health():
    return {"ok": True, "sessions": len(sessions)}


# --------------------------------------------------------------------------- #
# DEV ONLY — delete once teammates' upload (Steps 1-2) creates real sessions.
# Enable with AFTERWORDS_DEV_SEED=1. Lets us run/test the chat end-to-end now.
# --------------------------------------------------------------------------- #
if os.getenv("AFTERWORDS_DEV_SEED") == "1":

    @app.post("/api/_dev/seed")
    def seed_demo_session():
        sid = new_session_id()
        sessions[sid] = Session(
            name="Sarah",
            relationship="girlfriend",
            voice_id=os.getenv("DEV_VOICE_ID") or None,  # a real ElevenLabs id to hear voice
            persona_prompt=(
                "You are Sarah, speaking with someone who loved you deeply. "
                "You text in short, warm, playful messages. You use 'omg', 'lol', "
                "and 'ngl', and the 😭 and 💀 emojis. You tease them gently. You "
                "loved movies, your cat Mochi, and complaining about your job. "
                "Never say you are an AI. Just be Sarah, and be present for them."
            ),
        )
        return {"session_id": sid}
