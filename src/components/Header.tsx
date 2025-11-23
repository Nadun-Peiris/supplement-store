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

  const { count, refreshCart } = useCart();

  // Track Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
  };

  return (
    <header className={`site-header ${headerState}`}>
      {/* TOP BAR */}
      <div className="header-top">

        {/* Mobile Hamburger */}
        <button
          className="hamburger-btn md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Logo */}
        <Link href="/" className="header-logo">
          <img src="/logo.png" alt="Supplement Logo" />
        </Link>

        {/* RIGHT ICONS (Desktop Only) */}
        <div className="nav-right hidden md:flex">

          {/* CART ICON */}
          <Link href="/cart" className="icon-btn cart-btn">
            <FaShoppingCart />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>

          {/* AUTH */}
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
              <li><Link href="/preworkout" onClick={() => setMenuOpen(false)}>PRE - WORKOUT</Link></li>
              <li><Link href="/mass-gainers" onClick={() => setMenuOpen(false)}>MASS GAINERS</Link></li>
              <li><Link href="/creatine" onClick={() => setMenuOpen(false)}>CREATINE</Link></li>
              <li><Link href="/fat-burners" onClick={() => setMenuOpen(false)}>FAT BURNERS</Link></li>
              <li><Link href="/recovery" onClick={() => setMenuOpen(false)}>RECOVERY</Link></li>
              <li><Link href="/vitamin" onClick={() => setMenuOpen(false)}>VITAMIN</Link></li>
              <li><Link href="/about" onClick={() => setMenuOpen(false)}>ABOUT US</Link></li>
              <li><Link href="/contact" onClick={() => setMenuOpen(false)}>CONTACT US</Link></li>

              <br />

              {/* MOBILE CART + LOGIN */}
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
