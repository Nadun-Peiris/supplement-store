"use client";

import Link from "next/link";
import {
  FaInstagram,
  FaFacebookF,
  FaTiktok,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";

export default function Footer() {
  // Refined classes - Removed Y-axis translation
  const colHeadingClass = "mb-6 text-sm font-black tracking-widest text-white uppercase border-b border-[#03c7fe]/30 pb-2 inline-block";
  const linkClass = "text-gray-400 no-underline transition-all duration-300 hover:text-[#03c7fe] hover:translate-x-1 inline-block";
  const listItemClass = "mb-3";
  
  // Updated: Removed hover:-translate-y-1, added hover:scale-105 for a "press" feel
  const socialBtnClass = "flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-white transition-all duration-300 hover:border-[#03c7fe] hover:bg-[#03c7fe] hover:text-black hover:scale-105 shadow-[0_0_15px_rgba(3,199,254,0)] hover:shadow-[0_0_20px_rgba(3,199,254,0.4)]";

  const socials = [
    { icon: <FaInstagram />, label: "Instagram", url: "https://instagram.com" },
    { icon: <FaFacebookF />, label: "Facebook", url: "https://facebook.com" },
    { icon: <FaTiktok />, label: "TikTok", url: "https://tiktok.com" }
  ];

  return (
    <footer className="relative border-t border-white/5 bg-gradient-to-b from-[#0a0a0a] to-black px-6 py-16 text-white font-sans overflow-hidden">
      {/* Background Accent Blur */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#03c7fe]/5 blur-[100px]" />
      
      <div className="relative z-10 mx-auto max-w-[85rem]">
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Branch Info */}
          <div className="flex flex-col items-center sm:items-start">
            <h4 className={colHeadingClass}>Find Us</h4>
            <div className="group flex items-start gap-4 transition-all sm:justify-start mt-2">
              <FaMapMarkerAlt className="mt-1 shrink-0 text-[#03c7fe] group-hover:scale-110 transition-transform" />
              <p className="text-gray-400 leading-relaxed text-sm">
                No 271, Thalawathugoda Road,<br />
                Sri Jayawardenepura Kotte
              </p>
            </div>
            <div className="group mt-4 flex items-center gap-4 sm:justify-start">
              <FaPhoneAlt className="shrink-0 text-[#03c7fe] transition-transform" />
              <a href="tel:+94777658483" className={linkClass}>+94 77 765 8483</a>
            </div>
            <div className="group mt-4 flex items-center gap-4 sm:justify-start">
              <FaEnvelope className="shrink-0 text-[#03c7fe] transition-transform" />
              <a href="mailto:info@supplement.com" className={linkClass}>info@supplement.com</a>
            </div>
          </div>

          {/* Shop */}
          <div className="text-center sm:text-left">
            <h4 className={colHeadingClass}>The Shop</h4>
            <ul className="space-y-2">
              <li className={listItemClass}><Link href="/new" className={linkClass}>New Arrivals</Link></li>
              <li className={listItemClass}><Link href="/best-sellers" className={linkClass}>Best Sellers</Link></li>
              <li className={listItemClass}><Link href="/categories" className={linkClass}>Categories</Link></li>
              <li className={listItemClass}><Link href="/sale" className={`${linkClass} text-[#03c7fe] font-bold`}>Flash Sales</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="text-center sm:text-left">
            <h4 className={colHeadingClass}>Support</h4>
            <ul className="space-y-2">
              <li className={listItemClass}><Link href="/about" className={linkClass}>Our Story</Link></li>
              <li className={listItemClass}><Link href="/contact" className={linkClass}>Contact Us</Link></li>
              <li className={listItemClass}><Link href="/outlets" className={linkClass}>Store Locator</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div className="text-center sm:text-left">
            <h4 className={colHeadingClass}>Company</h4>
            <ul className="space-y-2">
              <li className={listItemClass}><Link href="/policy/privacy" className={linkClass}>Privacy Policy</Link></li>
              <li className={listItemClass}><Link href="/policy/terms" className={linkClass}>Terms & Conditions</Link></li>
              <li className={listItemClass}><Link href="/policy/returns" className={linkClass}>Returns</Link></li>
              <li className={listItemClass}><Link href="/policy/shipping" className={linkClass}>Shipping Info</Link></li>
            </ul>
          </div>
        </div>

        {/* Logo Divider */}
        <div className="my-16 flex items-center gap-8">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="shrink-0 px-4">
            <img 
              src="/logo.png" 
              alt="Supplement Store" 
              className="h-16 w-auto grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700" 
            />
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="order-2 md:order-1">
            <p className="text-xs tracking-wide text-gray-500">
              © {new Date().getFullYear()} <span className="font-bold text-white tracking-tighter uppercase">Supplement Lanka PVT LTD</span>.
              <br className="sm:hidden" /> All rights reserved.
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-600">
              Dev by <span className="hover:text-white transition-colors cursor-pointer">Nadun Peiris</span>
            </p>
          </div>

          <div className="order-1 flex gap-4 md:order-2">
            {socials.map((social, idx) => (
              <a 
                key={idx} 
                href={social.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label={social.label} 
                className={socialBtnClass}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}