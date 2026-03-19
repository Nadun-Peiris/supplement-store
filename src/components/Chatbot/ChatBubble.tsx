"use client";
import { useEffect, useState } from "react";

export default function ChatBubble({ message }: any) {
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

      if (index >= message.text.length) clearInterval(interval);
    }, 18);

    return () => clearInterval(interval);
  }, [message.sender, message.text]);

  const isTyping = message.sender === "ai" && displayed !== message.text;
  const isUser = message.sender === "user";

  return (
    <div
      className={`relative mb-2 max-w-[80%] rounded-xl px-3 py-2.5 text-[14px] leading-relaxed ${
        isUser
          ? "ml-auto bg-gradient-to-br from-[#03c7fe] to-[#0bb3d6] text-[#041018] shadow-[0_4px_12px_rgba(3,199,254,0.25)]"
          : "mr-auto border border-[#1f1f1f] bg-[#181818] text-[#e6e6e6] overflow-hidden"
      }`}
    >
      <span className={`whitespace-pre-wrap ${isTyping ? "pr-2" : ""}`}>
        {displayed}
      </span>
      {isTyping && (
        <span className="ml-[2px] inline-block h-[16px] w-[6px] animate-pulse rounded-[2px] bg-[#7bdcff]" />
      )}
    </div>
  );
}