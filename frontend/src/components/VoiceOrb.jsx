// The voice agent: a softly breathing orb. It breathes calmly at rest and
// quickens while their voice is speaking.
export default function VoiceOrb({ speaking, label }) {
  return (
    <div className="orb-zone">
      <div className={`orb${speaking ? " speaking" : ""}`} aria-hidden="true" />
      {label && <div className="subtle">{label}</div>}
    </div>
  );
}
