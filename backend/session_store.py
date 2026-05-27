"""
Shared in-memory session store — the integration seam between teammates.

    STEP 1-2 (teammates: upload, chat parsing, voice cloning, persona builder)
        CREATE sessions and populate every field below.

    STEP 3-4 (this app: conversation + coping mode)
        READ sessions and append to `history`.

------------------------------------------------------------------------------
CONTRACT
------------------------------------------------------------------------------
After a user uploads their data and the background processing finishes, Step 2
must do exactly this:

    from session_store import sessions, Session, new_session_id

    sid = new_session_id()
    sessions[sid] = Session(
        name="Sarah",                       # the person we are bringing back
        voice_id="<elevenlabs voice id>",   # from ElevenLabs /voices/add
        persona_prompt="<full Claude system prompt built from their messages>",
        relationship="girlfriend",          # optional, shown in the UI
        photo_url=None,                      # optional, shown in the UI
    )
    # then redirect the browser to  /chat/<sid>

That is the ONLY thing Step 3-4 needs from Step 1-2. Everything else
(`history`, audio synthesis, coping mode) is handled here.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Message:
    role: str  # "user" | "assistant"
    content: str


@dataclass
class Session:
    name: str
    voice_id: Optional[str] = None
    persona_prompt: str = ""
    relationship: Optional[str] = None
    photo_url: Optional[str] = None
    history: List[Message] = field(default_factory=list)


# The live store. Keyed by session_id. In-memory only (no DB) by design.
sessions: dict[str, Session] = {}


def new_session_id() -> str:
    return uuid.uuid4().hex[:12]
