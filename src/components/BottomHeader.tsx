"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

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

  const checkIsActive = (href: string) => {
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

  // Notice there is no 'sticky' or 'fixed' class here, ensuring it scrolls naturally with the page
  return (
    <div className="w-full bg-[#03c7fe]">
      {/* 👇 CHANGE BORDER RADIUS HERE: 
        I reduced "rounded-t-[40px]" to "rounded-t-[15px]". 
        - Make it "rounded-none" if you want perfect right-angles (no curve at all).
        - Increase it (e.g., "rounded-t-[30px]") if you want a bigger curve. 
      */}
      <div className="w-full rounded-t-[36px] bg-white px-6 pb-4 pt-6 md:px-12 md:pt-7">
        <div className="mx-auto flex max-w-[110rem] items-center justify-between">
          
          {/* LEFT SECTION: LOGO + NAVIGATION */}
          <div className="flex items-center lg:gap-12 xl:gap-20">
            {/* LOGO */}
            <Link href="/" className="shrink-0 transition-transform hover:scale-105">
              <img 
                src="/logoblack.png" 
                alt="Supplement Store" 
                className="h-10 w-auto md:h-14"
              /> 
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden lg:block">
              <ul className="m-0 flex list-none items-center gap-x-8 p-0">
                {/* Home */}
                <li>
                  <Link href="/" className="group relative flex items-center gap-1 py-2 text-[16px] font-extrabold text-black transition-colors hover:text-[#03c7fe]">
                    Home
                    <span className={`absolute -bottom-1 left-0 h-[2.5px] bg-[#03c7fe] transition-all duration-300 ${checkIsActive("/") ? "w-full" : "w-0 group-hover:w-full"}`} />
                  </Link>
                </li>
                
                {/* Shop All */}
                <li>
                  <Link href="/shop" className="group relative flex items-center gap-1 py-2 text-[16px] font-extrabold text-black transition-colors hover:text-[#03c7fe]">
                    Shop
                    <span className={`absolute -bottom-1 left-0 h-[2.5px] bg-[#03c7fe] transition-all duration-300 ${checkIsActive("/shop") ? "w-full" : "w-0 group-hover:w-full"}`} />
                  </Link>
                </li>
                
                {/* Dynamic Featured Categories */}
                {featuredLoading
                  ? skeletons.map((_, idx) => (
                      <li key={`skeleton-${idx}`} className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                    ))
                  : navFeatured.map((item) => {
                      const label = item.category?.name.charAt(0).toUpperCase() + item.category?.name.slice(1).toLowerCase();
                      const itemHref = `/shop/${item.category.slug}`;
                      const isActive = checkIsActive(itemHref);

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
              <button type="submit" className="text-2xl text-black hover:text-[#03c7fe] transition-colors">
                <FiSearch strokeWidth={2.5} />
              </button>
            </form>

            {/* Subtle Divider line */}
            <div className="hidden h-8 w-[1px] bg-gray-200 lg:block"></div>

            {/* Profile Icon */}
            <Link href="/dashboard/profile" className="text-2xl text-black hover:text-[#03c7fe] transition-colors">
              <FiUser strokeWidth={2} />
            </Link>

            {/* Shopping Bag - Blue Background */}
            <Link href="/cart" className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#03c7fe] text-black transition-transform hover:scale-105">
              <FiShoppingBag strokeWidth={2} className="text-2xl" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-black px-[6px] text-[11px] font-bold text-white shadow-sm ring-2 ring-white">
                  {count}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button className="ml-1 text-3xl text-black lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="animate-in fade-in slide-in-from-top-4 absolute left-0 top-full z-50 w-full bg-white px-6 py-10 shadow-2xl lg:hidden">
          <form className="mb-8 flex items-center gap-3 border-b border-gray-200 pb-6" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product or category..."
              className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-black placeholder:text-gray-400 outline-none"
            />
            <button type="submit" className="text-2xl text-black hover:text-[#03c7fe] transition-colors">
              <FiSearch strokeWidth={2.5} />
            </button>
          </form>
          <nav>
            <ul className="flex flex-col gap-6 text-left">
              <li>
                <Link href="/" onClick={() => setMenuOpen(false)} className="text-3xl font-extrabold text-black hover:text-[#03c7fe]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" onClick={() => setMenuOpen(false)} className="text-3xl font-extrabold text-[#03c7fe]">
                  Shop All
                </Link>
              </li>
              {navFeatured.map((item) => {
                const label = item.category?.name.charAt(0).toUpperCase() + item.category?.name.slice(1).toLowerCase();
                return (
                  <li key={item._id}>
                    <Link href={`/shop/${item.category.slug}`} onClick={() => setMenuOpen(false)} className="text-3xl font-extrabold text-black hover:text-[#03c7fe]">
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
