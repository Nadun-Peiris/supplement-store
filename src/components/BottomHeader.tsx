"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FiSearch, FiUser, FiShoppingBag, FiMenu, FiX } from "react-icons/fi";
import { useCart } from "@/context/CartContext";
import { absoluteUrl } from "@/lib/absoluteUrl";

interface FeaturedCategory {
  _id: string;
  index: number;
  category: {
    _id: string;
    name: string;
    slug: string;
    image: string;
  };
}

export default function BottomHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featured, setFeatured] = useState<FeaturedCategory[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSearchTerm(new URLSearchParams(window.location.search).get("search") || "");
  }, [pathname]);

  useEffect(() => {
    async function loadFeatured() {
      setFeaturedLoading(true);
      try {
        const res = await fetch(absoluteUrl("/api/featured-categories"));
        const data = await res.json();
        const sorted = (data.items || []).sort((a: FeaturedCategory, b: FeaturedCategory) => a.index - b.index);
        setFeatured(sorted);
      } catch (err) {
        console.error("HEADER FEATURED LOAD ERROR:", err);
      } finally {
        setFeaturedLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const checkIsActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || (href !== "/" && pathname?.startsWith(href));
  };

  const navFeatured = featured.filter((item) => item.category && item.category.slug);
  const skeletons = Array.from({ length: 4 });

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchTerm.trim();
    if (!query) {
      router.push("/shop");
      setMenuOpen(false);
      return;
    }

    router.push(`/shop?search=${encodeURIComponent(query)}`);
    setMenuOpen(false);
  };

  return (
    <div className="relative w-full bg-[#03c7fe]">
      {/* 
        MAIN HEADER 
        Added relative z-[60] so the mobile menu drops behind it.
      */}
      <div className="relative z-[60] w-full rounded-t-[36px] bg-white px-6 pb-4 pt-6 md:px-12 md:pt-7">
        <div className="mx-auto flex max-w-[110rem] items-center justify-between">
          
          {/* LEFT SECTION: HAMBURGER (Mobile) + LOGO + NAVIGATION */}
          <div className="flex items-center gap-4 lg:gap-12 xl:gap-20">
            
            {/* Hamburger moved to the Left (Hidden on Desktop) */}
            <button 
              className="relative z-50 text-black hover:text-[#03c7fe] transition-colors lg:hidden" 
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {/* 👇 CHANGE ICON SIZE HERE: Change h-[24px] w-[24px] to bigger/smaller values (e.g. h-[28px] w-[28px]) */}
              <div className="relative h-[24px] w-[24px]">
                <FiMenu strokeWidth={2} className={`absolute inset-0 h-full w-full transition-all duration-300 ${menuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`} />
                <FiX strokeWidth={2} className={`absolute inset-0 h-full w-full transition-all duration-300 ${menuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`} />
              </div>
            </button>

            {/* LOGO */}
            <Link href="/" className="shrink-0 transition-transform hover:scale-105">
              {/* 
                👇 CHANGE LOGO SIZE HERE:
                - h-12    = Mobile height (48px)
                - md:h-16 = Tablet height (64px)
                - lg:h-20 = Desktop height (80px)
                Increase these numbers (e.g., h-14, md:h-20, lg:h-24) to make it even bigger.
              */}
              <img
                src="/logoblack.png"
                alt="Supplement Lanka"
                className="h-12 w-auto md:h-16 lg:h-20"
              />
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden lg:block">
              <ul className="m-0 flex list-none items-center gap-x-8 p-0">
                <li>
                  <Link href="/" className="group relative flex items-center gap-1 py-2 text-[16px] font-extrabold text-black transition-colors hover:text-[#03c7fe]">
                    Home
                    <span className={`absolute -bottom-1 left-0 h-[2.5px] bg-[#03c7fe] transition-all duration-300 ${checkIsActive("/") ? "w-full" : "w-0 group-hover:w-full"}`} />
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="group relative flex items-center gap-1 py-2 text-[16px] font-extrabold text-black transition-colors hover:text-[#03c7fe]">
                    Shop
                    <span className={`absolute -bottom-1 left-0 h-[2.5px] bg-[#03c7fe] transition-all duration-300 ${checkIsActive("/shop", true) ? "w-full" : "w-0 group-hover:w-full"}`} />
                  </Link>
                </li>
                {featuredLoading
                  ? skeletons.map((_, idx) => (
                      <li key={`skeleton-${idx}`} className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                    ))
                  : navFeatured.map((item) => {
                      const label = item.category?.name.charAt(0).toUpperCase() + item.category?.name.slice(1).toLowerCase();
                      const itemHref = `/shop/${item.category.slug}`;
                      const isActive = checkIsActive(itemHref, true);

                      return (
                        <li key={item._id}>
                          <Link href={itemHref} className="group relative flex items-center gap-1 py-2 text-[16px] font-extrabold text-black transition-colors hover:text-[#03c7fe]">
                            {label}
                            <span className={`absolute -bottom-1 left-0 h-[2.5px] bg-[#03c7fe] transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`} />
                          </Link>
                        </li>
                      );
                    })}
              </ul>
            </nav>
          </div>

          {/* RIGHT SECTION: ACTIONS */}
          <div className="flex items-center gap-5 md:gap-7">
            {/* Search Input Area */}
            <form className="hidden items-center gap-3 lg:flex" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product or category..."
                className="w-56 bg-transparent text-[15px] font-medium text-gray-700 placeholder:text-gray-400 outline-none"
              />
              <button type="submit" className="text-black hover:text-[#03c7fe] transition-colors">
                {/* 👇 CHANGE ICON SIZE HERE: text-[24px] -> text-[28px] etc. */}
                <FiSearch strokeWidth={2} className="text-[24px]" />
              </button>
            </form>

            {/* Subtle Divider line */}
            <div className="hidden h-8 w-[1px] bg-gray-200 lg:block"></div>

            {/* Profile Icon */}
            <Link href="/login" className="text-black hover:text-[#03c7fe] transition-colors">
              {/* 👇 CHANGE ICON SIZE HERE */}
              <FiUser strokeWidth={2} className="text-[24px]" />
            </Link>

            {/* Shopping Bag - Blue Background */}
            <Link href="/cart" className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#03c7fe] text-black transition-transform hover:scale-105">
              {/* 👇 CHANGE ICON SIZE HERE */}
              <FiShoppingBag strokeWidth={2} className="text-[24px]" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-black px-[6px] text-[11px] font-bold text-white shadow-sm ring-2 ring-white">
                  {count}
                </span>
              )}
            </Link>
          </div>

        </div>
      </div>

      {/* 
        ANIMATED MOBILE MENU 
      */}
      
      {/* Background Dim Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMenuOpen(false)}
      />

      <div className={`absolute left-0 top-full z-50 w-full overflow-hidden rounded-b-[24px] md:rounded-b-[36px] bg-white shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden ${
        menuOpen ? "max-h-[90vh] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4"
      }`}>
        <div className="px-6 py-8">
          {/* Mobile Search Form */}
          <form className="mb-8 flex items-center gap-3 pb-4" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search store..."
              className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-black placeholder:text-gray-400 outline-none"
              autoFocus={menuOpen}
            />
            <button type="submit" className="text-black hover:text-[#03c7fe] transition-colors">
               {/* 👇 CHANGE ICON SIZE HERE */}
              <FiSearch strokeWidth={2} className="text-[24px]" />
            </button>
          </form>
          
          <nav>
            <ul className="flex flex-col gap-5 text-left">
              <li className={`transition-all duration-500 delay-[100ms] ${menuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`}>
                {/* 👇 CHANGE MOBILE MENU TEXT SIZE HERE: Change 'text-xl sm:text-2xl' to e.g., 'text-2xl sm:text-3xl' */}
                <Link href="/" onClick={() => setMenuOpen(false)} className={`text-xl sm:text-2xl font-extrabold hover:text-[#03c7fe] ${checkIsActive("/", true) ? "text-[#03c7fe]" : "text-black"}`}>
                  Home
                </Link>
              </li>
              <li className={`transition-all duration-500 delay-[150ms] ${menuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`}>
                {/* 👇 CHANGE MOBILE MENU TEXT SIZE HERE */}
                <Link href="/shop" onClick={() => setMenuOpen(false)} className={`text-xl sm:text-2xl font-extrabold hover:text-[#03c7fe] ${checkIsActive("/shop", true) ? "text-[#03c7fe]" : "text-black"}`}>
                  Shop All
                </Link>
              </li>
              {navFeatured.map((item, idx) => {
                const label = item.category?.name.charAt(0).toUpperCase() + item.category?.name.slice(1).toLowerCase();
                const itemHref = `/shop/${item.category.slug}`;
                return (
                  <li 
                    key={item._id} 
                    className={`transition-all duration-500 ${menuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`}
                    style={{ transitionDelay: `${200 + (idx * 50)}ms` }}
                  >
                    {/* 👇 CHANGE MOBILE MENU TEXT SIZE HERE */}
                    <Link href={itemHref} onClick={() => setMenuOpen(false)} className={`text-xl sm:text-2xl font-extrabold hover:text-[#03c7fe] ${checkIsActive(itemHref, true) ? "text-[#03c7fe]" : "text-black"}`}>
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}