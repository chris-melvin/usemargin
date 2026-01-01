import Link from "next/link";
import { Mail } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <Mail className="h-8 w-8 text-amber-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Check your email</h1>
        <p className="text-sm text-neutral-500">
          We&apos;ve sent a confirmation link to your email address.
          <br />
          Click the link to verify your account.
        </p>
      </div>

      <div className="pt-2 space-y-3">
        <p className="text-xs text-neutral-400">
          Didn&apos;t receive the email? Check your spam folder.
        </p>
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
