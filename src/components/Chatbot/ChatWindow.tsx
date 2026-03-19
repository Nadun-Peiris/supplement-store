"use client";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { FiSend } from "react-icons/fi";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { PenSquare, X } from "lucide-react";

import ChatBubble from "./ChatBubble";
import ProductCardAI from "./ProductCardAI";

type AIProduct = {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  image?: string;
  slug?: string;
  reason?: string;
  score?: number;
};

type ChatEntry = {
  id: string;
  sender: "user" | "ai";
  text: string;
  intent?: "chat" | "survey" | "recommend";
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

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    
    // 1. Prepare history BEFORE adding the new message to state
    const currentHistory = messages.map(msg => ({
      role: msg.sender,
      content: msg.text
    }));

    // 2. Add user message to UI
    setMessages((prev) => [
      ...prev,
      { id: newId(), sender: "user", text: userMessage },
    ]);

    setLoading(true);

    try {
      let token = null;
      const authUser = auth.currentUser;
      if (authUser) token = await authUser.getIdToken();

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          message: userMessage,
          history: currentHistory 
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Unable to get AI response.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          sender: "ai",
          text: data.reply || "Something went wrong.",
          intent: data.intent || "chat",
          products: data.products || [],
        },
      ]);

      setError(null);
    } catch (err: unknown) {
      const fallback =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        { id: newId(), sender: "ai", text: fallback, intent: "chat" },
      ]);
      setError(fallback);
      toast.error(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: AIProduct) => {
    if (!product?.id) return;
    const cartPrice =
      typeof product.discountPrice === "number" &&
      product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: cartPrice,
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error("Failed to persist chat messages", err);
    }
  }, [messages]);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [user]);

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
    <div className="fixed bottom-[90px] right-[25px] z-[999999] flex h-[440px] w-[360px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] shadow-[0_16px_32px_rgba(0,0,0,0.35)] max-sm:right-[4vw] max-sm:h-[70vh] max-sm:w-[92vw]">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-gradient-to-br from-[#0b0b0b] to-[#111c24] px-4 py-3.5 text-[#e8e8e8]">
        <div>
          <p className="m-0 text-xs font-bold tracking-[1px] text-[#7bdcff] uppercase">AI Assistant</p>
          <h4 className="m-0 text-base font-semibold tracking-wide text-[#f5f5f5]">Supplement Coach</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2c3a41] bg-[#101920] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#7bdcff] transition-colors hover:border-[#4d6974] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PenSquare size={13} />
          </button>
          <button onClick={onClose} className="text-[#8c8c8c] transition-colors hover:text-white">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <div 
        className="flex-1 overflow-y-auto p-3.5 text-sm text-[#e6e6e6] scroll-smooth"
        style={{
          background: "radial-gradient(circle at 20% 20%, rgba(3, 199, 254, 0.08), transparent 25%), radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.05), transparent 30%), #0f0f0f"
        }}
        ref={bodyRef}
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatBubble message={msg} />

            {/* PRODUCT CARDS */}
            {msg.sender === "ai" && msg.products && msg.products.length > 0 && (
              <div className="my-3 flex flex-col gap-3">
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
          <div className="mb-2.5 inline-flex items-center gap-1.5 text-[13px] text-[#7bdcff]">
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#7bdcff]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#7bdcff] [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#7bdcff] [animation-delay:300ms]" />
            <span className="opacity-80 tracking-[0.6px] ml-1">Coach is typing</span>
          </div>
        )}

        {!messages.length && (
          <div className="rounded-xl border border-dashed border-[#1f1f1f] bg-white/5 p-2.5 text-[13px] text-[#8c8c8c]">
            Ask for supplement advice, fitness guidance, or product recommendations.
          </div>
        )}

        {error && (
          <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-red-400">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 border-t border-[#1f1f1f] bg-[#0b0b0b] p-2.5">
        <div className="flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="h-11 w-full rounded-full border border-[#2a2a2a] bg-[#0c1216]/90 px-3.5 text-[#e6e6e6] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] outline-none transition-colors focus:border-[#2a2a2a] focus:bg-[#0c1216]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
          />
        </div>
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#7bdcff] transition-colors hover:text-[#03c7fe] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "..." : <FiSend size={18} />}
        </button>
      </div>
    </div>
  );
}
