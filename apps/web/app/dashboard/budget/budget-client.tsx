"use client";

import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";

export function BudgetClient() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="sticky top-0 z-20 h-14 px-4 flex items-center justify-between border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-600" />
            <h1 className="text-lg font-semibold text-stone-900">Budget</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-lg font-semibold text-stone-800 mb-2">Budget page coming soon</h2>
        <p className="text-stone-500 text-sm mb-6">
          We&apos;re simplifying the budget experience. Stay tuned.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </main>
    </div>
  );
}
