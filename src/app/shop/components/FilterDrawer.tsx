"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Filter, X } from "lucide-react";
import {
  FilterPanelContent,
  type ShopFilterControlsProps,
} from "./FilterSidebar";

type FilterDrawerProps = ShopFilterControlsProps & {
  activeFilterCount: number;
};

export default function FilterDrawer({
  activeFilterCount,
  ...filterProps
}: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const drawerId = useId();

  // Ensure portal only renders on the client to avoid SSR hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle escape key to close
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The drawer content to be teleported via Portal
  const drawerContent = (
    <div className={`md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div
        id={drawerId}
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        className={`fixed top-0 left-0 z-[101] flex h-full w-[85vw] max-w-[340px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#f0f0f0] px-5 py-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-[#03c7fe]" />
            <span className="text-[1rem] font-black uppercase tracking-[0.05em] text-[#111]">
              Filters
            </span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#03c7fe] px-2 py-0.5 text-[0.7rem] font-black text-white">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f5] text-[#555] transition-colors duration-150 hover:bg-red-50 hover:text-red-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <FilterPanelContent {...filterProps} />
        </div>

        {/* Drawer Footer */}
        <div className="shrink-0 border-t border-[#f0f0f0] px-5 py-4">
          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-full bg-[#03c7fe] py-3 text-[0.9rem] font-bold uppercase tracking-[0.06em] text-white transition-all duration-200 hover:bg-[#12b8d9] active:scale-[0.98]"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* TRIGGER BUTTON */}
      <div className="fixed left-0 top-1/2 z-40 -translate-y-1/2 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-controls={drawerId}
          aria-expanded={open}
          aria-label="Open filters"
          /* rounded-r-[25px] curves ONLY the top-right and bottom-right */
          className="relative flex items-center justify-center rounded-r-[25px] border border-l-0 border-[#2e2e2e] bg-[#111] py-4 pl-3 pr-4 text-white shadow-2xl transition-colors duration-200 hover:bg-[#1b1b1b]"
        >
          {/* Icon is now your custom blue */}
          <Filter size={24} className="shrink-0 text-[#03c7fe]" />
          
          {/* Adjusted badge position so it looks perfect on the rounded corner */}
          {activeFilterCount > 0 && (
            <span className="absolute right-0 top-0 flex h-[22px] min-w-[22px] -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full border-[1.5px] border-[#111] bg-[#03c7fe] px-1 text-[0.68rem] font-black text-white shadow">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* PORTALED DRAWER (Appends to the very end of <body>) */}
      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
}