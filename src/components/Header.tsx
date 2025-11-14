"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "@/components/styles/header.css";
import { FaShoppingCart, FaUser, FaBars, FaTimes } from "react-icons/fa";
import { useCartStore } from "@/store/cartStore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<import("firebase/auth").User | null>(null);
  const cartCount = useCartStore((state) =>
    state.items.reduce((n, i) => n + i.quantity, 0)
  );

  // 🔹 Track logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      {/* ─── Top Section ─── */}
      <div className="header-top">
        {/* Hamburger Menu (Mobile) */}
        <button
          className="hamburger-btn md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Logo */}
        <Link href="/" className="header-logo">
          <img src="/logo.png" alt="Supplement Logo" />
        </Link>

        {/* Right Side Icons (Desktop only) */}
        <div className="nav-right hidden md:flex">
          <Link href="/cart" aria-label="Cart" className="icon-btn cart-btn">
            <FaShoppingCart />
            {cartCount > 0 && (
              <span
                className="cart-badge"
                aria-label={`${cartCount} items in cart`}
              >
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="auth-btn"
              aria-label="Logout"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" aria-label="Login" className="auth-btn">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* ─── Desktop Navigation ─── */}
      <div className="header-bottom desktop-nav">
        <nav className="nav-center">
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

      {/* ─── Mobile Dropdown Menu ─── */}
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

              {/* Cart & Login (Mobile only) */}
              <li className="mobile-icons">
                <Link
                  href="/cart"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Cart"
                  className="icon-btn cart-btn"
                >
                  <FaShoppingCart />
                  {cartCount > 0 && (
                    <span
                      className="cart-badge"
                      aria-label={`${cartCount} items in cart`}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
                {user ? (
                  <button
                    onClick={handleLogout}
                    aria-label="Logout"
                    className="auth-btn"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Login"
                    className="auth-btn"
                  >
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
