"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, CreditCard, LayoutDashboard } from "lucide-react";
import { BiHealth } from "react-icons/bi";

export default function MobileNav() {
  const pathname = usePathname();

  // Shortened names slightly so they fit perfectly side-by-side on tiny phone screens
  const menu = [
    { name: "Home", href: "/dashboard", icon: <LayoutDashboard size={22} /> },
    { name: "Health", href: "/dashboard/health", icon: <BiHealth size={22} /> },
    { name: "Orders", href: "/dashboard/orders", icon: <Package size={22} /> },
    { name: "Subscriptions", href: "/dashboard/subscription", icon: <CreditCard size={22} /> },
    { name: "Profile", href: "/dashboard/profile", icon: <User size={22} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-[60] w-full rounded-t-[24px] bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] lg:hidden">
      {/* 
        pb-safe ensures it respects the "home indicator" bar at the bottom of modern iPhones 
      */}
      <div className="flex items-center justify-around px-2 py-3 pb-safe-bottom sm:px-6">
        {menu.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className="group flex flex-col items-center justify-center gap-1 w-16"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-[#03c7fe] text-white shadow-md shadow-[#03c7fe]/30 scale-110"
                    : "bg-transparent text-gray-400 hover:text-[#03c7fe] hover:bg-[#f0fbff]"
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`text-[10px] font-bold transition-colors ${
                  isActive ? "text-[#03c7fe]" : "text-gray-400"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}