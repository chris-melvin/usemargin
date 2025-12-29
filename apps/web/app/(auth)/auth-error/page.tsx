import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <XCircle className="h-8 w-8 text-rose-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-stone-900">
          Verification Failed
        </h1>
        <p className="text-sm text-stone-500">
          The confirmation link may have expired or is invalid.
          <br />
          Please try signing up again or request a new link.
        </p>
      </div>

      <div className="pt-2 space-y-3">
        <Button
          asChild
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <Link href="/signup">Try Again</Link>
        </Button>
        <div>
          <Link
            href="/login"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
