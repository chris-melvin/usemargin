"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  count?: number;
  total?: number;
  currency?: string;
  defaultOpen?: boolean;
  onAdd?: () => void;
  children: React.ReactNode;
  emptyMessage?: string;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  iconColor = "text-stone-500",
  count,
  total,
  currency = "PHP",
  defaultOpen = true,
  onAdd,
  children,
  emptyMessage = "No items yet",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isEmpty = count === 0;

  return (
    <Card className="border-stone-200/60 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-0">
          <CollapsibleTrigger asChild>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    iconColor.includes("emerald")
                      ? "bg-emerald-100"
                      : iconColor.includes("amber")
                      ? "bg-amber-100"
                      : iconColor.includes("rose")
                      ? "bg-rose-100"
                      : iconColor.includes("violet")
                      ? "bg-violet-100"
                      : iconColor.includes("blue")
                      ? "bg-blue-100"
                      : "bg-stone-100"
                  )}
                >
                  <Icon className={cn("w-4 h-4", iconColor)} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-900">
                      {title}
                    </span>
                    {count !== undefined && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {count}
                      </Badge>
                    )}
                  </div>
                  {total !== undefined && total > 0 && (
                    <p className="text-xs text-stone-500 tabular-nums">
                      {formatCurrency(total, currency)}/mo
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onAdd && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd();
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-stone-400 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-0 border-t border-stone-100">
            {isEmpty ? (
              <div className="p-8 text-center">
                <p className="text-sm text-stone-400">{emptyMessage}</p>
                {onAdd && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={onAdd}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add {title.toLowerCase().replace(/s$/, "")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-stone-100">{children}</div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
