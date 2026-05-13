"use client";

import React from "react";
import { motion } from "framer-motion";
import { Scale, UserCheck, ShoppingBag, CreditCard, Truck, Ban, AlertCircle, FileText } from "lucide-react";

const effectiveDate = "May 13, 2026";

const TERMS_SECTIONS = [
  {
    icon: UserCheck,
    title: "1. Eligibility and Accounts",
    content: "You are responsible for maintaining accurate account information and securing your login credentials. Activity under your account is your responsibility unless unauthorized access is reported.",
  },
  {
    icon: ShoppingBag,
    title: "2. Product Information",
    content: "We aim to keep product details accurate, but content may change based on supplier updates. Recommendations are informational and not medical advice.",
  },
  {
    icon: CreditCard,
    title: "3. Pricing and Payments",
    content: "Prices are listed in LKR and may change without prior notice. Orders are confirmed only after successful payment authorization and internal verification.",
  },
  {
    icon: Truck,
    title: "4. Shipping and Returns",
    content: "Shipping times are estimates. Return and cancellation eligibility depends on product condition, order stage, and policy constraints. Contact support for case-based handling.",
  },
  {
    icon: Ban,
    title: "5. Acceptable Use",
    content: "You may not misuse the platform, interfere with system integrity, attempt unauthorized access, or use the service for unlawful activities.",
  },
  {
    icon: AlertCircle,
    title: "6. Limitation of Liability",
    content: "To the maximum extent permitted by law, Supplement Lanka is not liable for indirect, incidental, or consequential damages arising from use of the platform or products.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-white text-[#111] antialiased">
      {/* Header Section */}
      <section className="bg-[#fafafa] border-b border-black/[0.05]">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#03c7fe]">
              <Scale size={14} />
              <span>Legal Agreement</span>
            </div>
            <h1 className="mt-6 text-5xl font-black uppercase tracking-tighter md:text-7xl">
              Terms <span className="text-black/10">of Use.</span>
            </h1>
            <p className="mt-8 flex items-center gap-4 text-sm font-bold text-[#aaa]">
              <span>EFFECTIVE: {effectiveDate}</span>
              <span className="h-1 w-1 rounded-full bg-black/10" />
              <span>V2.0</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="relative space-y-16 before:absolute before:left-4 before:top-2 before:h-[calc(100%-20px)] before:w-[1px] before:bg-black/[0.05] md:before:left-7">
          
          <div className="relative pl-12 md:pl-20">
             <p className="text-lg font-medium leading-relaxed text-[#555]">
              By accessing Supplement Lanka, you enter into a binding agreement to follow our community standards and operational guidelines. Please review these terms carefully.
            </p>
          </div>

          {TERMS_SECTIONS.map((section, index) => (
            <motion.article 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="relative pl-12 md:pl-20"
            >
              {/* Timeline Bullet */}
              <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-black/[0.08] text-[#03c7fe] shadow-sm md:h-14 md:w-14">
                <section.icon size={18} className="md:size-6" strokeWidth={1.5} />
              </div>

              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-black">
                {section.title}
              </h2>
              <p className="mt-4 text-base font-medium leading-8 text-[#7a7a7a]">
                {section.content}
              </p>
            </motion.article>
          ))}

          {/* Policy Updates - Specialized Style */}
          <article className="relative pl-12 md:pl-20">
             <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-white md:h-14 md:w-14">
                <FileText size={18} className="md:size-6" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">7. Updates to Terms</h2>
              <p className="mt-4 text-base font-medium leading-8 text-[#7a7a7a]">
                We may revise these terms as operations change. Continued use of the platform indicates acceptance of updated terms. We recommend checking this page periodically for updates.
              </p>
          </article>
        </div>

        {/* Support Callout */}
        <div className="mt-24 rounded-[32px] border border-black/[0.05] bg-[#fcfcfc] p-10 text-center">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#aaa]">Need Clarification?</h3>
          <p className="mt-4 font-bold text-black">If any part of these terms is unclear, our team is here to explain.</p>
          <div className="mt-8">
            <button className="rounded-full bg-[#111] px-10 py-4 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#03c7fe]">
              Open Support Ticket
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}