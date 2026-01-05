"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/subscription";
import { PRICING_DISPLAY, SUBSCRIPTION_TIERS } from "@/lib/payments/config";
import { Check, Sparkles, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingContentProps {
  isLoggedIn: boolean;
  userEmail?: string;
}

export function PricingContent({ isLoggedIn }: PricingContentProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const pricing = PRICING_DISPLAY.pro;
  const currentPrice = billingCycle === "monthly" ? pricing.monthly : pricing.yearly;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-amber-50/30 to-stone-50">
      {/* Subtle paper texture overlay */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors mb-8 group"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>

          <h1 className="text-4xl sm:text-5xl font-semibold text-stone-900 tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-stone-600 max-w-xl mx-auto">
            Choose the plan that works for you. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="relative inline-flex items-center bg-stone-100 rounded-full p-1">
            {/* Sliding background */}
            <div
              className={cn(
                "absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out",
                billingCycle === "yearly" && "translate-x-[calc(100%+4px)]"
              )}
            />

            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors duration-200",
                billingCycle === "monthly" ? "text-stone-900" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors duration-200 flex items-center gap-2",
                billingCycle === "yearly" ? "text-stone-900" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Yearly
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                Save {pricing.yearly.savingsPercent}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="relative bg-white rounded-2xl border border-stone-200 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-stone-900 mb-2">Free</h2>
              <p className="text-stone-500 text-sm">Get started with the basics</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold text-stone-900">₱0</span>
                <span className="text-stone-500">/month</span>
              </div>
              <p className="text-sm text-stone-400 mt-1">Free forever</p>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full mb-8"
              asChild
            >
              <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                {isLoggedIn ? "Go to Dashboard" : "Get Started"}
              </Link>
            </Button>

            <div className="space-y-4">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">What&apos;s included</p>
              <ul className="space-y-3">
                {SUBSCRIPTION_TIERS.free.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="text-stone-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="relative bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                <Sparkles className="w-3 h-3" />
                Most Popular
              </div>
            </div>

            <div className="mb-6 pt-2">
              <h2 className="text-xl font-semibold text-stone-900 mb-2">Pro</h2>
              <p className="text-stone-500 text-sm">For serious budgeters</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold text-stone-900">
                  {currentPrice.formatted}
                </span>
                <span className="text-stone-500">/{currentPrice.period}</span>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-sm text-amber-600 mt-1 font-medium">
                  {pricing.yearly.monthlyEquivalent}/month · Save {pricing.yearly.savings}
                </p>
              )}
              {billingCycle === "monthly" && (
                <p className="text-sm text-stone-400 mt-1">Billed monthly</p>
              )}
            </div>

            <CheckoutButton
              billingCycle={billingCycle}
              isLoggedIn={isLoggedIn}
              size="lg"
              className="w-full mb-8 bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Zap className="w-4 h-4" />
              Upgrade to Pro
            </CheckoutButton>

            <div className="space-y-4">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Everything in Free, plus</p>
              <ul className="space-y-3">
                {SUBSCRIPTION_TIERS.pro.features.slice(1).map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-stone-700 text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm text-stone-500 mb-4">Trusted by budgeters across the Philippines</p>
          <div className="flex flex-wrap justify-center gap-6 text-stone-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              <span className="text-sm">Peso pricing</span>
            </div>
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="mt-16 text-center">
          <p className="text-stone-600">
            Have questions?{" "}
            <Link href="/contact" className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-4">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
