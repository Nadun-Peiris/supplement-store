"use client";
import { FiMessageCircle } from "react-icons/fi";
import { usePathname } from "next/navigation";

export default function ChatButton({ onClick }: { onClick: () => void }) {
  const pathname = usePathname();
  
  // Check if the user is currently anywhere inside the dashboard
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <button
      className={`fixed right-[25px] z-[999999] inline-flex h-11 items-center gap-[10px] rounded-full border border-[#525252] bg-[#262626] px-[18px] text-[1.05rem] font-semibold text-white shadow-[0_6px_18px_rgba(0,0,0,0.25)] transition-all duration-300 ease-in-out hover:border-[#03C7FE] hover:bg-[#111] ${
        isDashboard 
          ? "bottom-[110px] lg:bottom-[25px]" // Push up on mobile dashboard, reset on desktop
          : "bottom-[25px]"                   // Normal position for all other pages
      }`}
      onClick={onClick}
    >
      <FiMessageCircle aria-hidden className="text-[1.1em]" />
      <span className="tracking-[0.4px]">Chat</span>
    </button>
  );
}