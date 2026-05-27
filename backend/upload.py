"""
Steps 1 & 2 — Upload, parsing, persona building, ElevenLabs agent creation.

    POST /api/create        multipart: name, relationship, chat_file
                            -> { session_id, name }

    GET  /api/voice-token/:session_id
                            -> { signed_url }   (ElevenLabs ConvAI WebSocket URL)
"""

from __future__ import annotations

import os

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from parser import parse_telegram_chat, parse_whatsapp_chat
from persona import build_persona
from session_store import Session, new_session_id, sessions

router = APIRouter(prefix="/api", tags=["upload"])

ELEVEN_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVEN_BASE = "https://api.elevenlabs.io/v1"

# Voice used for the persona — Rachel (warm, clear)
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")


def _create_elevenlabs_agent(name: str, persona_prompt: str) -> str:
    """Create a ConvAI agent with the persona system prompt. Returns agent_id."""
    if not ELEVEN_KEY:
        raise HTTPException(503, "ELEVENLABS_API_KEY is not set.")

    resp = httpx.post(
        f"{ELEVEN_BASE}/convai/agents/create",
        headers={"xi-api-key": ELEVEN_KEY},
        json={
            "name": f"Afterwords — {name}",
            "conversation_config": {
                "agent": {
                    "prompt": {
                        "prompt": persona_prompt,
                        "llm": "gemini-2.0-flash",
                        "temperature": 0.8,
                    },
                    "first_message": f"Hey… it's me, {name}. I'm here.",
                    "language": "en",
                },
                "tts": {
                    "model_id": "eleven_turbo_v2",
                    "voice_id": VOICE_ID,
                },
            },
        },
        timeout=20,
    )
    if resp.status_code != 200:
        raise HTTPException(502, f"ElevenLabs agent creation failed: {resp.text}")
    return resp.json()["agent_id"]


@router.post("/create")
async def create_session(
    name: str = Form(...),
    relationship: str = Form("person"),
    chat_file: UploadFile = File(...),
):
    chat_bytes = await chat_file.read()
    chat_text = chat_bytes.decode("utf-8", errors="ignore")

    filename = chat_file.filename or ""
    messages = (
        parse_telegram_chat(chat_text, name)
        if filename.endswith(".json")
        else parse_whatsapp_chat(chat_text, name)
    )

    if not messages:
        raise HTTPException(
            422,
            "Couldn't read any messages from that file. "
            "Make sure it's a WhatsApp .txt export or a Telegram .json export.",
        )

    persona_prompt = build_persona(name, relationship, messages)
    agent_id = _create_elevenlabs_agent(name, persona_prompt)

    sid = new_session_id()
    sessions[sid] = Session(
        name=name,
        relationship=relationship,
        voice_id=VOICE_ID,
        persona_prompt=persona_prompt,
        agent_id=agent_id,
    )

    return {"session_id": sid, "name": name}


@router.get("/voice-token/{session_id}")
def get_voice_token(session_id: str):
    """Return a signed ElevenLabs ConvAI WebSocket URL for the frontend."""
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")
    if not session.agent_id:
        raise HTTPException(404, "No ConvAI agent for this session.")
    if not ELEVEN_KEY:
        raise HTTPException(503, "ELEVENLABS_API_KEY is not set.")

    resp = httpx.get(
        f"{ELEVEN_BASE}/convai/conversation/get_signed_url",
        headers={"xi-api-key": ELEVEN_KEY},
        params={"agent_id": session.agent_id},
        timeout=10,
    )
    if resp.status_code != 200:
        raise HTTPException(502, f"Could not get signed URL: {resp.text}")

    return {"signed_url": resp.json()["signed_url"]}
