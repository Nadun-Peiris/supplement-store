"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sanitizeNextPath } from "@/lib/navigation";

function SessionGateSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-[#fdfdfd]">
      <div className="hidden w-[260px] flex-shrink-0 border-r border-gray-100 bg-white p-6 lg:flex">
        <div className="flex w-full flex-col">
          <div className="mb-8 h-3 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className={`h-12 animate-pulse rounded-xl ${
                  idx === 0 ? "bg-[#c9f4ff]" : "bg-gray-100"
                }`}
              />
            ))}
          </div>
          <div className="mt-auto h-12 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>

      <div className="flex-1">
        <div className="mx-auto w-full max-w-[100rem] px-4 py-8 pb-32 md:px-10 lg:px-12 lg:pb-12">
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="h-10 w-56 animate-pulse rounded-full bg-gray-200" />
              <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-gray-100" />
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
                    <div className="mt-3 h-7 w-16 animate-pulse rounded-full bg-gray-200" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
                  <div className="mt-3 h-8 w-16 animate-pulse rounded-full bg-gray-200" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="h-5 w-40 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((__, itemIdx) => (
                    <div key={itemIdx} className="rounded-2xl border border-gray-100 p-4">
                      <div className="h-4 w-28 animate-pulse rounded-full bg-gray-200" />
                      <div className="mt-3 h-3 w-40 animate-pulse rounded-full bg-gray-100" />
                      <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-gray-100" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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

    router.replace(
      `/login?next=${encodeURIComponent(sanitizeNextPath(nextPath))}`
    );
  }, [loading, router, user]);

  if (loading || !user) {
    return <SessionGateSkeleton />;
  }

  return <>{children}</>;
}
