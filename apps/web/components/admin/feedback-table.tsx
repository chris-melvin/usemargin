"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bug,
  Lightbulb,
  Sparkles,
  HelpCircle,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  Check,
  X,
  Eye,
} from "lucide-react";
import type { Feedback, FeedbackStatus, FeedbackType } from "@repo/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  updateFeedbackStatus,
  deleteFeedback,
  convertFeedbackToRoadmap,
} from "@/actions/feedback";
import { cn } from "@/lib/utils";

interface FeedbackTableProps {
  initialFeedback: Feedback[];
  counts: Record<FeedbackStatus, number> | null;
}

const typeIcons = {
  bug: Bug,
  feature: Lightbulb,
  improvement: Sparkles,
  other: HelpCircle,
} as const;

const statusColors: Record<FeedbackStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  reviewed: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  converted: "bg-purple-100 text-purple-700",
};

export function FeedbackTable({ initialFeedback, counts }: FeedbackTableProps) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");

  const filteredFeedback =
    filter === "all"
      ? feedback
      : feedback.filter((f) => f.status === filter);

  const handleStatusChange = (id: string, status: FeedbackStatus) => {
    startTransition(async () => {
      const result = await updateFeedbackStatus({ id, status });
      if (result.success) {
        setFeedback((prev) =>
          prev.map((f) => (f.id === id ? result.data : f))
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    startTransition(async () => {
      const result = await deleteFeedback(id);
      if (result.success) {
        setFeedback((prev) => prev.filter((f) => f.id !== id));
      }
    });
  };

  const handleConvert = (item: Feedback) => {
    setSelectedFeedback(item);
    setShowConvertDialog(true);
  };

  const handleConvertSubmit = () => {
    if (!selectedFeedback) return;

    startTransition(async () => {
      const result = await convertFeedbackToRoadmap({
        feedback_id: selectedFeedback.id,
        title: selectedFeedback.title,
        description: selectedFeedback.description,
        category:
          selectedFeedback.type === "feature" ? "Features" : "Improvements",
      });

      if (result.success) {
        setFeedback((prev) =>
          prev.map((f) =>
            f.id === selectedFeedback.id ? result.data.feedback : f
          )
        );
        setShowConvertDialog(false);
        setSelectedFeedback(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Counts */}
      {counts && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({feedback.length})
          </Button>
          {(Object.entries(counts) as [FeedbackStatus, number][]).map(
            ([status, count]) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </Button>
            )
          )}
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-3">
        {filteredFeedback.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No feedback found.</p>
          </Card>
        ) : (
          filteredFeedback.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
                    <Icon className="h-5 w-5 text-stone-600 dark:text-stone-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {item.title}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          statusColors[item.status]
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {item.user_email && <span>{item.user_email}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {item.status === "new" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleStatusChange(item.id, "reviewed")}
                          disabled={isPending}
                          title="Mark as Reviewed"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleStatusChange(item.id, "accepted")}
                          disabled={isPending}
                          title="Accept"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleStatusChange(item.id, "rejected")}
                          disabled={isPending}
                          title="Reject"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}

                    {(item.status === "accepted" ||
                      item.status === "reviewed") && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleConvert(item)}
                        disabled={isPending}
                        title="Convert to Roadmap"
                      >
                        <ArrowRight className="h-4 w-4 text-purple-600" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Convert Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Roadmap Item</DialogTitle>
            <DialogDescription>
              This will create a new roadmap item and mark this feedback as
              converted.
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Title</p>
                <p className="text-sm text-muted-foreground">
                  {selectedFeedback.title}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">
                  {selectedFeedback.description}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConvertDialog(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button onClick={handleConvertSubmit} disabled={isPending}>
                  {isPending ? "Converting..." : "Convert to Roadmap"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
