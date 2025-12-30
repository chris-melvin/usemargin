"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, Check, MoreHorizontal, Pencil, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BentoCard, BentoCardEmpty } from "./bento-card";
import { IncomeForm } from "./income-form";
import { formatCurrency, cn } from "@/lib/utils";
import { markIncomeReceived, resetIncomeStatus, deleteIncome } from "@/actions/income";
import type { Income } from "@repo/database";

const MAX_VISIBLE_ITEMS = 4;

interface IncomeSectionProps {
  incomes: Income[];
  currency: string;
  onUpdate: () => void;
}

export function IncomeSection({ incomes, currency, onUpdate }: IncomeSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = incomes.reduce((sum, i) => sum + i.amount, 0);
  const visibleIncomes = incomes.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = incomes.length > MAX_VISIBLE_ITEMS;

  const handleMarkReceived = (income: Income) => {
    startTransition(async () => {
      const result = await markIncomeReceived(income.id);
      if (result.success) {
        toast.success(`${income.label} marked as received`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update income");
      }
    });
  };

  const handleResetStatus = (income: Income) => {
    startTransition(async () => {
      const result = await resetIncomeStatus(income.id);
      if (result.success) {
        toast.success(`${income.label} status reset`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reset status");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteIncome(deleteId);
      if (result.success) {
        toast.success("Income deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete income");
      }
      setDeleteId(null);
    });
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingIncome(null);
  };

  return (
    <>
      <BentoCard
        title="Income"
        icon={Banknote}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-100"
        total={total}
        currency={currency}
        count={incomes.length}
        onAdd={() => setIsFormOpen(true)}
        onViewAll={() => setIsSheetOpen(true)}
        showViewAll={hasMore}
      >
        {incomes.length === 0 ? (
          <BentoCardEmpty
            message="No income sources yet"
            actionLabel="Add income"
            onAction={() => setIsFormOpen(true)}
          />
        ) : (
          <div className="space-y-1">
            {visibleIncomes.map((income) => (
              <IncomeCardCompact
                key={income.id}
                income={income}
                currency={currency}
                isPending={isPending}
                onMarkReceived={() => handleMarkReceived(income)}
                onResetStatus={() => handleResetStatus(income)}
                onEdit={() => handleEdit(income)}
                onDelete={() => setDeleteId(income.id)}
              />
            ))}
          </div>
        )}
      </BentoCard>

      {/* View All Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              All Income Sources
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {incomes.map((income) => (
              <IncomeCardFull
                key={income.id}
                income={income}
                currency={currency}
                isPending={isPending}
                onMarkReceived={() => handleMarkReceived(income)}
                onResetStatus={() => handleResetStatus(income)}
                onEdit={() => handleEdit(income)}
                onDelete={() => setDeleteId(income.id)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Form Dialog */}
      <IncomeForm
        open={isFormOpen}
        onClose={handleFormClose}
        income={editingIncome}
        currency={currency}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income source? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Compact card for bento grid (shows less info)
function IncomeCardCompact({
  income,
  currency,
  isPending,
  onMarkReceived,
  onResetStatus,
  onEdit,
  onDelete,
}: {
  income: Income;
  currency: string;
  isPending: boolean;
  onMarkReceived: () => void;
  onResetStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isReceived = income.status === "received";

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-2 rounded-lg hover:bg-stone-50 transition-colors group",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          isReceived ? "bg-emerald-500" : "bg-stone-300"
        )} />
        <span className="text-sm text-stone-700 truncate">{income.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-emerald-600 tabular-nums">
          +{formatCurrency(income.amount, currency)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isReceived ? (
              <DropdownMenuItem onClick={onResetStatus}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Mark as Expected
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onMarkReceived}>
                <Check className="w-4 h-4 mr-2" />
                Mark as Received
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Full card for sheet view (shows more info)
function IncomeCardFull({
  income,
  currency,
  isPending,
  onMarkReceived,
  onResetStatus,
  onEdit,
  onDelete,
}: {
  income: Income;
  currency: string;
  isPending: boolean;
  onMarkReceived: () => void;
  onResetStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isReceived = income.status === "received";

  const frequencyLabel = {
    weekly: "/wk",
    biweekly: "/2wk",
    monthly: "/mo",
    quarterly: "/qtr",
    yearly: "/yr",
    once: "",
  }[income.frequency];

  return (
    <div
      className={cn(
        "p-3 rounded-xl border border-stone-200 hover:border-emerald-200 transition-colors",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xl">💰</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-stone-900 truncate">
                {income.label}
              </p>
              <Badge
                variant={isReceived ? "default" : "secondary"}
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  isReceived && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {isReceived ? "Received" : "Expected"}
              </Badge>
            </div>
            <p className="text-xs text-stone-500">
              {income.day_of_month && `Day ${income.day_of_month}`}
              {income.frequency !== "once" && ` • ${income.frequency}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-emerald-600 tabular-nums">
            +{formatCurrency(income.amount, currency)}
            <span className="text-xs font-normal text-stone-400">{frequencyLabel}</span>
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isReceived ? (
                <DropdownMenuItem onClick={onResetStatus}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Mark as Expected
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onMarkReceived}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Received
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-rose-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
