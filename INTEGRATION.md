# Afterwords — Steps 3 & 4 (Conversation + Coping Mode)

This is the chat experience: the messenger-style room where the user talks to
the person they lost, hears their cloned voice, and can flip into a grief-support
("I need support") mode. Steps 1–2 (upload, chat parsing, voice cloning, persona
building) are owned by teammates and plug in at one seam.

## The integration seam — `backend/session_store.py`

There is exactly **one** thing Steps 1–2 must do after processing an upload:

```python
from session_store import sessions, Session, new_session_id

sid = new_session_id()
sessions[sid] = Session(
    name="Sarah",                      # who we're bringing back
    voice_id="<elevenlabs voice id>",  # from ElevenLabs /voices/add
    persona_prompt="<Claude system prompt built from their messages>",
    relationship="girlfriend",         # optional, shown in UI
    photo_url=None,                     # optional, shown in UI
)
# then redirect the browser to  /chat/<sid>
```

Then add your upload router in `backend/main.py` at the marked slot:

```python
from upload import router as upload_router
app.include_router(upload_router)
```

That's the whole contract. The chat reads the session, manages `history`,
synthesizes voice, and handles coping mode — you don't touch any of it.

## API (what the frontend calls)

| Method | Route | Purpose |
|--------|-------|---------|
| GET  | `/api/session/{id}` | Header info + prior history (never leaks the persona prompt) |
| POST | `/api/chat` | `{session_id, message, mode}` → `{text, audio (base64 mp3 \| null), mode}` |

`mode` is `"presence"` (reply as the person, Step 3) or `"support"`
(grief-support companion, Step 4). Voice is best-effort: if the ElevenLabs key
or `voice_id` is missing, `audio` is `null` and the chat still works in text.

## Run it

```bash
# backend
cd backend
cp .env.example .env          # add ANTHROPIC_API_KEY (+ ELEVENLABS_API_KEY for voice)
uv venv .venv && uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/uvicorn main:app --reload --port 8000

# frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173  (proxies /api → :8000)
```

Open `http://localhost:5173/chat/<session_id>`.

### Testing before Steps 1–2 land

Run the backend with `AFTERWORDS_DEV_SEED=1` to enable a dev-only
`POST /api/_dev/seed` that creates a demo "Sarah" session. The `/` landing page
has an **Enter a demo conversation** button that uses it. Set `DEV_VOICE_ID` to a
real ElevenLabs voice id to actually hear audio. **Delete this once the real
upload page exists** (it's clearly fenced in `main.py` and `Landing.jsx`).

## UI theme

Soft peach-white background, glassmorphism chat card with a breathing animated
gradient glow, dark-peach "soul waves" drifting in the background (canvas), and a
breathing voice-agent orb that quickens while their voice speaks. Voice input
("or speaks") uses the browser Web Speech API where available.
