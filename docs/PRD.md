# Afterwords

Here's your 2-hour battle plan for **Afterwords**.

---

## Stack (everyone aligns on this first — 10 min)

- **Frontend:** Next.js (or plain React + Vite if faster)
- **Backend:** Python FastAPI
- **AI:** Claude API (`claude-sonnet-4-6`) for persona + chat
- **Audio:** OpenAI Whisper (local or API) for transcription
- **Storage:** Local filesystem / base64 for demo

---

## Task Division

### Dhruv + aditya— Landing Page + Upload UI
**Goal:** Beautiful home page where users upload their data

- Hero section: emotional copy ("Keep the conversation alive")
- Upload zone for chat exports (WhatsApp `.txt`, Telegram JSON, iMessage)
- Upload zone for audio/video files
- "Create Memorial" CTA button that sends data to backend
- Simple form: name of person, relationship (girlfriend, parent, friend, etc.)

**Output:** `/` route that POSTs `{name, relationship, chatFile, audioFile}` to `POST /api/create`

---

### Amaan — Chat Interface
**Goal:** The conversation screen where you "talk" to them

- Split screen or messenger-style UI
- Left: chat bubbles (their style, their name, maybe a placeholder avatar)
- Right: your messages
- Typing indicator animation
- Bottom: subtle "Coping Resources" button that opens a side drawer with grief tips
- Calls `POST /api/chat` with message + session ID, streams response

**Output:** `/chat/:id` route with full chat UI

---

### sakib— Backend API + Chat Parsing
**Goal:** Server that accepts uploads and drives conversations

- `POST /api/create` — receives files, returns session ID
- `POST /api/chat` — takes `{sessionId, message}`, returns AI reply (stream)
- Parse WhatsApp chat format (lines like `[date] Name: message`) into structured data
- Store session context in memory (dict keyed by session ID)
- Pull Claude API key from env

**Output:** FastAPI server running on `:8000`

---

### Nrup — AI Persona Builder (most critical role)
**Goal:** Make Claude sound like the specific person

- From parsed chat history, extract:
	- Common phrases, slang, emojis they used
	- Average message length
	- Topics they often discussed
	- Their emotional tone
- Build a system prompt like:
	```
	You are [Name]. You speak exactly like them. You use phrases like "...". 
	You are warm/sarcastic/funny [based on data]. The user loved you and lost you. 
	Be present, be them. Never break character. Also gently offer comfort.
	```
- If audio exists: run Whisper transcription, add speech patterns to prompt
- Inject last N messages of chat history as few-shot examples

**Output:** `build_persona(name, relationship, chat_history, transcript) -> system_prompt`

---

### Claude — Integration + Polish + Demo Prep
**Goal:** Glue everything together and make it demoable

- Set up repo, `.env` with API keys, shared README with run instructions
- Wire frontend to backend (fix CORS, base URLs)
- Handle loading states, error states
- Add one "coping mode" toggle that shifts Claude from persona mode to supportive therapist mode
- Record a 1-min demo script
- Deploy to Vercel (frontend) + Railway/Render (backend) OR just localhost if tight on time

---

## Timeline

| Time | Milestone |
|------|-----------|
| 0:00 | Repo created, API keys shared, everyone starts |
| 0:30 | Upload UI working, backend endpoints stubbed, persona builder drafted |
| 1:00 | End-to-end: upload a file → get a chat session → first AI reply |
| 1:30 | Chat UI polished, persona feels real, audio transcription working |
| 1:50 | Bug fixes, deploy or localhost demo locked |
| 2:00 | Demo ready |

---

## Key API Call (Person 3 + 4 share this)

```python
response = client.messages.create(
		model="claude-sonnet-4-6",
		max_tokens=300,
		system=persona_system_prompt,  # Person 4 builds this
		messages=conversation_history  # rolling window of last 20 msgs
)
```

---

## Biggest Risk

Person 4's persona quality makes or breaks the demo. Have them test with a sample WhatsApp export immediately and iterate on the system prompt first — the UI can be rough, but the AI needs to feel real.

Good luck — this is a genuinely moving idea.