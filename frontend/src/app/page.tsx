"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");

  const handleQuickStart = () => {
    const sessionId = "demo-" + Date.now();
    if (name.trim()) {
      localStorage.setItem(`session_${sessionId}_name`, name.trim());
    }
    router.push(`/chat/${sessionId}`);
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-stone-100 mb-2">Afterwords</h1>
          <p className="text-stone-400 text-sm">Keep the conversation alive.</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Their name..."
            className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            onClick={handleQuickStart}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Start Conversation
          </button>
        </div>

        <p className="text-xs text-stone-600">
          Person 1 will build the full upload landing page here.
        </p>
      </div>
    </div>
  );
}
