"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

type SlideInput = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  bgImage: string;
  productImage: string; // Changed from array to single string
  accentColor: string;
  href: string;
};

const slides: SlideInput[] = [
  {
    id: 1,
    title: "EMPOWER",
    subtitle: "YOUR JOURNEY",
    description: "Hardcore mass gainer perfect for bodybuilders looking to pack on serious size and strength.",
    bgImage: "/banners/banner1.png",
    productImage: "/banners/products/recovery.png", 
    accentColor: "text-orange-500",
    href: "/shop/mass-gainer",
  },
  {
    id: 2,
    title: "RECHARGE",
    subtitle: "PERFORMANCE",
    description: "Optimize your recovery window with pharmaceutical grade amino acids and electrolytes.",
    bgImage: "/banners/banner2.png",
    productImage: "/banners/products/recovery.png",
    accentColor: "text-[#03c7fe]",
    href: "/shop/recovery",
  },
  {
    id: 3,
    title: "IGNITE",
    subtitle: "THE FOCUS",
    description: "Experience skin-splitting pumps and laser-like mental clarity for your most intense sessions.",
    bgImage: "/banners/banner3.png",
    productImage: "/banners/products/recovery.png",
    accentColor: "text-green-400",
    href: "/shop/pre-workout",
  },
];

export default function HeroSlider({
  autoPlayMs = 6000,
  className = "",
}: {
  autoPlayMs?: number;
  className?: string;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, autoPlayMs);
    return () => window.clearInterval(timer);
  }, [autoPlayMs]);

  const currentSlide = slides[current];

  return (
    <div
      className={`w-full overflow-hidden px-4 py-8 md:px-6 md:py-10 xl:px-16 xl:py-16 ${className}`.trim()}
    >
      <div className="relative mx-auto h-[600px] w-full max-w-[110rem] overflow-hidden rounded-[40px] bg-black text-white shadow-2xl md:h-[750px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative h-full w-full"
          >
            {/* Background */}
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${currentSlide.bgImage})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent" />
            </motion.div>

            {/* Content Container */}
            <div className="relative z-10 flex h-full items-center px-12 md:px-20 lg:px-32">
              <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2">
                
                {/* Left: Text Content */}
                <motion.div
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="flex flex-col space-y-6"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400">
                    Premium Supplements
                  </span>
                  <h1 className="text-6xl font-black italic leading-[0.85] md:text-8xl xl:text-9xl">
                    <span className={currentSlide.accentColor}>{currentSlide.title}</span>
                    <br />
                    {currentSlide.subtitle}
                  </h1>
                  <p className="max-w-md text-base font-medium leading-relaxed text-gray-300 md:text-lg">
                    {currentSlide.description}
                  </p>
                  <div className="pt-6">
                    <Link
                      href={currentSlide.href}
                      className="inline-block rounded-full bg-white px-12 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gray-200 hover:scale-105"
                    >
                      Shop Now
                    </Link>
                  </div>
                </motion.div>

                {/* Right: Single Floating Product */}
                <div className="relative hidden items-center justify-center lg:flex lg:justify-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="relative"
                  >
                    <motion.img
                      key={`${currentSlide.id}-img`}
                      src={currentSlide.productImage}
                      alt={currentSlide.title}
                      animate={{ 
                        y: [0, -25, 0],
                        rotate: [0, 2, 0] // Subtle rotation for a "natural" float
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="h-[32rem] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)] xl:h-[38rem]"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar Indicators */}
        <div className="absolute bottom-12 left-12 flex space-x-3 md:left-20 lg:left-32">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className="group relative h-1 w-12 overflow-hidden rounded-full bg-white/20"
            >
              <div 
                className={`absolute inset-0 h-full bg-white transition-all duration-500 ${
                  current === index ? "translate-x-0" : "-translate-x-full"
                }`} 
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
