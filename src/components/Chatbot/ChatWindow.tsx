"use client";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { FiSend } from "react-icons/fi";
import "./chat.css";

type ChatEntry = {
  id: string;
  sender: "user" | "ai";
  text: string;
  products?: any[];
};

export default function ChatWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to UI instantly
    setMessages((prev) => [
        ...prev,
        { id: newId(), sender: "user", text: input },
      ]);

    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      let token = null;
      const user = auth.currentUser;
      if (user) token = await user.getIdToken();

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "We couldn't get a reply right now.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          sender: "ai",
          text: data.reply || "Something went wrong.",
          products: data.products || [],
        },
      ]);
      setError(null);
    } catch (err: any) {
      const fallback = err?.message || "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        { id: newId(), sender: "ai", text: fallback },
      ]);
      setError(fallback);
      toast.error(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent) => {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight;

      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>
          <p className="chat-kicker">AI Assistant</p>
          <h4>Supplement Coach</h4>
        </div>
        <button onClick={onClose} aria-label="Close chat">
          ✖
        </button>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.map((msg, index) => (
          <ChatBubble key={msg.id || index} message={msg} />
        ))}

        {loading && (
          <div className="chat-typing" aria-live="polite">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-text">Coach is typing</span>
          </div>
        )}
        {!messages.length && (
          <div className="chat-placeholder">
            Ask for product recommendations, stack advice, or dosing help.
          </div>
        )}
        {error && <div className="chat-error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <div className="chat-input-field">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                !loading && sendMessage();
              }
            }}
            disabled={loading}
          />
        </div>
        <button onClick={sendMessage} disabled={loading} aria-label="Send">
          {loading ? "..." : <FiSend aria-hidden />}
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatEntry }) {
  const [displayed, setDisplayed] = useState(
    message.sender === "ai" ? "" : message.text
  );

  useEffect(() => {
    if (message.sender !== "ai") {
      setDisplayed(message.text);
      return;
    }

    setDisplayed("");
    let index = 0;
    const interval = setInterval(() => {
      index += 2;
      setDisplayed(message.text.slice(0, index));

      if (index >= message.text.length) {
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [message.sender, message.text]);

  const isTyping = message.sender === "ai" && displayed !== message.text;

  return (
    <div
      className={`chat-msg ${
        message.sender === "user" ? "user" : "ai"
      } ${isTyping ? "is-typing" : ""}`}
    >
      <span className="chat-msg-text">{displayed}</span>
      {isTyping && <span className="typing-caret" aria-hidden />}
    </div>
  );
}
