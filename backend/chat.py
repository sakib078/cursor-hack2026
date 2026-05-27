from __future__ import annotations

from fastapi import APIRouter, HTTPException

from session_store import sessions

router = APIRouter(prefix="/api", tags=["chat"])


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
        "agent_id": session.agent_id,
        "history": [{"role": m.role, "content": m.content} for m in session.history],
    }
