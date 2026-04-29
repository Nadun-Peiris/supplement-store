"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const presetEmail = new URLSearchParams(window.location.search).get("email");

    if (presetEmail) {
      setEmail(presetEmail);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, router, user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to send reset email.");
      }

      toast.success(data.message || "Password reset email sent.");
      router.push(`/login?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to send reset email.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#cfeef7] bg-[#fbfdff] p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-300 focus:border-[#03c7fe] focus:ring-2 focus:ring-[#03c7fe]/20";

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f2fbff] px-4 py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#03c7fe]" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2fbff] px-4 py-12">
      <div className="w-full max-w-[420px] rounded-[32px] border border-white bg-white/80 p-10 shadow-[0_20px_50px_rgba(3,199,254,0.1)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#03c7fe] transition-colors hover:text-[#02a8d9]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#03c7fe] text-white shadow-[0_8px_20px_rgba(3,199,254,0.3)]">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#111]">
            Reset Password
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#111]">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#03c7fe]" />
              <input
                type="email"
                placeholder="Enter your email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03c7fe] to-[#0099ff] py-4 text-sm font-black text-white shadow-[0_10px_25px_rgba(3,199,254,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(3,199,254,0.4)] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending reset link...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
