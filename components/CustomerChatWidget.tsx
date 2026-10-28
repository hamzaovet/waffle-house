"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { playSound } from "@/lib/sounds";
import { MessageCircle, X, Send, User, Phone, CheckCheck, Sparkles, ChefHat } from "lucide-react";

interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  isStaff: boolean;
  customerPhone?: string | null;
  createdAt: string;
}

interface CustomerChatWidgetProps {
  lang?: "ar" | "en";
}

export default function CustomerChatWidget({ lang = "ar" }: CustomerChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [chatToken, setChatToken]         = useState("");
  const [sending, setSending]             = useState(false);
  const [hasNewReply, setHasNewReply]     = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize persistent device token for chat privacy
  useEffect(() => {
    try {
      let t = localStorage.getItem("choco_chat_token");
      if (!t) {
        t = "tok_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        localStorage.setItem("choco_chat_token", t);
      }
      setChatToken(t);
    } catch {}
  }, []);

  // Sync customer info from localStorage
  const syncCustomer = useCallback(() => {
    try {
      const raw = localStorage.getItem("choco_customer");
      if (raw) {
        const cust = JSON.parse(raw);
        if (cust.name) setCustomerName(cust.name);
        if (cust.phone) setCustomerPhone(cust.phone);
      }
    } catch {}
  }, []);

  useEffect(() => {
    syncCustomer();
    window.addEventListener("choco_customer_updated", syncCustomer);
    return () => window.removeEventListener("choco_customer_updated", syncCustomer);
  }, [syncCustomer]);

  const fetchMessages = useCallback(async () => {
    try {
      const activeToken = chatToken || (typeof window !== "undefined" ? localStorage.getItem("choco_chat_token") : null);
      if (!activeToken && !customerPhone) return;

      const params = new URLSearchParams();
      if (activeToken) params.set("token", activeToken);
      if (customerPhone) params.set("customerPhone", customerPhone.trim());

      const res = await fetch(`/api/chat?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
          // Alert if latest message is from staff and widget is closed
          if (data.length > 0 && data[data.length - 1].isStaff && !isOpen) {
            setHasNewReply(true);
          }
        }
      }
    } catch {}
  }, [customerPhone, chatToken, isOpen]);

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 4000);
    return () => clearInterval(iv);
  }, [fetchMessages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewReply(false);
    }
  }, [isOpen, messages]);

  async function handleSendMessage(customText?: string) {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const sender = customerName.trim() || (lang === "en" ? "Waffle House Guest" : "عميل Waffle House");
    const activeToken = chatToken || (typeof window !== "undefined" ? localStorage.getItem("choco_chat_token") : null);
    setSending(true);
    playSound("click");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: sender,
          senderRole: "customer",
          text: textToSend.trim(),
          isStaff: false,
          token: activeToken || null,
          customerPhone: customerPhone.trim() || null,
        }),
      });
      if (res.ok) {
        if (!customText) setInputText("");
        playSound("chat");
        fetchMessages();
      }
    } finally {
      setSending(false);
    }
  }

  const QUICK_QUESTIONS = [
    lang === "en" ? "Is delivery available now? 🛵" : "هل التوصيل متاح الآن؟ 🛵",
    lang === "en" ? "Inquiry about my order 📦" : "استفسار عن أوردر سابق 📦",
    lang === "en" ? "What are today's offers? 🍫" : "عروض اليوم والكومبو 🍫",
  ];

  return (
    <>
      {/* ── Floating Launcher Button ── */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          zIndex: 80,
        }}
      >
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            playSound("click");
          }}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, #D4954E, #C6873E)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "100px",
            padding: "11px 18px",
            fontWeight: 900,
            fontSize: "13.5px",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(198, 135, 62, 0.4)",
            transition: "all 0.2s ease",
            transform: isOpen ? "scale(0.95)" : "scale(1)",
          }}
        >
          {isOpen ? <X size={19} /> : <MessageCircle size={19} />}
          <span>{isOpen ? (lang === "en" ? "Close" : "إغلاق الشات") : (lang === "en" ? "Live Chat" : "شات المطعم 💬")}</span>

          {hasNewReply && !isOpen && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#ef4444",
                border: "2px solid #ffffff",
                animation: "pulse 1.5s infinite",
              }}
            />
          )}
        </button>
      </div>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "74px",
            left: "20px",
            width: "360px",
            maxWidth: "calc(100vw - 40px)",
            height: "460px",
            maxHeight: "calc(100vh - 140px)",
            background: "#FAF6EE",
            border: "1px solid #E8DAC8",
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            zIndex: 85,
            boxShadow: "0 16px 48px rgba(78, 44, 21, 0.25)",
            direction: lang === "ar" ? "rtl" : "ltr",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              background: "#FFFFFF",
              borderBottom: "1px solid #E8DAC8",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#FAF6EE",
                  border: "1.5px solid #E8DAC8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  color: "#C6873E",
                  fontSize: "13px",
                  fontFamily: "var(--font-playfair), Georgia, serif",
                }}
              >
                WK
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 800, color: "#2B170E" }}>
                  Waffle House Live Support
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#16a34a" }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#16a34a",
                      display: "inline-block",
                    }}
                  />
                  <span>{lang === "en" ? "Online now" : "متواجدون لخدمتك فوراً"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#7E5E49",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Identity bar if not filled */}
          {(!customerName || !customerPhone) && (
            <div
              style={{
                background: "#F5EDE1",
                padding: "8px 12px",
                borderBottom: "1px solid #E8DAC8",
                display: "flex",
                gap: "6px",
              }}
            >
              <input
                type="text"
                placeholder={lang === "en" ? "Your name" : "اسمك الكريم"}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  flex: 1,
                  height: "28px",
                  background: "#FFFFFF",
                  border: "1px solid #D9C5B2",
                  borderRadius: "6px",
                  padding: "0 8px",
                  fontSize: "11px",
                  color: "#2B170E",
                  outline: "none",
                }}
              />
              <input
                type="tel"
                placeholder={lang === "en" ? "Phone" : "الموبايل (010...)"}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  flex: 1,
                  height: "28px",
                  background: "#FFFFFF",
                  border: "1px solid #D9C5B2",
                  borderRadius: "6px",
                  padding: "0 8px",
                  fontSize: "11px",
                  color: "#2B170E",
                  outline: "none",
                }}
                dir="ltr"
              />
            </div>
          )}

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: "12px 14px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Greeting Message from Store */}
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "88%",
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                borderRadius: "14px",
                padding: "10px 12px",
                fontSize: "12.5px",
                color: "#2B170E",
                lineHeight: 1.4,
                boxShadow: "0 2px 8px rgba(78, 44, 21, 0.04)",
              }}
            >
              <div style={{ fontWeight: 800, color: "#C6873E", fontSize: "11px", marginBottom: "3px" }}>
                فريق Waffle House 🧇🍰
              </div>
              {lang === "en"
                ? "Hello! Welcome to Waffle House. We bake fresh to order — how can we help you today?"
                : "أهلاً بك في Waffle House! نخبز طازة لحظة طلبك، نقدر نساعد حضرتك بإيه النهاردة؟ 🧇🍰"}
            </div>

            {/* Conversation Messages */}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.isStaff ? "flex-start" : "flex-end",
                  maxWidth: "88%",
                  background: m.isStaff ? "linear-gradient(135deg, #FFFDF9, #F8EFE3)" : "#C6873E",
                  border: m.isStaff ? "1px solid #E8DAC8" : "none",
                  borderRadius: "14px",
                  padding: "10px 12px",
                  fontSize: "12.5px",
                  color: m.isStaff ? "#2B170E" : "#FFFFFF",
                  boxShadow: m.isStaff ? "0 2px 8px rgba(78, 44, 21, 0.05)" : "0 2px 8px rgba(198, 135, 62, 0.3)",
                }}
              >
                <div
                  style={{
                    fontSize: "10.5px",
                    color: m.isStaff ? "#C6873E" : "rgba(255,255,255,0.85)",
                    fontWeight: 800,
                    marginBottom: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {m.isStaff && <ChefHat size={12} />}
                  <span>{m.isStaff ? "خدمة العملاء (Waffle House)" : m.senderName}</span>
                </div>
                <div style={{ lineHeight: 1.45 }}>{m.text}</div>
                <div style={{ fontSize: "9.5px", color: m.isStaff ? "#967B66" : "rgba(255,255,255,0.75)", marginTop: "4px", textAlign: "left" }}>
                  {new Date(m.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              padding: "6px 10px",
              background: "#FFFFFF",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              borderTop: "1px solid #E8DAC8",
            }}
          >
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                style={{
                  background: "#FAF6EE",
                  border: "1px solid #D9C5B2",
                  borderRadius: "100px",
                  color: "#C6873E",
                  fontSize: "10.5px",
                  padding: "4px 10px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: "10px 12px",
              background: "#FFFFFF",
              borderTop: "1px solid #E8DAC8",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder={lang === "en" ? "Type your message..." : "اكتب استفسارك هنا..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              style={{
                flex: 1,
                height: "38px",
                background: "#FAF6EE",
                border: "1px solid #D9C5B2",
                borderRadius: "10px",
                padding: "0 12px",
                fontSize: "12.5px",
                color: "#2B170E",
                outline: "none",
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={sending || !inputText.trim()}
              style={{
                width: "38px",
                height: "38px",
                background: "linear-gradient(135deg, #D4954E, #C6873E)",
                border: "none",
                borderRadius: "10px",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(198, 135, 62, 0.35)",
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
