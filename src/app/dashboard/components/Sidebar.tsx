"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Package, CreditCard, LogOut, LayoutDashboard } from "lucide-react";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menu = [
    { name: "Overview", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Profile", href: "/dashboard/profile", icon: <User size={20} /> },
    { name: "Orders", href: "/dashboard/orders", icon: <Package size={20} /> },
    {
      name: "Subscription",
      href: "/dashboard/subscription",
      icon: <CreditCard size={20} />,
    },
  ];

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
    <aside className="sticky top-[120px] hidden h-[calc(100vh-120px)] w-[260px] flex-shrink-0 flex-col border-r border-gray-100 bg-white p-6 lg:flex">
      {/* HEADER / LOGO */}
      <div className="mb-8 px-2">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
          Menu
        </h2>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-1 flex-col gap-2">
        {menu.map((item) => {
          // Logic to handle active state even on sub-pages (e.g., /dashboard/orders/[id])
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname.startsWith(item.href);

          return (
            <Link
              href={item.href}
              key={item.name}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                isActive
                  ? "bg-[#03c7fe] text-white shadow-[0_10px_20px_rgba(3,199,254,0.2)]"
                  : "text-gray-500 hover:bg-[#f3faff] hover:text-[#03c7fe]"
              }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                {item.icon}
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
  );
}
