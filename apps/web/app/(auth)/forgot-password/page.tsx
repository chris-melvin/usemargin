"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const result = await forgotPassword(formData);

    if (result && !result.success) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">Check your email</h1>
          <p className="text-sm text-neutral-500">
            If an account exists with that email, we&apos;ve sent you a password reset link.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Forgot password?</h1>
        <p className="text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-neutral-700">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:ring-teal-500"
          />
        </div>

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <div className="text-center text-sm text-neutral-500">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-teal-600 hover:text-teal-700 font-medium hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
