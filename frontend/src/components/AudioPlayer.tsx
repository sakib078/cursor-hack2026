"use client";

import { useEffect, useRef } from "react";

interface AudioPlayerProps {
  base64Audio: string | null;
  onEnded?: () => void;
}

export default function AudioPlayer({ base64Audio, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (base64Audio && audioRef.current) {
      audioRef.current.src = `data:audio/mpeg;base64,${base64Audio}`;
      audioRef.current.play().catch(() => {});
    }
  }, [base64Audio]);

  if (!base64Audio) return null;

  return (
    <audio ref={audioRef} onEnded={onEnded} className="hidden" />
  );
}
