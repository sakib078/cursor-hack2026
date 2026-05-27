"use client";

interface TypingIndicatorProps {
  name: string;
}

export default function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex flex-col items-start">
        <span className="text-xs text-stone-500 mb-1 ml-3">{name}</span>
        <div className="bg-stone-800 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 bg-stone-400 rounded-full inline-block" />
          <span className="typing-dot w-2 h-2 bg-stone-400 rounded-full inline-block" />
          <span className="typing-dot w-2 h-2 bg-stone-400 rounded-full inline-block" />
        </div>
      </div>
    </div>
  );
}
