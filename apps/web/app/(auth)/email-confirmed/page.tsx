"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailConfirmedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Email Confirmed!</h1>
        <p className="text-sm text-neutral-500">
          Your account has been verified. You&apos;re now signed in.
        </p>
      </div>

      <div className="pt-2 space-y-4">
        <p className="text-xs text-neutral-400">
          Redirecting to dashboard in {countdown}...
        </p>
        <Button
          asChild
          className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
        >
          <Link href="/dashboard">Continue to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
