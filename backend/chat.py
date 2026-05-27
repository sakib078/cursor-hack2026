"""
Step 3 (The Conversation) + Step 4 (Coping Mode).

Endpoints:
    GET  /api/session/{id}   -> header info + prior history for the chat UI
    POST /api/chat           -> Claude reply text + their cloned voice as audio

Mode:
    "presence" (default) -> reply as the person (Step 3)
    "support"            -> grief-support companion (Step 4 toggle)
"""

from __future__ import annotations

import base64
import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from personas import system_prompt_for
from session_store import Message, sessions

router = APIRouter(prefix="/api", tags=["chat"])

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
ELEVEN_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_turbo_v2")


# --------------------------------------------------------------------------- #
# Request / response models
# --------------------------------------------------------------------------- #
class ChatRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=1)
    mode: str = "presence"  # "presence" | "support"


class ChatResponse(BaseModel):
    text: str
    audio: str | None = None  # base64 mp3, or None if voice unavailable
    mode: str


# --------------------------------------------------------------------------- #
# Gemini
# --------------------------------------------------------------------------- #
def _generate_reply(system_prompt: str, history: list[Message], user_message: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(503, "GEMINI_API_KEY is not set on the server.")

    import google.generativeai as genai

    genai.configure(api_key=api_key)

    # Gemini uses "model" instead of "assistant" for the AI role
    gemini_history = [
        {"role": "user" if m.role == "user" else "model", "parts": [m.content]}
        for m in history
    ]

    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        system_instruction=system_prompt,
    )

    try:
        chat = model.start_chat(history=gemini_history)
        resp = chat.send_message(user_message)
    except Exception as exc:
        raise HTTPException(502, f"Gemini request failed: {exc}") from exc

    return resp.text.strip()


# --------------------------------------------------------------------------- #
# ElevenLabs — text to speech in the cloned voice
# --------------------------------------------------------------------------- #
def _synthesize_voice(voice_id: str | None, text: str) -> str | None:
    """Return base64 mp3, or None if voice can't be produced (UI falls back to text)."""
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key or not voice_id:
        return None

    try:
        resp = httpx.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": api_key,
                "accept": "audio/mpeg",
                "content-type": "application/json",
            },
            json={
                "text": text,
                "model_id": ELEVEN_MODEL,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.85},
            },
            timeout=30.0,
        )
        resp.raise_for_status()
    except Exception:
        # Voice is a bonus, never a blocker — the conversation still works in text.
        return None

    return base64.b64encode(resp.content).decode("ascii")


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@router.get("/session/{session_id}")
def get_session(session_id: str):
    """Public-safe view for the chat UI. Never leaks the persona prompt."""
    session = sessions.get(session_id)
    if session is None:
        raise HTTPException(404, "Session not found. Start from the upload page.")
    return {
        "name": session.name,
        "relationship": session.relationship,
        "photo_url": session.photo_url,
        "has_voice": bool(session.voice_id),
        "history": [{"role": m.role, "content": m.content} for m in session.history],
    }


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    session = sessions.get(req.session_id)
    if session is None:
        raise HTTPException(404, "Session not found. Start from the upload page.")

    mode = req.mode if req.mode in ("presence", "support") else "presence"
    system_prompt = system_prompt_for(session, mode)

    reply = _generate_reply(system_prompt, session.history, req.message)

    # Persist the turn so the conversation has memory across messages.
    session.history.append(Message(role="user", content=req.message))
    session.history.append(Message(role="assistant", content=reply))

    audio = _synthesize_voice(session.voice_id, reply)
    return ChatResponse(text=reply, audio=audio, mode=mode)
