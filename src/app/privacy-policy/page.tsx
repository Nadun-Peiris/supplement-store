"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Eye, Share2, Lock, Scale, RefreshCw } from "lucide-react";

const effectiveDate = "May 13, 2026";

const SECTIONS = [
  {
    id: "collection",
    title: "1. Information We Collect",
    icon: Eye,
    content: "We may collect account details, billing and shipping information, order history, and support interactions. Technical information such as IP address, device details, and browser metadata may also be collected for security and performance.",
  },
  {
    id: "usage",
    title: "2. How We Use Data",
    icon: RefreshCw,
    content: "Data is used to process orders, provide customer support, improve recommendations, prevent fraud, and maintain service quality. We may also use data to comply with legal and regulatory obligations.",
  },
  {
    id: "sharing",
    title: "3. Data Sharing",
    icon: Share2,
    content: "We share data only with essential service providers such as payment processors, logistics partners, hosting providers, and analytics tools, strictly for legitimate operational purposes.",
  },
  {
    id: "security",
    title: "4. Security & Retention",
    icon: Lock,
    content: "We use reasonable technical and organizational controls to protect customer information. Data is retained only as long as needed for business, legal, and tax purposes.",
  },
  {
    id: "rights",
    title: "5. Your Rights",
    icon: Scale,
    content: "You may request access, correction, or deletion of eligible personal data, subject to legal and operational constraints. Contact support for privacy-related requests.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-[#111] antialiased">
      {/* 1. Subtle Header */}
      <div className="border-b border-black/[0.05] bg-[#fafafa]">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#03c7fe]">
              <ShieldCheck size={14} />
              <span>Trust & Safety</span>
            </div>
            <h1 className="mt-6 text-5xl font-black uppercase tracking-tight md:text-7xl">
              Privacy <span className="text-black/20">Policy.</span>
            </h1>
            <p className="mt-8 text-sm font-bold text-[#aaa]">
              LAST UPDATED: {effectiveDate}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="grid gap-16 lg:grid-cols-[200px_1fr]">
          
          {/* 2. Side Navigation (Desktop Only) */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#ccc]">Sections</p>
              <ul className="space-y-4">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a 
                      href={`#${s.id}`} 
                      className="text-xs font-bold uppercase tracking-wider text-[#7a7a7a] transition-colors hover:text-[#03c7fe]"
                    >
                      {s.title.split(".")[1]}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* 3. Content Area */}
          <div className="space-y-20">
            <section>
              <p className="text-lg font-medium leading-relaxed text-[#555]">
                At Supplement Lanka, transparency is our core value. This policy explains how we 
                handle your information with the same care we use to curate our products.
              </p>
            </section>

            {SECTIONS.map((section) => (
              <motion.article 
                key={section.id} 
                id={section.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="group scroll-mt-24"
              >
                <div className="flex items-center gap-3 border-b border-black/[0.05] pb-4">
                  <section.icon size={18} className="text-[#03c7fe]" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em]">
                    {section.title}
                  </h2>
                </div>
                <p className="mt-6 text-base font-medium leading-8 text-[#7a7a7a]">
                  {section.content}
                </p>
              </motion.article>
            ))}

            {/* 4. Contact Footer */}
            <section className="rounded-3xl bg-[#f9f9f9] p-8 md:p-12">
              <h3 className="text-xl font-black uppercase tracking-tight">Questions?</h3>
              <p className="mt-2 text-sm font-medium text-[#7a7a7a]">
                If you have concerns regarding your data, our privacy officer is ready to help.
              </p>
              <div className="mt-8">
                <a 
                  href="mailto:privacy@supplementlanka.com" 
                  className="inline-block rounded-full bg-[#111] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#03c7fe]"
                >
                  Contact Privacy Team
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}