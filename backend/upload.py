"""
Steps 1 & 2 — Upload, parsing, voice cloning, persona building.

    POST /api/create   multipart: name, relationship, chat_file, audio_file?
                       -> { session_id, name }

After this endpoint returns, the frontend navigates to /chat/<session_id>.
The chat (Steps 3-4) reads the session from session_store.sessions.
"""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from elevenlabs_client import clone_voice
from parser import parse_telegram_chat, parse_whatsapp_chat
from persona import build_persona
from session_store import Session, new_session_id, sessions

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/create")
async def create_session(
    name: str = Form(...),
    relationship: str = Form("person"),
    chat_file: UploadFile = File(...),
    audio_file: UploadFile = File(None),
):
    # ------------------------------------------------------------------ #
    # 1. Parse the uploaded chat file
    # ------------------------------------------------------------------ #
    chat_bytes = await chat_file.read()
    chat_text = chat_bytes.decode("utf-8", errors="ignore")

    filename = chat_file.filename or ""
    if filename.endswith(".json"):
        messages = parse_telegram_chat(chat_text, name)
    else:
        # WhatsApp .txt is the default / most common
        messages = parse_whatsapp_chat(chat_text, name)

    if not messages:
        raise HTTPException(
            status_code=422,
            detail=(
                "Couldn't read any messages from that file. "
                "Make sure it's a WhatsApp .txt export or a Telegram .json export."
            ),
        )

    # ------------------------------------------------------------------ #
    # 2. Build the persona prompt from their real messages
    # ------------------------------------------------------------------ #
    persona_prompt = build_persona(name, relationship, messages)

    # ------------------------------------------------------------------ #
    # 2b. Clone their voice (non-blocking — chat still works without it)
    # ------------------------------------------------------------------ #
    voice_id: str | None = None
    if audio_file:
        audio_bytes = await audio_file.read()
        if audio_bytes:
            try:
                voice_id = await clone_voice(
                    name, audio_bytes, audio_file.filename or "voice.mp3"
                )
            except Exception:
                # Voice cloning failing must never break the session creation.
                voice_id = None

    # ------------------------------------------------------------------ #
    # 3. Register session — Steps 3-4 read this dict, do NOT touch it
    # ------------------------------------------------------------------ #
    sid = new_session_id()
    sessions[sid] = Session(
        name=name,
        relationship=relationship,
        voice_id=voice_id,
        persona_prompt=persona_prompt,
    )

    return {"session_id": sid, "name": name}
