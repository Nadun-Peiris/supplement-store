"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEye, FaEyeSlash, FaLock, FaEnvelope } from "react-icons/fa";
import { ArrowRight, Loader2 } from "lucide-react"; // Import ArrowRight and Loader2
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextValue =
      new URLSearchParams(window.location.search).get("next") || "/dashboard";

    setNextPath(nextValue);
  }, []);

  useEffect(() => {
    if (!authLoading && user) router.replace(nextPath);
  }, [authLoading, nextPath, router, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      router.push(nextPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-[#cfeef7] bg-[#fbfdff] p-3 pl-10 text-sm outline-none transition-all focus:border-[#03c7fe] focus:ring-2 focus:ring-[#03c7fe]/20 placeholder:text-gray-300";
  const labelClass = "text-sm font-bold text-[#111] mb-1.5 block";

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
        
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#03c7fe] text-white shadow-[0_8px_20px_rgba(3,199,254,0.3)]">
            <FaLock size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#111]">Welcome Back</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Log in to continue your journey
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* EMAIL */}
          <div>
            <label className={labelClass}>Email Address</label>
            <div className="relative group">
              <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#03c7fe] transition-colors" size={14} />
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

          {/* PASSWORD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Password</label>
              {/* FIXED: Removed size={12} to fix TypeScript error */}
              <Link href="/forgot-password" className="text-xs font-bold text-[#03c7fe] hover:text-[#02a8d9] transition-colors">
                Forgot Password?
              </Link>
            </div>
            <div className="relative group">
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#03c7fe] transition-colors" size={14} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#03c7fe] transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#03c7fe] to-[#0099ff] py-4 text-sm font-black text-white shadow-[0_10px_25px_rgba(3,199,254,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(3,199,254,0.4)] active:scale-[0.98] disabled:opacity-50"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  {/* NEW: Lucide Arrow Icon with hover slide animation */}
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </div>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </button>
        </form>

        <div className="mt-10 text-center border-t border-gray-100 pt-8">
          <p className="text-sm font-medium text-gray-500">
            New here? 
            <Link href="/register" className="ml-2 font-black text-[#03c7fe] hover:text-[#02a8d9] transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
