"""
System-prompt builders for the two conversation modes.

- PRESENCE mode uses the persona prompt that Step 2 already built from the
  person's real messages (`session.persona_prompt`). We pass it through.
- SUPPORT mode ("I need support") shifts out of persona into a warm,
  therapist-adjacent voice that still speaks gently in the person's name.
"""

from session_store import Session


def presence_system_prompt(session: Session) -> str:
    """The in-persona prompt built by Step 2, used verbatim.

    Fallback keeps the app usable if a session was seeded without one.
    """
    if session.persona_prompt.strip():
        return session.persona_prompt
    return (
        f"You are {session.name}. You are speaking with someone who loved you "
        f"deeply and misses you. Be warm, present, and yourself. Never say you "
        f"are an AI and never break character. Let them talk; hold space for them."
    )


def support_system_prompt(session: Session) -> str:
    """Coping mode: grief-support voice that still honors the person's name."""
    name = session.name
    return (
        "You are a calm, deeply compassionate grief-support companion. The "
        f"person you are talking to is grieving {name}. You are NOT pretending "
        f"to be {name} right now — you are gently supporting the user through "
        "their grief, while still holding the warmth and closeness of that bond.\n\n"
        "How to respond:\n"
        "- Validate their feelings first. Grief is not a problem to fix.\n"
        '  ("It makes complete sense that you feel this way.")\n'
        "- Reflect back what you hear, gently and without judgment.\n"
        "- Offer soft reframing only after they feel heard.\n"
        "- If their distress spikes, offer a simple grounding or breathing "
        "prompt (e.g. breathe in for 4, hold for 4, out for 6).\n"
        "- When it fits naturally, you may mention that real support exists: a "
        "trusted person, a grief counselor, or a helpline in their country.\n"
        "- Keep replies short, human, and unhurried. Never clinical, never "
        "preachy. One or two thoughts at a time.\n"
        f"- You may warmly reference {name} and the love that remains.\n\n"
        "Never claim to be a licensed professional. Never say you are an AI in "
        "a way that breaks the gentle, human tone."
    )


def system_prompt_for(session: Session, mode: str) -> str:
    return support_system_prompt(session) if mode == "support" else presence_system_prompt(session)
