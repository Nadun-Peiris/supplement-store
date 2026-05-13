import Link from "next/link";
import { FiArrowRight, FiShield, FiTarget, FiZap } from "react-icons/fi";
import OpenChatButton from "@/components/Chatbot/OpenChatButton";

const guidedPrompts = [
  {
    label: "Build a muscle gain stack",
    prompt:
      "Help me build a muscle gain supplement stack. Ask me the right questions first.",
  },
  {
    label: "Find a whey under my budget",
    prompt:
      "I need a whey protein recommendation under my budget. Ask me the key questions first.",
  },
  {
    label: "Safer options for recovery",
    prompt:
      "I want recovery supplements with fewer stimulants. Ask me the right questions first.",
  },
];

export default function AIConciergeSpotlight() {
  return (
    <section className="px-4 pb-8 md:px-6 xl:px-16">
      <div className="mx-auto grid max-w-[110rem] gap-6 rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(3,199,254,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(10,10,10,0.2),transparent_35%),linear-gradient(135deg,#05080b,#0f161c_48%,#071117)] p-6 text-white shadow-[0_20px_70px_rgba(0,0,0,0.3)] md:p-8 xl:grid-cols-[1.15fr_0.85fr] xl:p-10">
        <div className="flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#1e4352] bg-[#09141b]/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#7bdcff]">
              <FiZap className="text-sm" />
              Main Highlight
            </div>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-black uppercase leading-[0.92] md:text-5xl xl:text-6xl">
                Put the <span className="text-[#7bdcff]">Supplement Coach</span>{" "}
                at the center of the shopping journey
              </h2>
              <p className="max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                The assistant now pushes users through sharper qualifying
                questions, stays grounded in in-stock catalog data, and gives
                cleaner reasons for every recommendation instead of vague AI
                filler.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <OpenChatButton
              label="Open the Coach"
              className="inline-flex items-center justify-center rounded-full bg-[#03c7fe] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#041018] transition-transform hover:scale-[1.02]"
            />
            <OpenChatButton
              label="Build My Stack"
              prompt="I want help choosing the right supplement stack. Ask me the important questions first."
              autoSend
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#7bdcff] hover:text-[#7bdcff]"
            />
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-black/30 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white/82 transition-colors hover:border-white/30 hover:text-white"
            >
              Browse Products
              <FiArrowRight />
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 rounded-[28px] border border-white/10 bg-black/25 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#08151c] text-[#7bdcff]">
                <FiTarget />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
                  Better qualification
                </p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Budget, goals, restrictions, stimulant tolerance, and profile
                  context are pushed earlier so the coach recommends with more
                  intent.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#08151c] text-[#7bdcff]">
                <FiShield />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
                  Grounded answers
                </p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Recommendations are limited to real in-stock products, with
                  softer guardrails for sensitive cases and older users.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#174555] bg-[#071118]/90 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7bdcff]">
              Quick Launches
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {guidedPrompts.map((item) => (
                <OpenChatButton
                  key={item.label}
                  label={item.label}
                  prompt={item.prompt}
                  autoSend
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-white/88 transition-colors hover:border-[#7bdcff] hover:text-[#7bdcff]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
