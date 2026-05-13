"use client";

import { openSupplementCoach } from "@/lib/chatbot";

type OpenChatButtonProps = {
  label: string;
  className: string;
  prompt?: string;
  autoSend?: boolean;
};

export default function OpenChatButton({
  label,
  className,
  prompt,
  autoSend = false,
}: OpenChatButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => openSupplementCoach({ prompt, autoSend })}
    >
      {label}
    </button>
  );
}
