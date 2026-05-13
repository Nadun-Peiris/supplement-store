"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Clock, ChevronDown, MessageSquare, ArrowRight } from "lucide-react";

const FAQS = [
  {
    question: "How quickly are orders processed?",
    answer: "Most orders are processed within 1 business day and shipped as soon as stock is confirmed.",
  },
  {
    question: "Can I modify or cancel an order?",
    answer: "If your order has not shipped yet, contact support immediately and we will do our best to assist.",
  },
  {
    question: "Do you help with product selection?",
    answer: "Yes. You can use our AI coach for fast guidance or contact us directly for support.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-[#111] antialiased">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        
        {/* Header Section */}
        <header className="mb-16 border-b border-black/[0.05] pb-12">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#03c7fe]"
          >
            Contact Support
          </motion.p>
          <h1 className="mt-4 text-5xl font-black uppercase tracking-tight md:text-7xl">
            We are here <br /> <span className="text-black/20">to help.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-[#7a7a7a]">
            Expert guidance for your fitness journey. Reach out through our dedicated channels for professional support.
          </p>
        </header>

        {/* Contact Info Cards */}
        <section className="mb-20 grid gap-4 md:grid-cols-3">
          <ContactCard icon={Mail} label="Email" value="support@supplementlanka.com" href="mailto:support@supplementlanka.com" />
          <ContactCard icon={Phone} label="Phone" value="+94 77 123 4567" href="tel:+94771234567" />
          <ContactCard icon={Clock} label="Business Hours" value="Mon - Sat: 9AM - 6PM" />
        </section>

        {/* Bottom Section: Help & FAQ */}
        <div className="grid gap-12 lg:grid-cols-2">
          
          {/* Quick Help Card */}
          <article className="rounded-[32px] bg-[#f9f9f9] p-10 flex flex-col justify-between">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-[#03c7fe]">
                <MessageSquare size={28} />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight">AI Coach</h2>
              <p className="mt-4 text-[#7a7a7a] leading-relaxed">
                Need fast guidance for product selection? Our AI coach is available 24/7 to help you pick the right stack.
              </p>
            </div>
            
            <div className="mt-12">
              <Link
                href="/shop"
                className="group flex items-center justify-center gap-2 rounded-full bg-[#111] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-[#03c7fe]"
              >
                Launch Coach <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>

          {/* FAQ Accordion */}
          <article>
            <h2 className="mb-8 text-2xl font-black uppercase tracking-tight">Common Questions</h2>
            <div className="divide-y divide-black/[0.08]">
              {FAQS.map((faq) => (
                <FAQItem key={faq.question} {...faq} />
              ))}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

function ContactCard({ icon: Icon, label, value, href }: any) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-[#f5f5f5] p-3 text-black transition-colors group-hover:bg-[#03c7fe] group-hover:text-white">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#aaa]">{label}</p>
          {href ? (
            <a href={href} className="mt-1 block text-sm font-bold hover:text-[#03c7fe] transition-colors">{value}</a>
          ) : (
            <p className="mt-1 text-sm font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-left"
      >
        <span className="text-sm font-black uppercase tracking-wider text-[#111]">{question}</span>
        <div className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-[#03c7fe]" : "text-[#ccc]"}`}>
          <ChevronDown size={20} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 mt-2 text-sm leading-relaxed text-[#7a7a7a] font-medium">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}