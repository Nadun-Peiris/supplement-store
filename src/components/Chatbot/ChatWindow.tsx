"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiSend } from "react-icons/fi";
import { auth } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { PenSquare, Sparkles, X } from "lucide-react";

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
  brandName?: string;
  category?: string;
  isLabTested?: boolean;
};

type ChatEntry = {
  id: string;
  sender: "user" | "ai";
  text: string;
  intent?: "chat" | "survey" | "recommend";
  products?: AIProduct[];
};

type LaunchRequest = {
  id: number;
  prompt?: string;
  autoSend?: boolean;
} | null;

const STORAGE_KEY = "supplement-coach:messages";

const elderQuickPrompts = [
  {
    label: "Gentle options after 50",
    message:
      "I am over 50. What are some gentler supplement options for general health and recovery?",
  },
  {
    label: "Joint support help",
    message:
      "I need help finding supplements for joint support and recovery. Ask me the right questions first.",
  },
  {
    label: "Low-stimulant guidance",
    message:
      "I want low-stimulant supplement recommendations. Ask me what you need to know first.",
  },
];

export default function ChatWindow({
  onClose,
  launchRequest,
}: {
  onClose: () => void;
  launchRequest: LaunchRequest;
}) {
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const handledLaunchIdRef = useRef<number | null>(null);

  const { addToCart } = useCart();
  const { user } = useAuth();

  const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const sendMessage = async (messageOverride?: string) => {
    const resolvedMessage = (messageOverride ?? input).trim();
    if (!resolvedMessage || loading) return;

    if (!messageOverride) {
      setInput("");
    }

    const currentHistory = messages.map((msg) => ({
      role: msg.sender,
      content: msg.text,
    }));

    setMessages((prev) => [
      ...prev,
      { id: newId(), sender: "user", text: resolvedMessage },
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
          message: resolvedMessage,
          history: currentHistory,
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

  const handleLaunchRequest = useEffectEvent(async () => {
    if (!launchRequest || launchRequest.id === handledLaunchIdRef.current) {
      return;
    }

    handledLaunchIdRef.current = launchRequest.id;
    setError(null);

    if (!launchRequest.prompt?.trim()) return;

    if (launchRequest.autoSend) {
      setInput("");
      await sendMessage(launchRequest.prompt);
      return;
    }

    setInput(launchRequest.prompt);
  });

  const handleQuickPrompt = (prompt: string) => {
    if (loading) return;
    setInput("");
    void sendMessage(prompt);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  useEffect(() => {
    void handleLaunchRequest();
  }, [launchRequest]);

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
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

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
    <>
      <motion.button
        type="button"
        aria-label="Close coach overlay"
        className="fixed inset-0 z-[999998] bg-[radial-gradient(circle_at_top,rgba(3,199,254,0.1),transparent_28%),rgba(2,8,11,0.58)] backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.26, ease: "easeOut" }}
        className="fixed bottom-[20px] right-[20px] z-[999999] h-[min(82vh,820px)] w-[min(460px,calc(100vw-24px))] rounded-[32px] bg-[linear-gradient(145deg,rgba(125,220,255,0.42),rgba(255,255,255,0.08)_22%,rgba(125,220,255,0.16)_55%,rgba(255,255,255,0.06)_100%)] p-[1px] shadow-[0_32px_120px_rgba(0,0,0,0.58)] max-sm:bottom-3 max-sm:left-3 max-sm:right-3 max-sm:h-[calc(100dvh-24px)] max-sm:w-auto"
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[31px] border border-white/8 bg-[#071015] text-[#e8edf0]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(3,199,254,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="relative border-b border-white/8 bg-[linear-gradient(180deg,rgba(7,16,21,0.86),rgba(7,16,21,0.68))] px-4 pb-4 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="relative mt-0.5 shrink-0">
                  <div className="absolute inset-0 animate-pulse rounded-[22px] bg-[#03c7fe]/25 blur-md" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-[22px] border border-[#224451] bg-[linear-gradient(145deg,#0d1b22,#0a1318)] text-[#7bdcff] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <Sparkles size={20} />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#21414d] bg-[#0d1a20] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#7bdcff]">
                      AI Coach
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Ready
                    </span>
                  </div>
                  <h4 className="mt-2 truncate text-[1.15rem] font-semibold tracking-wide text-white">
                    Supplement Coach
                  </h4>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleNewChat}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#294550] bg-[#101920] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#7bdcff] transition-colors hover:border-[#4d6974] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PenSquare size={13} />
                  New
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-[#9db2bc] transition-colors hover:border-white/20 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

          </div>

          <div
            className="relative flex-1 overflow-y-auto px-4 pb-4 pt-3 text-sm scroll-smooth"
            ref={bodyRef}
          >
            {!messages.length && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.24 }}
                className="mb-5"
              >
                <div className="overflow-hidden rounded-[28px] border border-[#1a2d35] bg-[linear-gradient(145deg,rgba(9,18,24,0.96),rgba(14,24,30,0.96))]">
                  <div className="border-b border-white/8 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0d1a20] text-[#7bdcff] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-white">
                          Built to feel like a real consult
                        </p>
                        <p className="mt-1 text-[12px] font-medium leading-5 text-white/58">
                          Ask openly and the coach will narrow the fit.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    <p className="text-[13px] font-medium leading-6 text-white/68">
                      Ask about your goal, budget, ingredient restrictions, or
                      preferred product type to get started.
                    </p>

                    <div className="mt-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7bdcff]">
                        Helpful For Elders
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {elderQuickPrompts.map((prompt) => (
                          <button
                            key={prompt.label}
                            type="button"
                            onClick={() => handleQuickPrompt(prompt.message)}
                            className="rounded-full border border-[#23414c] bg-[#0f1a20] px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-white/82 transition-colors hover:border-[#3a6f81] hover:text-[#7bdcff]"
                          >
                            {prompt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <ChatBubble message={msg} />

                  {msg.sender === "ai" &&
                    msg.products &&
                    msg.products.length > 0 && (
                      <div className="my-3 flex flex-col gap-3 pl-0 sm:pl-14">
                        {msg.products.map((product) => (
                          <ProductCardAI
                            key={product.id}
                            product={product}
                            onAdd={handleAddToCart}
                          />
                        ))}
                      </div>
                    )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="mb-3 flex items-center gap-3 pl-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#21414d] bg-[#0c171c] text-[#7bdcff]">
                  <Sparkles size={15} />
                </div>
                <div className="rounded-[20px] border border-[#1e3138] bg-[#111a20]/95 px-4 py-3 text-[13px] text-[#7bdcff] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#7bdcff]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#7bdcff] [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#7bdcff] [animation-delay:300ms]" />
                    <span className="ml-1 tracking-[0.03em] text-white/78">
                      Coach is shaping your shortlist
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="relative border-t border-white/8 bg-[linear-gradient(180deg,rgba(7,16,21,0.68),rgba(7,16,21,0.92))] px-4 pb-4 pt-3"
            onSubmit={handleSubmit}
          >
            <div className="rounded-[26px] border border-[#1f3138] bg-[linear-gradient(180deg,rgba(13,20,25,0.94),rgba(9,14,18,0.98))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Tell me your goal, budget, and any ingredient restrictions..."
                    className="max-h-40 min-h-[56px] w-full resize-none bg-transparent px-3 py-3 text-[14px] font-medium leading-6 text-[#edf3f6] outline-none placeholder:text-white/28"
                    rows={1}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        if (!loading) {
                          void sendMessage();
                        }
                      }
                    }}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#03c7fe,#59dbff)] text-[#041018] shadow-[0_10px_24px_rgba(3,199,254,0.32)] transition-all hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "..." : <FiSend size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1">
              <p className="text-[11px] leading-5 text-white/38">
                Catalog-grounded guidance. Use Shift+Enter for a new line.
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/24">
                {input.trim().length}/1000
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
