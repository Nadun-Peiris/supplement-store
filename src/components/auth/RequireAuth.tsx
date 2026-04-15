"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || user) return;

    const nextPath =
      typeof window === "undefined"
        ? "/dashboard"
        : `${window.location.pathname}${window.location.search}`;

    router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#fdfdfd]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#03c7fe]" />
          <p className="text-sm font-medium text-gray-400">Checking session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
