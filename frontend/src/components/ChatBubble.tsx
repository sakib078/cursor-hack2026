"use client";

interface ChatBubbleProps {
  message: string;
  sender: "them" | "user";
  name?: string;
  timestamp?: string;
}

export default function ChatBubble({ message, sender, name, timestamp }: ChatBubbleProps) {
  const isTheirs = sender === "them";

  return (
    <div className={`flex ${isTheirs ? "justify-start" : "justify-end"} animate-fade-in`}>
      <div className={`max-w-[75%] flex flex-col ${isTheirs ? "items-start" : "items-end"}`}>
        {isTheirs && name && (
          <span className="text-xs text-stone-500 mb-1 ml-3">{name}</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isTheirs
              ? "bg-stone-800 text-stone-100 rounded-bl-md"
              : "bg-indigo-600 text-white rounded-br-md"
          }`}
        >
          {message}
        </div>
        {timestamp && (
          <span className="text-[10px] text-stone-600 mt-1 mx-3">{timestamp}</span>
        )}
      </div>
    </div>
  );
}
