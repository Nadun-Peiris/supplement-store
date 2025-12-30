"use client";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { FiSend } from "react-icons/fi";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

import ChatBubble from "./ChatBubble";
import ProductCardAI from "./ProductCardAI";
import "./chat.css";

type AIProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug?: string;
  reason?: string;
  score?: number;
};

type ChatEntry = {
  id: string;
  sender: "user" | "ai";
  text: string;
  products?: AIProduct[];
};

export default function ChatWindow({ onClose }: { onClose: () => void }) {
  const STORAGE_KEY = "chat-messages";
  const [messages, setMessages] = useState<ChatEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as ChatEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
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
        throw new Error(data.error || "Unable to get AI response.");
      }

      // AI message + product cards
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

  const handleAddToCart = async (product: AIProduct) => {
    if (!product?.id) return;

    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image || "",
      });
      toast.success("Added to cart!");
    } catch (err) {
      toast.error("Could not add to cart");
      console.error(err);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Persist chat within the session so closing/reopening keeps history
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error("Failed to persist chat messages", err);
    }
  }, [messages]);

  // Clear chat when user logs out
  useEffect(() => {
    if (!user) {
      setMessages([]);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [user]);

  // Prevent scrolling bounce
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
        <button onClick={onClose}>✖</button>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatBubble message={msg} />

            {/* PRODUCT CARDS UNDER AI MESSAGE */}
            {msg.sender === "ai" && msg.products && msg.products.length > 0 && (
              <div className="ai-product-list">
                {msg.products.map((product) => (
                  <ProductCardAI
                    key={product.id}
                    product={product}
                    onAdd={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-typing">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-text">Coach is typing</span>
          </div>
        )}

        {!messages.length && (
          <div className="chat-placeholder">
            Ask for supplement advice, fitness guidance, or product recommendations.
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
              if (e.key === "Enter" && !loading) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
          />
        </div>
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "..." : <FiSend />}
        </button>
      </div>
    </div>
  );
}
