"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { playSound } from "@/lib/sounds";
import { Loader2, MessageCircle, Send } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  senderName: string;
  senderRole?: string;
  text: string;
  createdAt: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, permissions, loading: authLoading, currentUser } = useStaff();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !permissions.canViewChat) { router.push("/login"); return; }
      loadMessages();
      const t = setInterval(loadMessages, 8000);
      return () => clearInterval(t);
    }
  }, [authLoading, isAuthenticated, permissions, router]);

  async function loadMessages() {
    const res = await fetch("/api/chat?isStaffView=1");
    const data = await res.json();
    if (Array.isArray(data)) {
      setMessages(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setLoading(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;
    setSending(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          text: text.trim(),
        }),
      });
      playSound("chat");
      setText("");
      await loadMessages();
    } finally {
      setSending(false);
    }
  }

  const ROLE_COLORS: Record<string, string> = {
    owner: "text-[#D4954E]",
    cashier: "text-blue-600",
    chef: "text-amber-600",
    accountant: "text-emerald-600",
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4954E]" size={40} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col h-screen bg-[#F8F4EC]" style={{ fontFamily: "var(--font-cairo), system-ui, sans-serif" }}>
      {/* Top Bar */}
      <div className="p-4 border-b border-[#E8DAC8] bg-[#FFFFFF] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] border border-[#E8DAC8] flex items-center justify-center text-[#D4954E]">
            <MessageCircle size={22} />
          </div>
          <div>
            <h1 className="font-black text-[#2B170E] text-lg">شات الفريق 💬</h1>
            <p className="text-xs text-[#7E5E49]">التواصل الداخلي بين طاقم عمل Waffle House 🧇🍰</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="px-3.5 py-1.5 rounded-xl bg-[#FAF6EE] border border-[#E8DAC8] text-[#7E5E49] hover:text-[#2B170E] text-xs font-bold transition-colors"
        >
          الداشبورد
        </Link>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderName === currentUser?.name;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-md rounded-2xl px-4 py-3 shadow-sm ${
                  isMe
                    ? "bg-gradient-to-r from-[#D4954E] to-[#C6873E] text-white"
                    : "bg-[#FFFFFF] border border-[#E8DAC8] text-[#2B170E]"
                }`}
              >
                {!isMe && (
                  <p className={`text-[11px] font-bold mb-1 ${ROLE_COLORS[msg.senderRole || ""] || "text-[#7E5E49]"}`}>
                    {msg.senderName}
                  </p>
                )}
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 ${isMe ? "text-white/80 text-left" : "text-[#7E5E49] text-left"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="p-4 border-t border-[#E8DAC8] bg-[#FFFFFF] flex gap-3 shadow-sm">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالة لزملائك في الفريق..."
          className="flex-1 h-12 rounded-xl bg-[#FAF6EE] border border-[#E8DAC8] focus:border-[#D4954E] px-4 text-[#2B170E] placeholder:text-[#A88B77] text-sm outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4954E] to-[#C6873E] text-white flex items-center justify-center hover:opacity-95 disabled:opacity-50 transition-opacity shadow-sm"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
