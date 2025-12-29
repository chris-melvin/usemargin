"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignUpForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    // Add redirect URL to form data
    formData.set("redirectTo", redirectTo);

    const result = await signUp(formData);

    // If we get here, there was an error (successful signup redirects)
    if (result && !result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Create an account</h1>
        <p className="text-sm text-stone-500">
          Start tracking your daily spending with useMargin
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-stone-700">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-stone-700">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            required
            minLength={6}
            autoComplete="new-password"
            className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-amber-500"
          />
          <p className="text-xs text-stone-500">Must be at least 6 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-stone-700">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            required
            minLength={6}
            autoComplete="new-password"
            className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link
          href={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

function SignUpSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2 text-center">
        <div className="h-7 bg-stone-200 rounded w-2/3 mx-auto" />
        <div className="h-4 bg-stone-100 rounded w-3/4 mx-auto" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-stone-200 rounded w-16" />
          <div className="h-10 bg-stone-100 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-stone-200 rounded w-20" />
          <div className="h-10 bg-stone-100 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-stone-200 rounded w-32" />
          <div className="h-10 bg-stone-100 rounded" />
        </div>
        <div className="h-10 bg-stone-200 rounded" />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpSkeleton />}>
      <SignUpForm />
    </Suspense>
  );
}
