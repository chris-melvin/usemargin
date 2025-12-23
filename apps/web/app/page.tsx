import { Calendar, Wallet, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-margin-bg)] flex flex-col items-center justify-center p-8">
      <main className="max-w-2xl text-center">
        <h1 className="text-4xl font-light tracking-tight text-stone-900 mb-4">
          usemargin
        </h1>
        <p className="text-stone-500 text-lg mb-12">
          Your daily spending companion. Built for freedom, not restriction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <Calendar className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <h3 className="font-medium text-stone-800 mb-1">Calendar-First</h3>
            <p className="text-sm text-stone-500">
              See your spending day by day
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <Wallet className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <h3 className="font-medium text-stone-800 mb-1">Flex Bucket</h3>
            <p className="text-sm text-stone-500">
              Reserve funds for special days
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <Zap className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <h3 className="font-medium text-stone-800 mb-1">Auto-Rebalance</h3>
            <p className="text-sm text-stone-500">
              One bad day won't break your month
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-400 uppercase tracking-widest">
          Ready to build
        </p>
      </main>
    </div>
  );
}
