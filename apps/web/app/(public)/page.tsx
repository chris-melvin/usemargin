"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles } from "lucide-react";

// ============================================================================
// LEDGER CARD MOCKUP
// ============================================================================

function LedgerCard() {
  const entries = [
    { time: "8:30 AM", label: "Coffee", category: "Food", amount: 120 },
    { time: "9:15 AM", label: "Grab to office", category: "Transport", amount: 180 },
    { time: "12:45 PM", label: "Lunch — Jollibee", category: "Food", amount: 160 },
    { time: "3:20 PM", label: "Snacks", category: "Food", amount: 60 },
  ];

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 bg-stone-50/60">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
            Friday, March 7
          </p>
          <p className="font-serif text-2xl font-bold text-stone-800 tracking-tight mt-0.5">
            ₱1,240 left
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-stone-400">budget</p>
          <p className="font-mono text-base font-medium text-stone-500">₱2,000</p>
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-stone-100">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="flex items-center px-6 py-3 gap-3 animate-fade-in-up"
            style={{ animationDelay: `${0.3 + i * 0.1}s` }}
          >
            <span className="font-mono text-[11px] text-stone-400 w-14 shrink-0">
              {entry.time}
            </span>
            <span className="text-sm font-medium text-stone-800 flex-1">
              {entry.label}
            </span>
            <span className="text-[10px] text-stone-400 bg-stone-100 rounded px-2 py-0.5">
              {entry.category}
            </span>
            <span className="font-mono text-sm font-medium text-rose-500 w-16 text-right shrink-0">
              -₱{entry.amount}
            </span>
          </div>
        ))}
      </div>

      {/* Smart Input */}
      <div className="flex items-center gap-2.5 px-6 py-3.5 border-t border-stone-200 bg-stone-50/60">
        <Sparkles className="h-4 w-4 text-teal-600 shrink-0" />
        <span className="font-mono text-sm text-stone-700">snacks 60</span>
        <span className="w-0.5 h-4 bg-teal-600 rounded-sm animate-blink" />
        <span className="ml-auto font-mono text-xs font-medium text-teal-600">₱60</span>
        <div className="w-6 h-6 rounded-md bg-stone-800 flex items-center justify-center">
          <ArrowRight className="h-3 w-3 text-white -rotate-90" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TYPING DEMO
// ============================================================================

function TypingDemo() {
  const examples = [
    { text: "coffee 120 at 2pm", parsed: "₱120 · 2:00 PM" },
    { text: "grab 180 #transport", parsed: "₱180 · Transport" },
    { text: "lunch yesterday", parsed: "₱180 · Yesterday" },
  ];
  const [current, setCurrent] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const example = examples[current];
    if (!example) return;
    let i = 0;
    setTyped("");
    const interval = setInterval(() => {
      if (i < example.text.length) {
        setTyped(example.text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCurrent((prev) => (prev + 1) % examples.length);
        }, 2000);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [current]);

  const example = examples[current];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-stone-200 shadow-lg px-5 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4.5 w-4.5 text-teal-600 shrink-0" />
          <span className="font-mono text-[15px] text-stone-800 flex-1">{typed}</span>
          <span className="w-0.5 h-5 bg-teal-600 rounded-sm animate-blink" />
        </div>
        {typed.length === example?.text.length && (
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2 animate-fade-in">
            <Check className="h-3.5 w-3.5 text-teal-600" />
            <span className="text-sm text-stone-500">{example?.parsed}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FEATURES
// ============================================================================

const FEATURES = [
  {
    title: "One number daily",
    description: "Wake up knowing exactly what you can spend. No categories to manage, no spreadsheets to check.",
    highlight: "₱847",
    highlightLabel: "remaining today",
  },
  {
    title: "Type naturally",
    description: "\"coffee 120 at 2pm\" — ledgr understands time, amounts, and categories from plain text.",
    highlight: "3s",
    highlightLabel: "to log an expense",
  },
  {
    title: "Auto-rebalance",
    description: "Overspend today? Tomorrow adjusts automatically. No guilt, no manual math. Just honest numbers.",
    highlight: "₱0",
    highlightLabel: "guilt factor",
  },
];

// ============================================================================
// MAIN LANDING PAGE
// ============================================================================

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ─── Hero ─── */}
      <section className="relative px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Grid background */}
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(#E7E3DB 1px, transparent 1px),
              linear-gradient(90deg, #E7E3DB 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />
        {/* Subtle gradient wash */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[#FDFBF7]" />

        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — Copy */}
            <div>
              <h1 className="font-serif text-5xl font-bold leading-[1.08] tracking-tight text-stone-800 md:text-6xl lg:text-[68px]">
                Your daily{" "}
                <br className="hidden md:block" />
                spending,{" "}
                <br className="hidden md:block" />
                <span className="italic text-teal-700">clarified.</span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-stone-500 max-w-[420px]">
                A daily expense journal that feels like pen on paper.
                Type what you spent, see what remains. Simple as a ledger should be.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-13 bg-stone-800 hover:bg-stone-900 px-8 text-[15px] font-semibold shadow-lg rounded-xl"
                >
                  <Link href="/signup">
                    Open your ledger
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <span className="text-sm text-stone-400">
                  Free forever for personal use
                </span>
              </div>

              {/* Social proof nugget */}
              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-[#FDFBF7]"
                      style={{
                        background: [
                          "linear-gradient(135deg, #2D8B78, #1A6B5A)",
                          "linear-gradient(135deg, #D4A853, #B8903A)",
                          "linear-gradient(135deg, #8B6F5C, #6B5244)",
                          "linear-gradient(135deg, #5B8C7A, #3D7262)",
                        ][i],
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-stone-500">
                  Trusted by <span className="font-medium text-stone-700">500+</span> daily users
                </p>
              </div>
            </div>

            {/* Right — Ledger Card */}
            <div className="flex justify-center lg:justify-end">
              <LedgerCard />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Smart Input Demo ─── */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 bg-stone-50/80" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(#E7E3DB 1px, transparent 1px),
              linear-gradient(90deg, #E7E3DB 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-700 mb-3">
            Natural language input
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Just type what you spent.
          </h2>
          <p className="text-stone-500 mb-10 max-w-md mx-auto">
            ledgr parses amounts, times, dates, and categories from plain text. No forms, no dropdowns.
          </p>

          <TypingDemo />

          {/* Example chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {[
              "coffee 120",
              "grab 180 at 2pm",
              "lunch yesterday",
              "groceries 500 #food",
            ].map((ex) => (
              <span
                key={ex}
                className="inline-block font-mono text-xs bg-white border border-stone-200 text-stone-600 rounded-lg px-3 py-1.5"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="relative py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-700 mb-3">
              How it works
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-800">
              Budgeting that stays out of your way.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-stone-200 p-8 hover:border-teal-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="mb-6">
                  <span className="font-mono text-4xl font-bold text-stone-800 tracking-tight">
                    {feature.highlight}
                  </span>
                  <p className="text-[11px] text-stone-400 uppercase tracking-wider mt-1">
                    {feature.highlightLabel}
                  </p>
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-stone-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison ─── */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 bg-stone-50/80" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(#E7E3DB 1px, transparent 1px),
              linear-gradient(90deg, #E7E3DB 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-800">
              Two ways to budget.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Old way */}
            <div className="bg-stone-800 rounded-2xl p-8 text-stone-300">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 mb-4">
                The spreadsheet way
              </p>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-rose-400 mt-0.5">-</span>
                  <span>20+ categories to maintain every month</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-rose-400 mt-0.5">-</span>
                  <span>&quot;Can I afford lunch?&quot; requires mental math</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-rose-400 mt-0.5">-</span>
                  <span>One overspend = guilt spiral for the month</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-rose-400 mt-0.5">-</span>
                  <span>Abandoned by February every year</span>
                </div>
              </div>
            </div>

            {/* ledgr way */}
            <div className="bg-white rounded-2xl border border-teal-200 p-8">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 mb-4">
                The ledgr way
              </p>
              <div className="space-y-4 text-sm text-stone-700">
                <div className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                  <span>One number. Your daily answer.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                  <span>Type &quot;coffee 120&quot; and you&apos;re done</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                  <span>Overspend? Tomorrow auto-adjusts. Zero guilt.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                  <span>3 seconds to log. Built for every day.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonial + Stats ─── */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="bg-white rounded-3xl border border-stone-200 p-10 md:p-14 shadow-lg">
            <div className="text-4xl mb-6 text-stone-200 font-serif">&ldquo;</div>
            <blockquote className="font-serif text-2xl md:text-3xl font-normal text-stone-700 leading-relaxed mb-8">
              Finally, a budget that doesn&apos;t make me feel terrible.
              I just type what I spent and move on with my day.
            </blockquote>
            <footer className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600" />
              <div className="text-left">
                <p className="font-medium text-stone-800 text-sm">Early User</p>
                <p className="text-xs text-stone-400">Beta Tester, Philippines</p>
              </div>
            </footer>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-14">
            {[
              { value: "3s", label: "to log expense" },
              { value: "0", label: "guilt factor" },
              { value: "100%", label: "free to start" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="font-mono text-3xl md:text-4xl font-bold text-stone-800">
                  {stat.value}
                </p>
                <p className="text-sm text-stone-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 bg-stone-800" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-4">
            Start your first day.
          </h2>
          <p className="text-lg text-stone-400 mb-8 max-w-md mx-auto">
            Know what you can spend in under 2 minutes.
          </p>

          <Button
            asChild
            size="lg"
            className="h-14 bg-teal-600 hover:bg-teal-700 px-10 text-base font-semibold shadow-lg rounded-xl"
          >
            <Link href="/signup">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <p className="mt-6 text-sm text-stone-500">
            No credit card required. Free forever for core features.
          </p>
        </div>
      </section>
    </div>
  );
}
