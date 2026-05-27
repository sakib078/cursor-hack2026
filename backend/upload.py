"""
Steps 1 & 2 — Upload, parsing, persona building.

    POST /api/create   multipart: name, relationship, chat_file
                       -> { session_id, name }

Voice cloning removed — a default ElevenLabs voice is used for all replies.
"""

from __future__ import annotations

import os

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from parser import parse_telegram_chat, parse_whatsapp_chat
from persona import build_persona
from session_store import Session, new_session_id, sessions

router = APIRouter(prefix="/api", tags=["upload"])

# Built-in ElevenLabs voice used for all sessions (no cloning needed).
# Rachel — warm, clear, natural.
DEFAULT_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")


@router.post("/create")
async def create_session(
    name: str = Form(...),
    relationship: str = Form("person"),
    chat_file: UploadFile = File(...),
):
    chat_bytes = await chat_file.read()
    chat_text = chat_bytes.decode("utf-8", errors="ignore")

    filename = chat_file.filename or ""
    if filename.endswith(".json"):
        messages = parse_telegram_chat(chat_text, name)
    else:
        messages = parse_whatsapp_chat(chat_text, name)

    if not messages:
        raise HTTPException(
            status_code=422,
            detail=(
                "Couldn't read any messages from that file. "
                "Make sure it's a WhatsApp .txt export or a Telegram .json export."
            ),
        )

    persona_prompt = build_persona(name, relationship, messages)

    sid = new_session_id()
    sessions[sid] = Session(
        name=name,
        relationship=relationship,
        voice_id=DEFAULT_VOICE_ID,
        persona_prompt=persona_prompt,
    )

    return {"session_id": sid, "name": name}
