"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, MoreHorizontal, Pencil, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { DebtQuickForm } from "./debt-quick-form";
import { formatCurrency, cn } from "@/lib/utils";
import { markBillPaid, deleteBill } from "@/actions/bills";
import type { Debt } from "@repo/database";

const MAX_VISIBLE_ITEMS = 3;

interface DebtSectionProps {
  debts: Debt[];
  currency: string;
  onUpdate: () => void;
}

export function DebtSection({ debts, currency, onUpdate }: DebtSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalBalance = debts.reduce(
    (sum, d) => sum + (d.remaining_balance ?? d.total_amount ?? 0),
    0
  );
  const visibleDebts = debts.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = debts.length > MAX_VISIBLE_ITEMS;

  const handleMarkPaid = (debt: Debt) => {
    startTransition(async () => {
      const result = await markBillPaid(debt.id);
      if (result.success) {
        toast.success(`${debt.label} payment marked`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteBill(deleteId);
      if (result.success) {
        toast.success("Debt deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
      setDeleteId(null);
    });
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setIsEditFormOpen(true);
  };

  const handleEditFormClose = () => {
    setIsEditFormOpen(false);
    setEditingDebt(null);
  };

  return (
    <>
      <BentoCard
        title="Debt"
        icon={CreditCard}
        iconColor="text-rose-600"
        iconBg="bg-rose-100"
        total={totalBalance}
        currency={currency}
        count={debts.length}
        onAdd={() => setIsQuickFormOpen(true)}
        onViewAll={() => setIsSheetOpen(true)}
        showViewAll={hasMore}
      >
        {debts.length === 0 ? (
          <BentoCardEmpty
            message="No debts tracked"
            actionLabel="Add debt"
            onAction={() => setIsQuickFormOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {visibleDebts.map((debt) => (
              <DebtCardCompact
                key={debt.id}
                debt={debt}
                currency={currency}
                isPending={isPending}
                onMarkPaid={() => handleMarkPaid(debt)}
                onEdit={() => handleEdit(debt)}
                onDelete={() => setDeleteId(debt.id)}
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
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-rose-600" />
              </div>
              All Debts
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {debts.map((debt) => (
              <DebtCardFull
                key={debt.id}
                debt={debt}
                currency={currency}
                isPending={isPending}
                onMarkPaid={() => handleMarkPaid(debt)}
                onEdit={() => handleEdit(debt)}
                onDelete={() => setDeleteId(debt.id)}
              />
            ))}
          </div>

          {/* Total Balance Summary */}
          {debts.length > 0 && (
            <div className="mt-4 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-rose-600 font-medium">
                  Total Debt Balance
                </span>
                <span className="text-lg font-bold text-rose-600 tabular-nums">
                  {formatCurrency(totalBalance, currency)}
                </span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Quick Add Form */}
      <DebtQuickForm
        open={isQuickFormOpen}
        onClose={() => setIsQuickFormOpen(false)}
        currency={currency}
      />

      {/* Edit Form (Full) */}
      <BillForm
        open={isEditFormOpen}
        onClose={handleEditFormClose}
        bill={editingDebt}
        currency={currency}
        isDebt={true}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this debt? This action cannot be
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

// Compact card for bento grid - shows progress bar
function DebtCardCompact({
  debt,
  currency,
  isPending,
  onMarkPaid,
  onEdit,
  onDelete,
}: {
  debt: Debt;
  currency: string;
  isPending: boolean;
  onMarkPaid: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalAmount = debt.total_amount ?? 0;
  const remainingBalance = debt.remaining_balance ?? totalAmount;
  const paidAmount = totalAmount - remainingBalance;
  const progressPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <div
      className={cn(
        "p-2 rounded-lg hover:bg-stone-50 transition-colors group",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{debt.icon || "💳"}</span>
          <span className="text-sm text-stone-700 truncate">{debt.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-rose-600 tabular-nums">
            {formatCurrency(remainingBalance, currency)}
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
              <DropdownMenuItem onClick={onMarkPaid}>
                <DollarSign className="w-4 h-4 mr-2" />
                Make Payment
              </DropdownMenuItem>
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
      {totalAmount > 0 && (
        <div className="flex items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-[10px] text-stone-400 tabular-nums">
            {progressPercent.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Full card for sheet view
function DebtCardFull({
  debt,
  currency,
  isPending,
  onMarkPaid,
  onEdit,
  onDelete,
}: {
  debt: Debt;
  currency: string;
  isPending: boolean;
  onMarkPaid: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalAmount = debt.total_amount ?? 0;
  const remainingBalance = debt.remaining_balance ?? totalAmount;
  const paidAmount = totalAmount - remainingBalance;
  const progressPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const interestRate = debt.interest_rate ? debt.interest_rate * 100 : null;

  return (
    <div
      className={cn(
        "p-3 rounded-xl border border-stone-200 hover:border-rose-200 transition-colors",
        isPending && "opacity-60"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xl">{debt.icon || "💳"}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">
              {debt.label}
            </p>
            <p className="text-xs text-stone-500">
              {debt.due_date && `Due on ${debt.due_date}${getOrdinalSuffix(debt.due_date)}`}
              {interestRate !== null && ` • ${interestRate.toFixed(2)}% APR`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-lg font-bold text-rose-600 tabular-nums">
              {formatCurrency(remainingBalance, currency)}
            </p>
            <p className="text-[10px] text-stone-400 uppercase">remaining</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onMarkPaid}>
                <DollarSign className="w-4 h-4 mr-2" />
                Make Payment
              </DropdownMenuItem>
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

      {/* Progress Bar */}
      {totalAmount > 0 && (
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-[10px] text-stone-400">
            <span>{progressPercent.toFixed(0)}% paid</span>
            <span>
              {formatCurrency(paidAmount, currency)} of {formatCurrency(totalAmount, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Payment Info */}
      <div className="mt-3 flex items-center gap-4 text-xs text-stone-500">
        <span>
          Payment: <span className="font-medium text-stone-700">{formatCurrency(debt.minimum_payment ?? debt.amount, currency)}/mo</span>
        </span>
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
