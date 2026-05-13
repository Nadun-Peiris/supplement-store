"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Target, Zap, HeartPulse, ArrowUpRight } from "lucide-react";

const VALUES = [
  {
    icon: Target,
    title: "Our Mission",
    desc: "Making premium supplement shopping safer, clearer, and easier for everyone in Sri Lanka.",
  },
  {
    icon: HeartPulse,
    title: "Our Focus",
    desc: "Quality brands, grounded recommendations, and practical education for long-term wellness.",
  },
  {
    icon: ShieldCheck,
    title: "Our Promise",
    desc: "Better product clarity, fair pricing, and consistent support before and after every order.",
  },
];

const BENTO_FEATURES = [
  {
    title: "Trusted Selection",
    desc: "We prioritize active, high-quality products and provide structured details to reduce guesswork.",
    className: "md:col-span-2",
  },
  {
    title: "Guided Experience",
    desc: "Our assistant and store flow recommend with context.",
    className: "md:col-span-1",
  },
  {
    title: "Fast Fulfillment",
    desc: "From checkout to delivery, we focus on a smooth lifecycle.",
    className: "md:col-span-1",
  },
  {
    title: "Expert Support",
    desc: "We support customers with guidance, policy transparency, and responsive handling.",
    className: "md:col-span-2",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#111] antialiased">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-32">
        
        {/* 1. Hero Section: High-End Typography */}
        <section className="mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#03c7fe]">
              Since 2024
            </span>
            <h1 className="mt-6 text-6xl font-black uppercase tracking-tighter md:text-8xl">
              Supplement <br />
              <span className="text-black/10">Lanka.</span>
            </h1>
            <div className="mt-10 h-[2px] w-24 bg-[#03c7fe]" />
            <p className="mt-10 max-w-3xl text-xl font-medium leading-relaxed text-[#555] md:text-2xl">
              We help Sri Lankan athletes buy authentic supplements with absolute confidence. 
              No guesswork. Just pure, curated performance.
            </p>
          </motion.div>
        </section>

        {/* 2. Core Values: Minimalist Cards */}
        <section className="mb-32 grid gap-6 md:grid-cols-3">
          {VALUES.map((item, i) => (
            <div key={i} className="group rounded-3xl border border-black/[0.06] p-8 transition-all hover:border-[#03c7fe]/30 hover:bg-[#fcfcfc]">
              <item.icon size={28} strokeWidth={1.5} className="text-[#03c7fe]" />
              <h2 className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#aaa]">
                {item.title}
              </h2>
              <p className="mt-4 font-bold leading-relaxed text-[#111]">
                {item.desc}
              </p>
            </div>
          ))}
        </section>

        {/* 3. Why Choose Us: Bento Layout */}
        <section className="mb-32">
          <h2 className="mb-10 text-3xl font-black uppercase tracking-tight">The Difference</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {BENTO_FEATURES.map((feature, i) => (
              <div 
                key={i} 
                className={`rounded-[32px] border border-black/[0.06] bg-white p-10 transition-shadow hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.05)] ${feature.className}`}
              >
                <h3 className="text-xl font-black uppercase tracking-tight">{feature.title}</h3>
                <p className="mt-4 font-medium leading-relaxed text-[#7a7a7a]">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. CTA: Integrated Design */}
        <section className="relative overflow-hidden rounded-[40px] bg-[#111] px-8 py-16 text-center text-white">
          {/* Subtle decorative glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#03c7fe]/20 blur-[100px]" />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tight md:text-4xl">
              Ready to elevate your game?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/50">
              Browse our curated selection or talk to our coach for a tailored recommendation.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/shop"
                className="group flex items-center gap-2 rounded-full bg-[#03c7fe] px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-transform hover:scale-105"
              >
                Visit Shop <ArrowUpRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-white/20 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}