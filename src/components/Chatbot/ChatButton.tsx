"use client";
import "./chat.css";
import { FiMessageCircle } from "react-icons/fi";

export default function ChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="chat-float-btn" onClick={onClick}>
      <FiMessageCircle aria-hidden />
      <span className="chat-label">Chat</span>
    </button>
  );
}
