"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { FiSearch, FiUser, FiShoppingBag, FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { dashboardMenu } from "@/app/dashboard/components/dashboardMenu";
import { getShopCategoryHref } from "@/lib/shopRoutes";

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [featured, setFeatured] = useState<FeaturedCategory[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { count } = useCart();
  const { user, loading: authLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSearchTerm(new URLSearchParams(window.location.search).get("search") || "");
    setUserMenuOpen(false);
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

  useEffect(() => {
    if (!userMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [userMenuOpen]);

  const checkIsActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || (href !== "/" && pathname?.startsWith(href));
  };

  const navFeatured = featured.filter((item) => item.category && item.category.slug);
  const skeletons = Array.from({ length: 4 });
  const categoryLinks = navFeatured.map((item) => ({
    id: item._id,
    label:
      item.category.name.charAt(0).toUpperCase() +
      item.category.name.slice(1).toLowerCase(),
    href: getShopCategoryHref(item.category.slug),
  }));

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

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      setUserMenuOpen(false);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative w-full bg-[#03c7fe]">
      {/* 
        MAIN HEADER 
        Added relative z-[60] so the mobile menu drops behind it.
      */}
      <div className="relative z-[60] w-full rounded-t-[36px] bg-white px-6 pb-4 pt-6 md:px-12 md:pt-7">
        <div className="mx-auto flex max-w-[110rem] items-center justify-between gap-6">
          
          {/* LEFT SECTION: HAMBURGER (Mobile) + LOGO + NAVIGATION */}
          <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-10 xl:gap-12 2xl:gap-20">
            
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
              <Image
                src="/logoblack.png"
                alt="Supplement Lanka"
                width={320}
                height={128}
                priority
                className="h-12 w-auto md:h-16 lg:h-20"
              />
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden min-w-0 flex-1 xl:block">
              <ul className="m-0 flex list-none items-center gap-x-6 overflow-x-auto whitespace-nowrap p-0 pb-1 pr-2 scrollbar-hide 2xl:gap-x-8">
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
                  : categoryLinks.map((item) => {
                      const isActive = checkIsActive(item.href, true);

                      return (
                        <li key={item.id}>
                          <Link href={item.href} className="group relative flex items-center gap-1 py-2 text-[16px] font-extrabold text-black transition-colors hover:text-[#03c7fe]">
                            {item.label}
                            <span className={`absolute -bottom-1 left-0 h-[2.5px] bg-[#03c7fe] transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`} />
                          </Link>
                        </li>
                      );
                    })}
              </ul>
            </nav>
          </div>

          {/* RIGHT SECTION: ACTIONS */}
          <div className="ml-auto flex shrink-0 items-center gap-4 sm:gap-5 lg:gap-6 xl:gap-7">
            {/* Search Input Area */}
            <form
              className="hidden items-center gap-3 lg:flex"
              onSubmit={handleSearchSubmit}
            >
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
            <div className="hidden h-8 w-[1px] bg-gray-200 2xl:block"></div>

            {/* Profile Icon / User Menu */}
            {authLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setUserMenuOpen((open) => !open);
                  }}
                  className="flex items-center gap-1 rounded-full px-1 py-1 text-black transition-colors hover:text-[#03c7fe]"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="Open account menu"
                >
                  <FiUser strokeWidth={2} className="text-[24px]" />
                  <FiChevronDown
                    className={`text-[16px] transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`absolute right-0 top-full z-[80] mt-4 w-[280px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-200 ${
                    userMenuOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-2 opacity-0"
                  }`}
                >
                  <div className="border-b border-gray-100 bg-[#f8fdff] px-5 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#03c7fe]">
                      Signed In
                    </p>
                    <p className="mt-2 truncate text-sm font-bold text-[#111]">
                      {user.displayName || user.email?.split("@")[0] || "Account"}
                    </p>
                    {user.email && (
                      <p className="mt-1 truncate text-xs font-medium text-gray-500">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <div className="p-3">
                    <nav className="flex flex-col gap-1">
                      {dashboardMenu.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                          item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                              isActive
                                ? "bg-[#03c7fe] text-white shadow-[0_10px_20px_rgba(3,199,254,0.18)]"
                                : "text-gray-600 hover:bg-[#f3faff] hover:text-[#03c7fe]"
                            }`}
                          >
                            <Icon size={18} />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>

                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-gray-600 transition-all hover:bg-[#fff5f5] hover:text-[#e74c3c] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <LogOut size={18} />
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login" className="text-black hover:text-[#03c7fe] transition-colors">
                <FiUser strokeWidth={2} className="text-[24px]" />
              </Link>
            )}

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

        <div className="mt-5 border-t border-gray-100 pt-4 xl:hidden">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            <Link
              href="/"
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                checkIsActive("/", true)
                  ? "border-[#03c7fe] bg-[#03c7fe] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-[#03c7fe] hover:text-[#03c7fe]"
              }`}
            >
              Home
            </Link>
            <Link
              href="/shop"
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                checkIsActive("/shop", true)
                  ? "border-[#03c7fe] bg-[#03c7fe] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-[#03c7fe] hover:text-[#03c7fe]"
              }`}
            >
              Shop
            </Link>
            {featuredLoading
              ? skeletons.map((_, idx) => (
                  <div
                    key={`responsive-skeleton-${idx}`}
                    className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-gray-100"
                  />
                ))
              : categoryLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                      checkIsActive(item.href, true)
                        ? "border-[#03c7fe] bg-[#03c7fe] text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#03c7fe] hover:text-[#03c7fe]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
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
              {categoryLinks.map((item, idx) => {
                return (
                  <li 
                    key={item.id} 
                    className={`transition-all duration-500 ${menuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`}
                    style={{ transitionDelay: `${200 + (idx * 50)}ms` }}
                  >
                    {/* 👇 CHANGE MOBILE MENU TEXT SIZE HERE */}
                    <Link href={item.href} onClick={() => setMenuOpen(false)} className={`text-xl sm:text-2xl font-extrabold hover:text-[#03c7fe] ${checkIsActive(item.href, true) ? "text-[#03c7fe]" : "text-black"}`}>
                      {item.label}
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
