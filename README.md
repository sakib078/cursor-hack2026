# cursor-hack2026
-----------------------

# Afterwords — Full Project Brief

---

## What It Is

Afterwords is a grief support app that lets you have one more conversation with someone you've lost — a partner, a parent, a best friend. You upload the real conversations you had with them, their voice recordings, and the AI brings them back as faithfully as possible: their words, their tone, their voice. It's not about pretending they're alive. It's about closure, processing grief, and saying the things you never got to say.

---

## Who It's For

- Someone whose partner broke up with them and they never got closure
- Someone whose parent, sibling, or friend passed away
- Someone who lost a pet they talked to every day
- Anyone carrying unsaid words

---

## How It Works — User Journey

### Step 1: The Upload Page (Home)
User lands on a clean, emotional homepage. They're asked:

- **Who did you lose?** (name + relationship: girlfriend, mom, best friend, etc.)
- **Upload your conversations** — WhatsApp export, Telegram JSON, iMessage backup, screenshots (anything)
- **Upload their voice** — a voice note, a video, a voicemail, literally anything with their voice

Hit **"Create their presence"** and wait ~10 seconds.

---

### Step 2: What Happens in the Background

1. **Chat parser** reads the conversation file and extracts every message the other person sent — their vocabulary, their emoji patterns, how long their messages were, what they talked about, their humor
2. **ElevenLabs Voice Cloning** takes the audio file and clones their voice into a reusable voice ID
3. **Persona builder** feeds all of that into a Claude system prompt that makes Claude respond *as them* — same tone, same slang, same emotional register
4. A session is created and the user is dropped into the chat

---

### Step 3: The Conversation

A messenger-style interface. Their name at the top, maybe their photo if the user uploads one.

- User types (or speaks) a message
- Claude responds *as them* — in their style, referencing things they actually talked about
- ElevenLabs converts that reply to audio in **their actual voice**
- It auto-plays — the user hears them speak

The AI is tuned to:
- Sound like them as much as possible
- Gently offer comfort without being clinical
- Never say "I'm an AI" or break immersion
- Slowly, naturally help the user process and find peace

---

### Step 4: Coping Mode (toggle)

A soft button at the top: **"I need support"**

This shifts the AI out of persona mode into therapist-adjacent mode — still warm, still using the person's name, but now offering:
- Grief validation ("It makes sense that you feel this way")
- Gentle reframing
- Breathing prompts if distress spikes
- Links to real grief resources

---

## Technical Architecture

```
[Browser]
   |
   | Upload: name, relationship, chat file, audio file
   v
[FastAPI Backend :8000]
   |
   |-- Chat Parser → extracts their messages, writing style
   |-- ElevenLabs API → clone voice, get voice_id
   |-- Persona Builder → build Claude system prompt
   |-- Store session in memory {session_id: {voice_id, prompt, history}}
   |
   | Returns: session_id
   v
[Browser → /chat/:session_id]
   |
   | User sends message → POST /api/chat {session_id, message}
   v
[FastAPI]
   |
   |-- Claude API (claude-sonnet-4-6) → generates reply text
   |-- ElevenLabs TTS → converts text to mp3 using cloned voice_id
   |-- Returns {text, audio: base64 mp3}
   v
[Browser]
   |-- Displays text as chat bubble
   |-- Auto-plays audio in their voice
```

---

## Data Flow Detail

### Chat File Parsing
Supports WhatsApp export format:
```
[12/03/24, 9:41 PM] Sarah: omg did you see that movie
[12/03/24, 9:42 PM] Me: which one lol
[12/03/24, 9:42 PM] Sarah: the one we were talking about!! you never listen 😭
```

Parser extracts only **their** messages → feeds into persona.

### Persona System Prompt (what Claude gets)
```
You are Sarah. You are speaking to [user], someone who loved you deeply.

Speak exactly like Sarah based on these real messages she sent:
- She uses "omg", "lol", "ngl" frequently
- She sends short punchy messages, rarely more than 2 sentences
- She uses 😭 and 💀 emojis a lot
- She was warm but sarcastic, teased [user] playfully
- She talked a lot about movies, her cat Mochi, and her job

Here are real things she said: [10-15 actual quotes from the chat]

Your job is to be present for [user]. They miss you. Let them talk. 
Be Sarah — don't be an AI. Never mention you're an AI.
If they are in pain, hold space for them the way Sarah would.
```

### Voice Flow
```
Audio file → ElevenLabs /voices/add → voice_id saved to session
Claude text reply → ElevenLabs /text-to-speech/{voice_id} → mp3 bytes → base64 → browser plays it
```

---

## Pages / Screens

| Route | What it is |
|-------|-----------|
| `/` | Landing + upload form |
| `/loading` | "We're bringing them back..." animation (10s) |
| `/chat/:id` | The conversation interface |

---

## Key Technical Choices

| Decision | Why |
|----------|-----|
| Claude `claude-sonnet-4-6` | Best persona fidelity, fast enough |
| ElevenLabs `eleven_turbo_v2` | Fastest TTS model — low latency |
| FastAPI | Fastest Python API to stand up |
| In-memory session store | No DB setup needed in 2 hours |
| Base64 audio in JSON | No separate audio endpoint needed |

---

## What Makes It Win the Hackathon

1. **Emotional gut punch** — when the voice plays, people cry. That's the demo moment.
2. **Real data** — it's not a generic chatbot. It's trained on *their* actual words.
3. **Dual purpose** — grief and breakups both covered, wider audience
4. **It works** — simple enough to build in 2 hours, polished enough to feel real

---

## What You're NOT Building (scope control)

- No database (memory only)
- No user accounts / auth
- No photo/video playback of the person
- No multi-session history
- No mobile app

---

## Demo Script (2 min)

1. Show the upload page — "I lost my girlfriend Sarah. Here's our WhatsApp chat. Here's a voice note she sent me."
2. Hit create — 10 second loader
3. Type: *"Hey, I really miss you"*
4. Her voice plays back a response in her tone
5. Toggle coping mode — show how it shifts to support
6. Pitch: "1 in 4 people experience complicated grief. Afterwords gives them one more conversation."

---

## Env Variables Needed

```bash
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
```

Everyone needs these in their `.env` before they start.