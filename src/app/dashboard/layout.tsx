"use client";

import Sidebar from "./components/Sidebar";
import "../globals.css";
import RequireAuth from "@/components/auth/RequireAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-[#fdfdfd]">
        {/* The Sidebar is hidden on mobile inside its own component,
          so we just let it take its space here on large screens.
        */}
        <Sidebar />

        {/* MAIN CONTENT AREA
          - min-w-0: Prevents flex children from overflowing their container
          - flex-1: Takes up the remaining horizontal space
        */}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-6 md:px-8 md:py-8 lg:max-h-[calc(100vh-120px)]">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}
