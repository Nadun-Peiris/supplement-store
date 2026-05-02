"use client";

import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav"; // Import the new mobile navigation
import RequireAuth from "@/components/auth/RequireAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      {/* 
        1. h-[calc(100vh-120px)]: Adjusts height to account for your top/bottom headers. 
        2. w-full: Takes full browser width
        3. overflow-hidden: Prevents the whole window from scrolling (app-like feel)
      */}
      <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden bg-[#fdfdfd]">
        
        {/* 
          DESKTOP SIDEBAR 
          Hidden entirely on mobile/tablet (lg:block ensures it only shows on large screens)
        */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* 
          MAIN SCROLLABLE CONTENT
        */}
        <main className="h-full flex-1 overflow-y-auto scroll-smooth">
          {/* 
            Inner container: 
             - px-4 md:px-10 lg:px-12: Responsive side padding
             - pb-32: Extra padding on mobile so you can scroll past the bottom nav bar!
             - lg:pb-12: Resets to normal padding on desktop since there's no bottom nav.
          */}
          <div className="mx-auto w-full max-w-[100rem] px-4 py-8 pb-32 md:px-10 lg:px-12 lg:pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* 
        MOBILE BOTTOM NAVIGATION
        This component handles its own visibility (hidden on desktop, visible on mobile).
        It sits outside the main flex container so it always stays glued to the bottom of the screen.
      */}
      <MobileNav />
    </RequireAuth>
  );
}