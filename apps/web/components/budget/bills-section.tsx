"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Receipt, Check, MoreHorizontal, Pencil, Trash2, RotateCcw } from "lucide-react";
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
import { BillForm } from "./bill-form";
import { formatCurrency, cn } from "@/lib/utils";
import { markBillPaid, resetBillStatus, deleteBill } from "@/actions/bills";
import type { Debt } from "@repo/database";

const MAX_VISIBLE_ITEMS = 4;

interface BillsSectionProps {
  bills: Debt[];
  currency: string;
  onUpdate: () => void;
}

export function BillsSection({ bills, currency, onUpdate }: BillsSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Debt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = bills.reduce((sum, b) => sum + b.amount, 0);
  const visibleBills = bills.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = bills.length > MAX_VISIBLE_ITEMS;

  const handleMarkPaid = (bill: Debt) => {
    startTransition(async () => {
      const result = await markBillPaid(bill.id);
      if (result.success) {
        toast.success(`${bill.label} marked as paid`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update bill");
      }
    });
  };

  const handleResetStatus = (bill: Debt) => {
    startTransition(async () => {
      const result = await resetBillStatus(bill.id);
      if (result.success) {
        toast.success(`${bill.label} status reset`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reset status");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteBill(deleteId);
      if (result.success) {
        toast.success("Bill deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete bill");
      }
      setDeleteId(null);
    });
  };

  const handleEdit = (bill: Debt) => {
    setEditingBill(bill);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBill(null);
  };

  return (
    <>
      <BentoCard
        title="Bills"
        icon={Receipt}
        iconColor="text-amber-600"
        iconBg="bg-amber-100"
        total={total}
        currency={currency}
        count={bills.length}
        onAdd={() => setIsFormOpen(true)}
        onViewAll={() => setIsSheetOpen(true)}
        showViewAll={hasMore}
      >
        {bills.length === 0 ? (
          <BentoCardEmpty
            message="No bills yet"
            actionLabel="Add bill"
            onAction={() => setIsFormOpen(true)}
          />
        ) : (
          <div className="space-y-1">
            {visibleBills.map((bill) => (
              <BillCardCompact
                key={bill.id}
                bill={bill}
                currency={currency}
                isPending={isPending}
                onMarkPaid={() => handleMarkPaid(bill)}
                onResetStatus={() => handleResetStatus(bill)}
                onEdit={() => handleEdit(bill)}
                onDelete={() => setDeleteId(bill.id)}
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
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-amber-600" />
              </div>
              All Bills
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {bills.map((bill) => (
              <BillCardFull
                key={bill.id}
                bill={bill}
                currency={currency}
                isPending={isPending}
                onMarkPaid={() => handleMarkPaid(bill)}
                onResetStatus={() => handleResetStatus(bill)}
                onEdit={() => handleEdit(bill)}
                onDelete={() => setDeleteId(bill.id)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Form Dialog */}
      <BillForm
        open={isFormOpen}
        onClose={handleFormClose}
        bill={editingBill}
        currency={currency}
        isDebt={false}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bill? This action cannot be
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
function BillCardCompact({
  bill,
  currency,
  isPending,
  onMarkPaid,
  onResetStatus,
  onEdit,
  onDelete,
}: {
  bill: Debt;
  currency: string;
  isPending: boolean;
  onMarkPaid: () => void;
  onResetStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = bill.status === "paid";
  const isOverdue = bill.status === "overdue";

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
          isPaid ? "bg-emerald-500" : isOverdue ? "bg-rose-500" : "bg-amber-400"
        )} />
        <span className="text-sm text-stone-700 truncate">{bill.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-amber-600 tabular-nums">
          -{formatCurrency(bill.amount, currency)}
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
            {isPaid ? (
              <DropdownMenuItem onClick={onResetStatus}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Mark as Pending
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onMarkPaid}>
                <Check className="w-4 h-4 mr-2" />
                Mark as Paid
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

// Full card for sheet view
function BillCardFull({
  bill,
  currency,
  isPending,
  onMarkPaid,
  onResetStatus,
  onEdit,
  onDelete,
}: {
  bill: Debt;
  currency: string;
  isPending: boolean;
  onMarkPaid: () => void;
  onResetStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = bill.status === "paid";
  const isOverdue = bill.status === "overdue";

  return (
    <div
      className={cn(
        "p-3 rounded-xl border border-stone-200 hover:border-amber-200 transition-colors",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xl">{bill.icon || "📋"}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-stone-900 truncate">
                {bill.label}
              </p>
              <Badge
                variant={isPaid ? "default" : isOverdue ? "destructive" : "secondary"}
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  isPaid && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
              </Badge>
            </div>
            <p className="text-xs text-stone-500">
              {bill.due_date && `Due on ${bill.due_date}${getOrdinalSuffix(bill.due_date)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-amber-600 tabular-nums">
            -{formatCurrency(bill.amount, currency)}
            <span className="text-xs font-normal text-stone-400">/mo</span>
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPaid ? (
                <DropdownMenuItem onClick={onResetStatus}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Mark as Pending
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onMarkPaid}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Paid
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

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
