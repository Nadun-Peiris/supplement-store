"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "@/components/styles/header.css";
import { FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
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

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featured, setFeatured] = useState<FeaturedCategory[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [headerState, setHeaderState] = useState<
    "header-topstate" | "header-scrolled"
  >("header-topstate");

  const [user, setUser] = useState<import("firebase/auth").User | null>(null);
  const { count } = useCart();

  /* --------------------------- SCROLL HEADER EFFECT --------------------------- */
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setHeaderState("header-scrolled");
      } else {
        setHeaderState("header-topstate");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* --------------------------- TRACK AUTH STATE --------------------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
  };

  /* --------------------------- LOAD FEATURED CATEGORIES --------------------------- */
  useEffect(() => {
    async function loadFeatured() {
      setFeaturedLoading(true);
      try {
        const res = await fetch(absoluteUrl("/api/featured-categories"));
        const data = await res.json();

        const sorted = (data.items || []).sort(
          (a: FeaturedCategory, b: FeaturedCategory) => a.index - b.index
        );

        setFeatured(sorted);
      } catch (err) {
        console.error("HEADER FEATURED LOAD ERROR:", err);
      } finally {
        setFeaturedLoading(false);
      }
    }

    loadFeatured();
  }, []);

  /* --------------------------- DYNAMIC HEADER STYLE --------------------------- */
  const dynamicClasses =
    headerState === "header-scrolled"
      ? "bg-black/80 border-white/10 backdrop-blur-md"
      : "bg-black border-transparent";

  const navFeatured = featured.filter(
    (item) => item.category && item.category.slug
  );
  const skeletons = Array.from({ length: 8 });

  return (
    <header
      className={`site-header sticky top-0 z-50 border-b transition-all duration-300 ease-in-out ${dynamicClasses}`}
    >
      {/* --------------------------- TOP BAR --------------------------- */}
      <div className="header-top">
        <button
          className="hamburger-btn md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <Link href="/" className="header-logo">
          <img src="/logo.png" alt="Supplement Store" />
        </Link>

        <div className="nav-right hidden md:flex">
          <Link href="/cart" className="icon-btn cart-btn">
            <FaShoppingCart />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>

          {user ? (
            <button onClick={handleLogout} className="auth-btn">
              Logout
            </button>
          ) : (
            <Link href="/login" className="auth-btn">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* --------------------------- DESKTOP NAV --------------------------- */}
      <div className="header-bottom desktop-nav">
        <nav>
          <ul>
            <li><Link href="/">HOME</Link></li>
            <li><Link href="/shop">SHOP</Link></li>
            {/* ⭐ DYNAMIC FEATURED CATEGORIES FROM ADMIN PANEL ⭐ */}
            {featuredLoading
              ? skeletons.map((_, idx) => (
                  <li key={`featured-skeleton-${idx}`}>
                    <span className="header-skeleton-pill" />
                  </li>
                ))
              : navFeatured.map((item) => {
                  const label =
                    (item.category?.name || item.category?.slug || "Category").trim() ||
                    "Category";
                  return (
                    <li key={item._id}>
                      <Link href={`/shop/${item.category.slug}`}>
                        {label.toUpperCase()}
                      </Link>
                    </li>
                  );
                })}

            <li><Link href="/about">ABOUT US</Link></li>
            <li><Link href="/contact">CONTACT US</Link></li>
          </ul>
        </nav>
      </div>

      {/* --------------------------- MOBILE MENU --------------------------- */}
      {menuOpen && (
        <div className="mobile-menu md:hidden">
          <nav>
            <ul>
              <li>
                <Link href="/" onClick={() => setMenuOpen(false)}>
                  HOME
                </Link>
              </li>

              {/* ⭐ DYNAMIC MOBILE MENU ⭐ */}
              {featuredLoading
                ? skeletons.map((_, idx) => (
                    <li key={`mobile-featured-skeleton-${idx}`}>
                      <span className="header-skeleton-pill mobile" />
                    </li>
                  ))
                : navFeatured.map((item) => {
                    const label =
                      (item.category?.name || item.category?.slug || "Category").trim() ||
                      "Category";
                    return (
                      <li key={item._id}>
                        <Link
                          href={`/shop/${item.category.slug}`}
                          onClick={() => setMenuOpen(false)}
                        >
                          {label.toUpperCase()}
                        </Link>
                      </li>
                    );
                  })}

              <li>
                <Link href="/about" onClick={() => setMenuOpen(false)}>
                  ABOUT US
                </Link>
              </li>
              <li>
                <Link href="/contact" onClick={() => setMenuOpen(false)}>
                  CONTACT US
                </Link>
              </li>

              <br />

              <li className="mobile-icons">
                <Link
                  href="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="icon-btn cart-btn"
                >
                  <FaShoppingCart />
                  {count > 0 && <span className="cart-badge">{count}</span>}
                </Link>

                {user ? (
                  <button onClick={handleLogout} className="auth-btn">
                    Logout
                  </button>
                ) : (
                  <Link href="/login" className="auth-btn">
                    Login
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
