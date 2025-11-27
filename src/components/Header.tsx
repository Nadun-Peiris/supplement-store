"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "@/components/styles/header.css";
import { FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerState, setHeaderState] = useState<"header-topstate" | "header-scrolled">(
    "header-topstate"
  );
  const [user, setUser] = useState<import("firebase/auth").User | null>(null);
  const { count } = useCart();

  // 1. SCROLL LISTENER (Detects when to switch styles)
  useEffect(() => {
    const handleScroll = () => {
      // If scrolled more than 10px, switch to glass effect
      if (window.scrollY > 10) {
        setHeaderState("header-scrolled");
      } else {
        setHeaderState("header-topstate");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
  };

  // 2. DEFINE STYLES BASED ON STATE
  // "header-topstate" = Solid Black
  // "header-scrolled" = Glass Effect
  const dynamicClasses =
    headerState === "header-scrolled"
      ? "bg-black/80 border-white/10 backdrop-blur-md" // <-- SCROLLED STYLE
      : "bg-black border-transparent";                 // <-- TOP STYLE (Solid)

  /* NOTE ON BLUR:
     To change the blur intensity, find 'backdrop-blur-md' above.
     Options:
       - backdrop-blur-sm  (Low blur)
       - backdrop-blur-md  (Medium blur - Current)
       - backdrop-blur-lg  (High blur)
       - backdrop-blur-xl  (Very High blur)
  */

  return (
    <header
      className={`site-header sticky top-0 z-50 border-b transition-all duration-300 ease-in-out ${dynamicClasses}`}
    >
      {/* TOP BAR */}
      <div className="header-top">
        <button
          className="hamburger-btn md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <Link href="/" className="header-logo">
          <img src="/logo.png" alt="Supplement Logo" />
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

      {/* DESKTOP NAV */}
      <div className="header-bottom desktop-nav">
        <nav>
          <ul>
            <li><Link href="/">HOME</Link></li>
            <li><Link href="/protein">PROTEIN</Link></li>
            <li><Link href="/preworkout">PRE - WORKOUT</Link></li>
            <li><Link href="/mass-gainers">MASS GAINERS</Link></li>
            <li><Link href="/creatine">CREATINE</Link></li>
            <li><Link href="/fat-burners">FAT BURNERS</Link></li>
            <li><Link href="/recovery">RECOVERY</Link></li>
            <li><Link href="/vitamin">VITAMIN</Link></li>
            <li><Link href="/about">ABOUT US</Link></li>
            <li><Link href="/contact">CONTACT US</Link></li>
          </ul>
        </nav>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu md:hidden">
          <nav>
            <ul>
              <li><Link href="/" onClick={() => setMenuOpen(false)}>HOME</Link></li>
              <li><Link href="/protein" onClick={() => setMenuOpen(false)}>PROTEIN</Link></li>
              {/* ... existing links ... */}
              <li><Link href="/contact" onClick={() => setMenuOpen(false)}>CONTACT US</Link></li>

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