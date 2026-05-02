"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { clearRegisterSecrets } from "@/lib/registerDraft";

export default function RegisterIndexPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("register_step1");
    localStorage.removeItem("register_step2");
    localStorage.removeItem("register_billing");
    localStorage.removeItem("registration_complete");
    clearRegisterSecrets();

    router.replace("/register/basic-details");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2fbff]">
      <Loader2 className="h-8 w-8 animate-spin text-[#03c7fe]" />
    </div>
  );
}
