"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "./feedback-dialog";
import { cn } from "@/lib/utils";

interface FeedbackWidgetProps {
  className?: string;
}

export function FeedbackWidget({ className }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
          "bg-amber-500 hover:bg-amber-600 text-white",
          "transition-transform hover:scale-105 active:scale-95",
          className
        )}
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </Button>

      <FeedbackDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
