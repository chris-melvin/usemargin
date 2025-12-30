"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Calendar, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { BillForm } from "./bill-form";
import { formatCurrency, cn } from "@/lib/utils";
import { deleteBill } from "@/actions/bills";
import type { Debt } from "@repo/database";

const MAX_VISIBLE_ITEMS = 3;

// ============================================
// SUBSCRIPTIONS SECTION
// ============================================

interface SubscriptionsSectionProps {
  subscriptions: Debt[];
  currency: string;
  onUpdate: () => void;
}

export function SubscriptionsSection({
  subscriptions,
  currency,
  onUpdate,
}: SubscriptionsSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Debt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const visibleItems = subscriptions.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = subscriptions.length > MAX_VISIBLE_ITEMS;

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteBill(deleteId);
      if (result.success) {
        toast.success("Subscription deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
      setDeleteId(null);
    });
  };

  const handleEdit = (item: Debt) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  return (
    <>
      <BentoCard
        title="Subscriptions"
        icon={RefreshCw}
        iconColor="text-violet-600"
        iconBg="bg-violet-100"
        total={total}
        currency={currency}
        count={subscriptions.length}
        onAdd={() => setIsFormOpen(true)}
        onViewAll={() => setIsSheetOpen(true)}
        showViewAll={hasMore}
      >
        {subscriptions.length === 0 ? (
          <BentoCardEmpty
            message="No subscriptions yet"
            actionLabel="Add subscription"
            onAction={() => setIsFormOpen(true)}
          />
        ) : (
          <div className="space-y-1">
            {visibleItems.map((sub) => (
              <SubscriptionCardCompact
                key={sub.id}
                item={sub}
                currency={currency}
                isPending={isPending}
                onEdit={() => handleEdit(sub)}
                onDelete={() => setDeleteId(sub.id)}
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
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-violet-600" />
              </div>
              All Subscriptions
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <SubscriptionCardFull
                key={sub.id}
                item={sub}
                currency={currency}
                isPending={isPending}
                onEdit={() => handleEdit(sub)}
                onDelete={() => setDeleteId(sub.id)}
              />
            ))}
          </div>

          {/* Total Summary */}
          {subscriptions.length > 0 && (
            <div className="mt-4 p-3 bg-violet-50/50 rounded-xl border border-violet-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-violet-600 font-medium">
                  Total Monthly
                </span>
                <span className="text-lg font-bold text-violet-600 tabular-nums">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Form */}
      <BillForm
        open={isFormOpen}
        onClose={handleFormClose}
        bill={editingItem}
        currency={currency}
        isDebt={false}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscription? This action cannot be
              undone.
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

// Compact card for bento grid
function SubscriptionCardCompact({
  item,
  currency,
  isPending,
  onEdit,
  onDelete,
}: {
  item: Debt;
  currency: string;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const frequencyLabel = {
    weekly: "/wk",
    biweekly: "/2wk",
    monthly: "/mo",
    yearly: "/yr",
    once: "",
  }[item.frequency];

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-2 rounded-lg hover:bg-stone-50 transition-colors group",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm">{item.icon || "🔄"}</span>
        <span className="text-sm text-stone-700 truncate">{item.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-violet-600 tabular-nums">
          -{formatCurrency(item.amount, currency)}
          <span className="text-[10px] text-stone-400">{frequencyLabel}</span>
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
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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

// Full card for sheet view
function SubscriptionCardFull({
  item,
  currency,
  isPending,
  onEdit,
  onDelete,
}: {
  item: Debt;
  currency: string;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const frequencyLabel = {
    weekly: "/wk",
    biweekly: "/2wk",
    monthly: "/mo",
    yearly: "/yr",
    once: "",
  }[item.frequency];

  return (
    <div
      className={cn(
        "p-3 rounded-xl border border-stone-200 hover:border-violet-200 transition-colors",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xl">{item.icon || "🔄"}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">
              {item.label}
            </p>
            {item.due_date && (
              <p className="text-xs text-stone-500">
                Renews {item.due_date}{getOrdinalSuffix(item.due_date)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-violet-600 tabular-nums">
            -{formatCurrency(item.amount, currency)}
            <span className="text-xs font-normal text-stone-400">{frequencyLabel}</span>
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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

// ============================================
// PLANNED EXPENSES SECTION
// ============================================

interface PlannedExpensesSectionProps {
  expenses: Debt[];
  currency: string;
  onUpdate: () => void;
}

export function PlannedExpensesSection({
  expenses,
  currency,
  onUpdate,
}: PlannedExpensesSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Debt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const visibleItems = expenses.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = expenses.length > MAX_VISIBLE_ITEMS;

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteBill(deleteId);
      if (result.success) {
        toast.success("Planned expense deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
      setDeleteId(null);
    });
  };

  const handleEdit = (item: Debt) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  return (
    <>
      <BentoCard
        title="Planned Expenses"
        icon={Calendar}
        iconColor="text-blue-600"
        iconBg="bg-blue-100"
        total={total}
        currency={currency}
        count={expenses.length}
        onAdd={() => setIsFormOpen(true)}
        onViewAll={() => setIsSheetOpen(true)}
        showViewAll={hasMore}
      >
        {expenses.length === 0 ? (
          <BentoCardEmpty
            message="No planned expenses"
            actionLabel="Add planned expense"
            onAction={() => setIsFormOpen(true)}
          />
        ) : (
          <div className="space-y-1">
            {visibleItems.map((expense) => (
              <PlannedCardCompact
                key={expense.id}
                item={expense}
                currency={currency}
                isPending={isPending}
                onEdit={() => handleEdit(expense)}
                onDelete={() => setDeleteId(expense.id)}
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
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              All Planned Expenses
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {expenses.map((expense) => (
              <PlannedCardFull
                key={expense.id}
                item={expense}
                currency={currency}
                isPending={isPending}
                onEdit={() => handleEdit(expense)}
                onDelete={() => setDeleteId(expense.id)}
              />
            ))}
          </div>

          {/* Total Summary */}
          {expenses.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">
                  Total Planned
                </span>
                <span className="text-lg font-bold text-blue-600 tabular-nums">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Form */}
      <BillForm
        open={isFormOpen}
        onClose={handleFormClose}
        bill={editingItem}
        currency={currency}
        isDebt={false}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Planned Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this planned expense? This action cannot be
              undone.
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

// Compact card for bento grid
function PlannedCardCompact({
  item,
  currency,
  isPending,
  onEdit,
  onDelete,
}: {
  item: Debt;
  currency: string;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-2 rounded-lg hover:bg-stone-50 transition-colors group",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm">{item.icon || "📅"}</span>
        <span className="text-sm text-stone-700 truncate">{item.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-blue-600 tabular-nums">
          -{formatCurrency(item.amount, currency)}
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
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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

// Full card for sheet view
function PlannedCardFull({
  item,
  currency,
  isPending,
  onEdit,
  onDelete,
}: {
  item: Debt;
  currency: string;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-xl border border-stone-200 hover:border-blue-200 transition-colors",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xl">{item.icon || "📅"}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">
              {item.label}
            </p>
            {item.due_date && (
              <p className="text-xs text-stone-500">
                Planned for {item.due_date}{getOrdinalSuffix(item.due_date)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-blue-600 tabular-nums">
            -{formatCurrency(item.amount, currency)}
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
