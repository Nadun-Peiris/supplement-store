"use client";

import { useState } from "react";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";

export default function ChatWrapper({ children }: { children: React.ReactNode }) {
  const [openChat, setOpenChat] = useState(false);

  return (
    <>
      {children}
      <ChatButton onClick={() => setOpenChat((open) => !open)} />
      {openChat && <ChatWindow onClose={() => setOpenChat(false)} />}
    </>
  );
}
