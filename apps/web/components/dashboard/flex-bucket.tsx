"use client";

import { Wallet, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/lib/constants";

interface FlexBucketProps {
  balance: number;
}

export function FlexBucket({ balance }: FlexBucketProps) {
  return (
    <section className="bg-stone-900 text-stone-50 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        <PiggyBank className="h-20 w-20" />
      </div>
      <div className="flex items-center gap-2 mb-4 text-stone-400">
        <Wallet className="h-4 w-4" />
        <h2 className="text-xs font-bold uppercase tracking-widest">
          Flex Bucket (Extra Fund)
        </h2>
      </div>
      <div className="text-4xl font-light mb-1">
        {CURRENCY}
        {balance.toLocaleString()}
      </div>
      <p className="text-[10px] text-stone-500 mb-4">
        Autonomous pool sitting outside your daily limits.
      </p>
      <Button
        variant="outline"
        className="w-full py-2 bg-stone-800 border-stone-700 text-stone-50 rounded-xl text-xs font-medium hover:bg-stone-700 hover:text-stone-50"
      >
        + Top Up Bucket
      </Button>
    </section>
  );
}
