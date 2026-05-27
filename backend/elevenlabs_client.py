import httpx
import os
from typing import Optional

API_KEY = os.getenv("ELEVENLABS_API_KEY")
BASE_URL = "https://api.elevenlabs.io/v1"


async def clone_voice(name: str, audio_bytes: bytes, filename: str) -> Optional[str]:
    if not API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{BASE_URL}/voices/add",
                headers={"xi-api-key": API_KEY},
                data={"name": name},
                files={"files": (filename, audio_bytes, "audio/mpeg")},
            )
            if resp.status_code == 200:
                return resp.json().get("voice_id")
    except Exception:
        pass
    return None


async def text_to_speech(text: str, voice_id: str) -> Optional[bytes]:
    if not API_KEY or not voice_id:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{BASE_URL}/text-to-speech/{voice_id}",
                headers={"xi-api-key": API_KEY, "Content-Type": "application/json"},
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.8},
                },
            )
            if resp.status_code == 200:
                return resp.content
    except Exception:
        pass
    return None
