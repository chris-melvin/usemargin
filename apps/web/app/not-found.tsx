import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fafaf9] px-4 text-center">
      <p className="text-6xl font-serif text-stone-300 mb-4">404</p>
      <h1 className="text-xl font-semibold text-stone-900 mb-2">
        Page not found
      </h1>
      <p className="text-stone-500 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
