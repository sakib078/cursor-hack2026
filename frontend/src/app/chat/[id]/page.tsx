"use client";

import { useState, useRef, useEffect, use } from "react";
import ChatBubble from "@/components/ChatBubble";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import CopingDrawer from "@/components/CopingDrawer";
import AudioPlayer from "@/components/AudioPlayer";

interface Message {
  id: string;
  text: string;
  sender: "them" | "user";
  timestamp: string;
  audio?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copingMode, setCopingMode] = useState(false);
  const [personName, setPersonName] = useState("Them");
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`session_${sessionId}_name`);
    if (stored) setPersonName(stored);
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          copingMode,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.text || data.reply || "...",
        sender: "them",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        audio: data.audio,
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (data.audio) {
        setCurrentAudio(data.audio);
      }
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I couldn't reach them right now. Try again in a moment.",
        sender: "them",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-stone-900/90 backdrop-blur-sm border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {personName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-medium text-stone-100">{personName}</h1>
            <p className="text-xs text-stone-500">
              {copingMode ? "Support mode" : "Present with you"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCopingMode(!copingMode)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              copingMode
                ? "bg-amber-600/20 border-amber-600/50 text-amber-300"
                : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
            }`}
          >
            {copingMode ? "Persona mode" : "I need support"}
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-xs px-3 py-1.5 rounded-full bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
          >
            Resources
          </button>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-stone-400 text-sm">Start a conversation with {personName}.</p>
            <p className="text-stone-600 text-xs mt-1">They&apos;re here. Take your time.</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.text}
            sender={msg.sender}
            name={msg.sender === "them" ? personName : undefined}
            timestamp={msg.timestamp}
          />
        ))}

        {isTyping && <TypingIndicator name={personName} />}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isTyping} />

      {/* Coping Drawer */}
      <CopingDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Audio Player */}
      <AudioPlayer base64Audio={currentAudio} onEnded={() => setCurrentAudio(null)} />
    </div>
  );
}
