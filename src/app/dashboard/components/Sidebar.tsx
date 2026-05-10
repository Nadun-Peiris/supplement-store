"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import { dashboardMenu } from "./dashboardMenu";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 👇 State to control mobile drawer
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await auth.signOut();
      toast.success("Logged out successfully");
      router.replace("/login");
    } catch {
      toast.error("Failed to log out");
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* 👇 FLOATING MOBILE MENU BUTTON (Hidden on Desktop) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#03c7fe] text-white shadow-[0_10px_20px_rgba(3,199,254,0.3)] transition-transform hover:scale-105 active:scale-95 lg:hidden"
        aria-label="Open Menu"
      >
        <Menu size={24} strokeWidth={2.5} />
      </button>

      {/* 👇 MOBILE BACKGROUND OVERLAY */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-shrink-0 flex-col border-r border-gray-100 bg-white p-6 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] 
        lg:sticky lg:top-[120px] lg:z-0 lg:h-[calc(100vh-120px)] lg:translate-x-0 
        ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:shadow-none"}`}
      >
        {/* HEADER / LOGO */}
        <div className="mb-8 flex items-center justify-between px-2">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
            Menu
          </h2>
          
          {/* 👇 CLOSE BUTTON (Mobile Only) */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="text-gray-400 hover:text-[#03c7fe] transition-colors lg:hidden"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden pb-4 scrollbar-hide">
          {dashboardMenu.map((item) => {
            // Logic to handle active state even on sub-pages (e.g., /dashboard/orders/[id])
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                href={item.href}
                key={item.name}
                onClick={() => setIsMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#03c7fe] text-white shadow-[0_10px_20px_rgba(3,199,254,0.2)]"
                    : "text-gray-500 hover:bg-[#f3faff] hover:text-[#03c7fe]"
                }`}
              >
                <span
                  className={`transition-transform duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                >
                  <Icon size={20} />
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER / LOGOUT */}
        <div className="mt-auto border-t border-gray-50 pt-6">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-bold text-gray-500 transition-all duration-200 hover:border-[#03c7fe]/30 hover:bg-[#f3faff] hover:text-[#e74c3c] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogOut size={20} />
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
