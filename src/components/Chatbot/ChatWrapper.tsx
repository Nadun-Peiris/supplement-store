"use client";

import { useEffect, useState } from "react";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";
import {
  OPEN_SUPPLEMENT_COACH_EVENT,
  type OpenSupplementCoachDetail,
} from "@/lib/chatbot";

type LaunchRequest = {
  id: number;
  prompt?: string;
  autoSend?: boolean;
};

export default function ChatWrapper() {
  const [openChat, setOpenChat] = useState(false);
  const [launchRequest, setLaunchRequest] = useState<LaunchRequest | null>(null);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<OpenSupplementCoachDetail>;
      setLaunchRequest({
        id: Date.now(),
        prompt: customEvent.detail?.prompt,
        autoSend: customEvent.detail?.autoSend,
      });
      setOpenChat(true);
    };

    window.addEventListener(OPEN_SUPPLEMENT_COACH_EVENT, handleOpen);
    return () =>
      window.removeEventListener(OPEN_SUPPLEMENT_COACH_EVENT, handleOpen);
  }, []);

  return (
    <>
      <ChatButton onClick={() => setOpenChat((open) => !open)} />
      {openChat && (
        <ChatWindow
          onClose={() => setOpenChat(false)}
          launchRequest={launchRequest}
        />
      )}
    </>
  );
}
