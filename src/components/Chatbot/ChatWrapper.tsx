"use client";

import { useState } from "react";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";

export default function ChatWrapper() {
  const [openChat, setOpenChat] = useState(false);

  return (
    <>
      <ChatButton onClick={() => setOpenChat((open) => !open)} />
      {openChat && <ChatWindow onClose={() => setOpenChat(false)} />}
    </>
  );
}
