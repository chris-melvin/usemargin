import { Suspense } from "react";
import { getAllFeedback, getFeedbackCounts } from "@/actions/feedback";
import { FeedbackTable } from "@/components/admin/feedback-table";

export const metadata = {
  title: "Feedback Management | Admin",
};

async function FeedbackContent() {
  const [feedbackResult, countsResult] = await Promise.all([
    getAllFeedback({ limit: 50 }),
    getFeedbackCounts(),
  ]);

  if (!feedbackResult.success) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Failed to load feedback. Please try again later.
        </p>
      </div>
    );
  }

  const counts = countsResult.success ? countsResult.data : null;

  return (
    <FeedbackTable
      initialFeedback={feedbackResult.data.feedback}
      counts={counts}
    />
  );
}

export default function AdminFeedbackPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage user feedback submissions.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-10 w-full bg-stone-200 rounded animate-pulse" />
            <div className="h-64 w-full bg-stone-100 rounded animate-pulse" />
          </div>
        }
      >
        <FeedbackContent />
      </Suspense>
    </div>
  );
}
