"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

type ChatMessage = {
  sender: "ai" | "user";
  text: string;
};

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const [displayed, setDisplayed] = useState("");
  const isAiMessage = message.sender === "ai";

  useEffect(() => {
    if (!isAiMessage) {
      return;
    }

    let index = 0;
    let interval: number | null = null;
    const startTyping = window.setTimeout(() => {
      setDisplayed("");

      interval = window.setInterval(() => {
        index += 2;
        setDisplayed(message.text.slice(0, index));

        if (index >= message.text.length) {
          if (interval !== null) {
            window.clearInterval(interval);
          }
        }
      }, 18);
    }, 0);

    return () => {
      window.clearTimeout(startTyping);
      if (interval !== null) {
        window.clearInterval(interval);
      }
    };
  }, [isAiMessage, message.text]);

  const resolvedText = isAiMessage ? displayed : message.text;
  const isTyping = isAiMessage && displayed !== message.text;
  const isUser = message.sender === "user";

  return (
    <div className={`mb-3 flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[92%] gap-3 sm:max-w-[86%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
            isUser
              ? "border-[#4fdcff]/35 bg-[#0d1f27] text-[#7bdcff]"
              : "border-[#233942] bg-[#0f1a1f] text-[#7bdcff]"
          }`}
        >
          {isUser ? (
            <span className="text-[11px] font-black uppercase tracking-[0.12em]">
              You
            </span>
          ) : (
            <Sparkles size={15} />
          )}
        </div>

        <div
          className={`relative overflow-hidden rounded-[24px] px-4 py-3 text-[14px] font-medium leading-7 shadow-[0_14px_32px_rgba(0,0,0,0.16)] ${
            isUser
              ? "bg-[linear-gradient(145deg,#03c7fe,#6ee4ff)] text-[#041018]"
              : "border border-[#1e3138] bg-[linear-gradient(145deg,rgba(14,22,27,0.98),rgba(18,28,34,0.98))] text-[#eaf2f5]"
          }`}
        >
          {!isUser && (
            <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7bdcff]">
              Coach
            </div>
          )}
          <span className={`whitespace-pre-wrap ${isTyping ? "pr-2" : ""}`}>
            {resolvedText}
          </span>
          {isTyping && (
            <span className="ml-[2px] inline-block h-[16px] w-[6px] animate-pulse rounded-[2px] bg-[#7bdcff]" />
          )}
        </div>
      </div>
    </div>
  );
}
