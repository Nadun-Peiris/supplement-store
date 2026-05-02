"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import { PartyPopper, ArrowRight, Loader2 } from "lucide-react";

type LottiePayload = Record<string, unknown>;

export default function SuccessPage() {
  const router = useRouter();
  const [animationData, setAnimationData] = useState<LottiePayload | null>(null);
  const [isAuthorized] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("registration_complete") === "1"
  );

  useEffect(() => {
    if (!isAuthorized) {
      router.replace("/register");
    }
  }, [isAuthorized, router]);

  useEffect(() => {
    fetch("/lottie/success.json")
      .then((res) => res.json())
      .then((data: LottiePayload) => setAnimationData(data))
      .catch((err) => console.error("Failed to load success animation", err));
  }, []);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2fbff]">
        <Loader2 className="h-8 w-8 animate-spin text-[#03c7fe]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2fbff] px-4 py-12">
      <div className="group w-full max-w-[440px] rounded-[24px] border border-[#e6faff] bg-white p-10 text-center shadow-xl animate-in fade-in zoom-in duration-500">
        
        {/* LOTTIE ANIMATION / ICON FALLBACK */}
        <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center">
          {animationData ? (
            <Lottie animationData={animationData} loop={false} className="h-full w-full" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-500">
              <PartyPopper size={48} />
            </div>
          )}
        </div>

        {/* TITLES */}
        <div className="space-y-3">
          <h2 className="text-3xl font-black tracking-tight text-[#111]">
            Registration Successful!
          </h2>
          <p className="text-base font-medium text-gray-600">
            Welcome to the community! Your account has been created and your profile is ready.
          </p>
        </div>

        {/* INFO BOX */}
        <div className="mt-8 rounded-2xl bg-[#f8f8f8] p-4 text-sm font-semibold text-gray-400 border border-gray-100">
          Tip: You can now update your fitness goals and track your progress in the dashboard.
        </div>

        {/* ACTION BUTTON */}
        <button
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#262626] py-4 text-base font-bold text-white transition-all hover:bg-[#111] hover:shadow-2xl active:scale-[0.98] group-hover:bg-[#111]"
          onClick={() => {
            // Clean up the registration flag so they can't "back" into this page later
            localStorage.removeItem("registration_complete");
            router.push("/dashboard");
          }}
        >
          Go to Dashboard
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </button>

        <p className="mt-6 text-xs font-medium text-gray-400">
          Need help? <span className="text-[#03c7fe] cursor-pointer hover:underline">Contact Support</span>
        </p>

      </div>
    </div>
  );
}
