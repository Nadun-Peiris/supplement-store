"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMessageCircle } from "react-icons/fi";
import { usePathname } from "next/navigation";

export default function ChatButton({ onClick }: { onClick: () => void }) {
  const pathname = usePathname();
  const [showNudge, setShowNudge] = useState(false);

  // Check if the user is currently anywhere inside the dashboard
  const isDashboard = pathname?.startsWith("/dashboard");

  useEffect(() => {
    const showTemporarily = () => {
      setShowNudge(true);
      window.setTimeout(() => setShowNudge(false), 3600);
    };

    const initialTimer = window.setTimeout(showTemporarily, 3500);
    const intervalTimer = window.setInterval(showTemporarily, 18000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalTimer);
    };
  }, []);

  return (
    <div
      className={`fixed right-[25px] z-[999999] ${
        isDashboard 
          ? "bottom-[110px] lg:bottom-[25px]" // Push up on mobile dashboard, reset on desktop
          : "bottom-[25px]"                   // Normal position for all other pages
      }`}
    >
      <AnimatePresence>
        {showNudge && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="pointer-events-none absolute -top-[88px] right-0 w-max max-w-[220px]"
          >
            <div className="relative rounded-[20px] border border-[#214755] bg-[linear-gradient(145deg,rgba(15,23,28,0.98),rgba(10,17,21,0.98))] px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
              <div className="mb-1 text-[0.58rem] font-black uppercase tracking-[0.18em] text-[#7bdcff]">
                Coach
              </div>
              <div className="text-[0.78rem] font-bold leading-5 text-[#dff9ff]">
                Need some help?
              </div>
              <div className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border-b border-r border-[#214755] bg-[#0d1519]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onClick}
        animate={
          showNudge
            ? {
                y: [0, -4, 0],
                scale: [1, 1.03, 1],
              }
            : {
                y: 0,
                scale: 1,
              }
        }
        transition={{
          duration: 1.1,
          repeat: showNudge ? 2 : 0,
          ease: "easeInOut",
        }}
        className="inline-flex h-12 items-center gap-[10px] rounded-full border border-[#245261] bg-[#10171c] px-[18px] text-[0.95rem] font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition-all duration-300 ease-in-out hover:border-[#03C7FE] hover:bg-[#0a1014]"
      >
        <FiMessageCircle aria-hidden className="text-[1.1em] text-[#7bdcff]" />
        <span className="tracking-[0.12em]">Ask Coach</span>
      </motion.button>
    </div>
  );
}
