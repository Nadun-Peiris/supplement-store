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

  return (
    <div
      className={`chat-msg ${
        message.sender === "user" ? "user" : "ai"
      } ${isTyping ? "is-typing" : ""}`}
    >
      <span className="chat-msg-text">{displayed}</span>
      {isTyping && <span className="typing-caret" />}
    </div>
  );
}
