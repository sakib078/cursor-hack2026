import re
import json
from typing import List, Dict


# Matches any WhatsApp date/time header line.
# Handles:
#   - Date formats: YYYY-MM-DD, DD/MM/YY, DD.MM.YY, etc.
#   - Time formats: 12:04 p.m. / 9:41 PM / 09:41
#   - Narrow no-break space ( ) before am/pm (WhatsApp Android/iOS)
#   - iOS square-bracket wrapping: [date, time]
#   - Android dash separator: date, time -

_AMPM = r'(?:[\s ]?(?:[AaPp]\.?[Mm]\.?))?'
_TIME = rf'\d{{1,2}}:\d{{2}}(?::\d{{2}})?{_AMPM}'
_DATE = r'\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}'

_PATTERNS = [
    # Android: 2022-10-30, 12:04 p.m. - Name: msg
    rf'^{_DATE},?\s+{_TIME}\s+-\s+([^:\r\n]+?):\s+(.+)$',
    # iOS:     [2022-10-30, 12:04 PM] Name: msg
    rf'^\[{_DATE},?\s+{_TIME}\]\s+([^:\r\n]+?):\s+(.+)$',
]

_SKIP = {
    'Messages and calls are end-to-end encrypted',
    '<Media omitted>', 'image omitted', 'video omitted',
    'audio omitted', 'sticker omitted', 'GIF omitted',
    'This message was deleted', 'You deleted this message',
    'Missed voice call', 'Missed video call',
}


def parse_whatsapp_chat(text: str, target_name: str) -> List[Dict]:
    # Strip BOM that WhatsApp iOS adds
    text = text.lstrip('﻿')

    messages: List[Dict] = []
    current: Dict | None = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        matched = False
        for pattern in _PATTERNS:
            m = re.match(pattern, line, re.IGNORECASE)
            if m:
                sender = m.group(1).strip()
                content = m.group(2).strip()
                matched = True

                if any(skip in content for skip in _SKIP):
                    current = None
                    break

                current = {
                    "sender": sender,
                    "content": content,
                    "is_target": _name_matches(sender, target_name),
                }
                messages.append(current)
                break

        if not matched and current is not None:
            # Continuation of a multi-line message
            current["content"] += " " + line

    return messages


def parse_telegram_chat(json_text: str, target_name: str) -> List[Dict]:
    try:
        data = json.loads(json_text)
        messages = []
        for msg in data.get("messages", []):
            if msg.get("type") != "message":
                continue
            sender = msg.get("from", "")
            content = msg.get("text", "")
            if isinstance(content, list):
                content = " ".join(
                    c if isinstance(c, str) else c.get("text", "") for c in content
                )
            if not content.strip():
                continue
            messages.append({
                "sender": sender,
                "content": content.strip(),
                "is_target": _name_matches(sender, target_name),
            })
        return messages
    except Exception:
        return []


def _name_matches(sender: str, target: str) -> bool:
    return target.lower() in sender.lower() or sender.lower() in target.lower()


def extract_target_messages(messages: List[Dict]) -> List[str]:
    return [m["content"] for m in messages if m.get("is_target")]
