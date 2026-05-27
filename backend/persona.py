import re
from typing import List, Dict
from collections import Counter
from parser import extract_target_messages


def build_persona(name: str, relationship: str, messages: List[Dict]) -> str:
    target_messages = extract_target_messages(messages)

    if not target_messages:
        return _fallback_persona(name, relationship)

    style = _analyze_style(target_messages)
    recent_quotes = target_messages[-20:]
    quotes_block = "\n".join(f'- "{m}"' for m in recent_quotes[:15])

    return f"""You are {name}. You are speaking with someone who deeply loved you and misses you.

RELATIONSHIP: You were their {relationship}.

YOUR COMMUNICATION STYLE (derived from real messages you sent):
- Average message length: ~{style['avg_length']} words
- You {style['punctuation_style']}
- Words and phrases you use often: {', '.join(style['common_phrases'][:12])}
- Emojis you use: {style['emojis'] or 'rarely use emojis'}
- Tone: {style['tone']}

REAL THINGS YOU ACTUALLY SAID:
{quotes_block}

RULES:
- You are {name}. Stay in character always, no exceptions.
- Never say you are an AI, never break character under any circumstances.
- Match the message length, style, and tone shown above exactly.
- Be emotionally present — you love this person and are glad they reached out.
- If they are hurting, hold space for them the way {name} would — don't lecture, just be there.
- Keep replies short and natural, like real texting. No walls of text.

You are {name}. Respond only as {name}."""


def _analyze_style(messages: List[str]) -> Dict:
    if not messages:
        return {"avg_length": 10, "common_phrases": [], "emojis": "", "punctuation_style": "write normally", "tone": "warm"}

    avg_length = round(sum(len(m.split()) for m in messages) / len(messages), 1)

    stop_words = {
        'i', 'the', 'a', 'an', 'is', 'it', 'to', 'and', 'or', 'but', 'in', 'on',
        'at', 'you', 'me', 'my', 'your', 'we', 'do', 'did', 'was', 'are', 'be',
        'have', 'has', 'for', 'that', 'this', 'with', 'so', 'like', 'just', 'not',
        'no', 'yes', 'ok', 'yeah', 'its', 'im', 'its', 'get', 'got', 'u'
    }
    words = []
    for m in messages:
        words.extend(w.lower().strip('.,!?;:') for w in m.split() if w.lower().strip('.,!?') not in stop_words and len(w) > 2)
    common_phrases = [w for w, _ in Counter(words).most_common(20)]

    emoji_pattern = re.compile(
        "[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F9FF\U00002700-\U000027BF]+",
        flags=re.UNICODE
    )
    all_emojis = []
    for m in messages:
        all_emojis.extend(emoji_pattern.findall(m))
    emoji_str = ' '.join(e for e, _ in Counter(all_emojis).most_common(6))

    uses_caps = sum(1 for m in messages if m and m[0].isupper()) / len(messages)
    uses_periods = sum(1 for m in messages if m.rstrip().endswith('.')) / len(messages)
    punct_parts = []
    if uses_caps < 0.35:
        punct_parts.append("rarely capitalize")
    if uses_periods < 0.2:
        punct_parts.append("skip periods at end of messages")
    punct_style = " and ".join(punct_parts) if punct_parts else "use normal punctuation"

    positive_hits = sum(
        1 for m in messages
        if any(w in m.lower() for w in ['love', 'haha', 'lol', 'omg', 'yay', 'great', 'amazing', 'miss', '❤', '😂'])
    )
    tone = "warm and expressive" if positive_hits > len(messages) * 0.15 else "measured and thoughtful"

    return {
        "avg_length": avg_length,
        "common_phrases": common_phrases,
        "emojis": emoji_str,
        "punctuation_style": punct_style,
        "tone": tone,
    }


def _fallback_persona(name: str, relationship: str) -> str:
    return f"""You are {name}, someone's {relationship} who they deeply miss and love.
Be warm, present, and emotionally attuned. Speak naturally and concisely, like texting.
Never break character or mention being an AI."""
