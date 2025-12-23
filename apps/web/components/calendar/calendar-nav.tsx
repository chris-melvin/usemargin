"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarNavProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarNav({
  currentDate,
  onPrevMonth,
  onNextMonth,
}: CalendarNavProps) {
  return (
    <div className="flex justify-between items-center p-8 border-b border-stone-100">
      <h3 className="text-xl font-light text-stone-800">
        {currentDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}
      </h3>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevMonth}
          className="rounded-full hover:bg-stone-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextMonth}
          className="rounded-full hover:bg-stone-50"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
