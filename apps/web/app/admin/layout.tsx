import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Map, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  // TODO: Add proper admin role check here
  // For now, all authenticated users can access admin

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white dark:bg-stone-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Admin Panel
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-48 shrink-0">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/admin/feedback"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/roadmap"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <Map className="h-4 w-4" />
                  Roadmap
                </Link>
              </li>
            </ul>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
