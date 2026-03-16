"use client";

import { useState, useEffect } from "react";

const announcements = [
  "Islandwide Delivery on all orders",
  "Free Shaker for orders over Rs. 15,000",
  "Contact Support: +94 77 765 8483",
  "100% Authentic Supplements Guaranteed",
];

export default function TopHeader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full bg-[#03c7fe] text-black">
      <div className="mx-auto flex max-w-[110rem] items-center justify-between px-6 py-4 md:px-12">
        
        {/* Left Side: Brand Name */}
        <div className="hidden flex-1 text-[11px] font-bold uppercase tracking-[0.15em] md:block opacity-90">
          Supplement Lanka PVT LTD
        </div>

        {/* Center: Vertical Slide Slider */}
        <div className="relative flex flex-[2] items-center justify-center overflow-hidden h-5">
          {announcements.map((text, i) => {
            const isActive = i === index;
            const isPrevious = i === (index - 1 + announcements.length) % announcements.length;

            return (
              <span
                key={i}
                className={`absolute text-center text-[12px] font-bold uppercase tracking-tight transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isActive 
                    ? "translate-y-0 opacity-100" 
                    : isPrevious 
                      ? "-translate-y-full opacity-0" 
                      : "translate-y-full opacity-0"
                }`}
              >
                {text}
              </span>
            );
          })}
        </div>

        {/* Right Side: Location */}
        <div className="hidden flex-1 text-right text-[11px] font-bold uppercase tracking-[0.15em] md:block opacity-90">
          Colombo, Sri Lanka
        </div>
      </div>
    </header>
  );
}
