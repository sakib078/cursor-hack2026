from __future__ import annotations

import os
import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from parser import parse_telegram_chat, parse_whatsapp_chat
from persona import build_persona
from personas import presence_system_prompt
from session_store import Session, new_session_id, sessions

router = APIRouter(prefix="/api", tags=["upload"])

VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
ELEVEN_BASE = "https://api.elevenlabs.io/v1"


async def _create_convai_agent(name: str, persona_prompt: str, voice_id: str) -> str | None:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        return None
    # ElevenLabs ConvAI prompt limit is ~8000 chars
    prompt = persona_prompt[:8000]
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{ELEVEN_BASE}/convai/agents/create",
                headers={"xi-api-key": api_key, "Content-Type": "application/json"},
                json={
                    "name": name,
                    "conversation_config": {
                        "agent": {
                            "prompt": {
                                "prompt": prompt,
                                "llm": "claude-3-5-sonnet",
                                "temperature": 0.7,
                            },
                            "first_message": f"Hey... it's me. I'm so glad you reached out.",
                            "language": "en",
                        },
                        "tts": {
                            "voice_id": voice_id,
                        },
                    },
                },
            )
            if resp.status_code == 200:
                return resp.json().get("agent_id")
    except Exception:
        pass
    return None


@router.post("/create")
async def create_session(
    name: str = Form(...),
    relationship: str = Form("person"),
    chat_file: UploadFile = File(...),
):
    chat_bytes = await chat_file.read()
    chat_text = chat_bytes.decode("utf-8", errors="ignore")
    filename = chat_file.filename or ""
    messages = (parse_telegram_chat(chat_text, name) if filename.endswith(".json")
                else parse_whatsapp_chat(chat_text, name))
    if not messages:
        raise HTTPException(422, "Couldn't read any messages. Use WhatsApp .txt or Telegram .json.")

    persona_prompt = build_persona(name, relationship, messages)
    agent_id = await _create_convai_agent(name, persona_prompt, VOICE_ID)

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
async def get_voice_token(session_id: str):
    session = sessions.get(session_id)
    if session is None:
        raise HTTPException(404, "Session not found.")
    if not session.agent_id:
        raise HTTPException(503, "No ConvAI agent for this session. Was ELEVENLABS_API_KEY set?")

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(503, "ELEVENLABS_API_KEY not configured.")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{ELEVEN_BASE}/convai/conversation/get_signed_url",
                headers={"xi-api-key": api_key},
                params={"agent_id": session.agent_id},
            )
            if resp.status_code != 200:
                raise HTTPException(502, f"ElevenLabs error: {resp.text[:200]}")
            return {"signed_url": resp.json()["signed_url"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Couldn't get signed URL: {e}") from e
