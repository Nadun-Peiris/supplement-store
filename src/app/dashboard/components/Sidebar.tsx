"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User, Package, CreditCard, Home } from "lucide-react";
import "./sidebar.css";
import { auth } from "@/lib/firebase";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: <Home size={18} /> },
    { name: "Profile", href: "/dashboard/profile", icon: <User size={18} /> },
    { name: "Orders", href: "/dashboard/orders", icon: <Package size={18} /> },
    {
      name: "Subscription",
      href: "/dashboard/subscription",
      icon: <CreditCard size={18} />,
    },
  ];

  const logout = async () => {
    await auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">MyHealth</h2>
      </div>

      <nav className="sidebar-menu">
        {menu.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              href={item.href}
              key={item.name}
              className={`sidebar-item ${active ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <button className="sidebar-logout" onClick={logout}>
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
