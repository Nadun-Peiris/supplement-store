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
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  const { count } = useCart(); // live cart count

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // SCROLL BEHAVIOUR → solid at top + blur after scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
  };

  return (
    <header className={`site-header ${scrolled ? "header-scrolled" : "header-topstate"}`}>
      {/* TOP ROW */}
      <div className="header-top">

        {/* MOBILE MENU BUTTON */}
        <button
          className="hamburger-btn md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* LOGO */}
        <Link href="/" className="header-logo">
          <img src="/logo.png" alt="Supplement Logo" />
        </Link>

        {/* DESKTOP RIGHT ICONS */}
        <div className="nav-right hidden md:flex">
          {/* CART */}
          <Link href="/cart" className="icon-btn cart-btn" aria-label="Cart">
            <FaShoppingCart />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>

          {/* AUTH */}
          {user ? (
            <button className="auth-btn" onClick={handleLogout}>Logout</button>
          ) : (
            <Link href="/login" className="auth-btn">Login</Link>
          )}
        </div>
      </div>

      {/* DESKTOP NAV */}
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

              {/* MOBILE ICON ROW */}
              <li className="mobile-icons">
                <Link href="/cart" className="icon-btn cart-btn" onClick={() => setMenuOpen(false)}>
                  <FaShoppingCart />
                  {count > 0 && <span className="cart-badge">{count}</span>}
                </Link>

                {user ? (
                  <button onClick={handleLogout} className="auth-btn">Logout</button>
                ) : (
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="auth-btn">Login</Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
