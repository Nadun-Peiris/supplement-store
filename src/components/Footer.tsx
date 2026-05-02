"use client";

import {
  FaInstagram,
  FaFacebookF,
  FaTiktok,
} from "react-icons/fa";

export default function Footer() {
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
        {/* Logo Divider */}
        <div className="mb-16 flex items-center gap-8">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="shrink-0 px-4">
            <img 
              src="/logo.png" 
              alt="Supplement Lanka" 
              className="h-16 w-auto opacity-100" 
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
