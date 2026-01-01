"use client";

import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getDaysUntilDue,
  getDueUrgency,
  formatDueText,
  getUrgencyColors,
  type DueUrgency,
} from "@/lib/utils/bill-due";

interface DueBadgeProps {
  dueDate: number | null;
  status: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function DueBadge({
  dueDate,
  status,
  size = "sm",
  showIcon = true,
  className,
}: DueBadgeProps) {
  const daysUntil = getDaysUntilDue(dueDate);
  const urgency = getDueUrgency(daysUntil, status);
  const text = formatDueText(daysUntil, status);
  const colors = getUrgencyColors(urgency);

  // Paid status - show green checkmark
  if (status === "paid") {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-emerald-100 text-emerald-700 border-0",
          size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
          className
        )}
      >
        {showIcon && (
          <CheckCircle
            className={cn("mr-1", size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")}
          />
        )}
        Paid
      </Badge>
    );
  }

  // No text to display
  if (!text) return null;

  const IconComponent = urgency === "overdue" ? AlertTriangle : Clock;

  return (
    <Badge
      variant="secondary"
      className={cn(
        colors.bg,
        colors.text,
        "border-0",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        className
      )}
    >
      {showIcon && (
        <IconComponent
          className={cn(
            colors.icon,
            "mr-1",
            size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"
          )}
        />
      )}
      {text}
    </Badge>
  );
}
