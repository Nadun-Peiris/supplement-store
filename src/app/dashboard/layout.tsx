"use client";

import Sidebar from "./components/Sidebar";
import RequireAuth from "@/components/auth/RequireAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      {/* 1. h-screen overflow-hidden: Prevents the whole window from scrolling 
         2. w-full: Takes full browser width
      */}
      <div className="flex h-screen w-full overflow-hidden bg-[#fdfdfd]">
        
        {/* Sidebar maintains its width defined inside its component */}
        <Sidebar />

        {/* 1. flex-1: Takes up 100% of the space NOT occupied by the sidebar
           2. overflow-y-auto: Allows the main area to scroll independently
        */}
        <main className="flex-1 h-full overflow-y-auto">
          {/* Inner container: 
             - w-full: no max-width constraints 
             - lg:px-12: generous breathing room on sides
          */}
          <div className="w-full px-4 py-8 md:px-10 lg:px-12 pb-24">
            {children}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
