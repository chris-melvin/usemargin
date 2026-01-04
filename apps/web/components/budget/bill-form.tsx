"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/ui/icon-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBill, updateBill } from "@/actions/bills";
import type { Debt, BudgetBucket } from "@repo/database";
import type { CreateBillInput, DebtPaymentMode } from "@/lib/validations/bill.schema";
import { cn } from "@/lib/utils";

const BILL_ICONS = ["📋", "🏠", "💡", "📶", "💳", "🚗", "📺", "🎮", "💪", "📱"];

interface BillFormProps {
  open: boolean;
  onClose: () => void;
  bill?: Debt | null;
  currency: string;
  isDebt?: boolean;
  buckets?: BudgetBucket[];
  onSave?: (data: CreateBillInput) => Promise<void>;
}

export function BillForm({ open, onClose, bill, currency, isDebt = false, buckets = [], onSave }: BillFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [icon, setIcon] = useState("📋");
  const [frequency, setFrequency] = useState("monthly");

  // Debt-specific fields
  const [totalAmount, setTotalAmount] = useState("");
  const [remainingBalance, setRemainingBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [paymentType, setPaymentType] = useState<"fixed" | "variable">("fixed");
  const [paymentMode, setPaymentMode] = useState<DebtPaymentMode>("manual");
  const [paymentBucketId, setPaymentBucketId] = useState<string | null>(null);

  const isEditing = !!bill;

  // Reset form when dialog opens with bill data
  useEffect(() => {
    if (open && bill) {
      setLabel(bill.label);
      setAmount(bill.amount.toString());
      setDueDate(bill.due_date?.toString() ?? "");
      setIcon(bill.icon ?? "📋");
      setFrequency(bill.frequency);
      setTotalAmount(bill.total_amount?.toString() ?? "");
      setRemainingBalance(bill.remaining_balance?.toString() ?? "");
      setInterestRate(bill.interest_rate ? (bill.interest_rate * 100).toString() : "");
      setMinimumPayment(bill.minimum_payment?.toString() ?? "");
      setPaymentType(bill.payment_type ?? "fixed");
      setPaymentMode(bill.payment_mode ?? "manual");
      setPaymentBucketId(bill.payment_bucket_id ?? null);
    } else if (open && !bill) {
      // Reset for new entry
      setLabel("");
      setAmount("");
      setDueDate("");
      setIcon("📋");
      setFrequency("monthly");
      setTotalAmount("");
      setRemainingBalance("");
      setInterestRate("");
      setMinimumPayment("");
      setPaymentType("fixed");
      setPaymentMode("manual");
      setPaymentBucketId(null);
    }
  }, [open, bill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateBillInput = {
      label: label.trim(),
      amount: parseFloat(amount),
      due_date: dueDate ? parseInt(dueDate, 10) : null,
      icon,
      frequency: frequency as "weekly" | "biweekly" | "monthly" | "yearly" | "once",
      is_recurring: frequency !== "once",
      is_active: true,
      // Debt fields
      total_amount: totalAmount ? parseFloat(totalAmount) : null,
      remaining_balance: remainingBalance ? parseFloat(remainingBalance) : null,
      interest_rate: interestRate ? parseFloat(interestRate) / 100 : null,
      minimum_payment: minimumPayment ? parseFloat(minimumPayment) : null,
      payment_type: paymentType,
      payment_mode: paymentMode,
      payment_bucket_id: paymentMode === "auto_deduct" ? paymentBucketId : null,
    };

    startTransition(async () => {
      // If onSave is provided, use it (optimistic mode)
      if (onSave) {
        await onSave(data);
        return;
      }

      // Fallback to direct server action (legacy mode)
      const result = isEditing
        ? await updateBill(bill.id, data)
        : await createBill(data);

      if (result.success) {
        toast.success(isEditing ? "Bill updated" : "Bill added");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit" : "Add"} {isDebt ? "Debt" : "Bill"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker
              icons={BILL_ICONS}
              value={icon}
              onChange={(emoji) => setIcon(emoji)}
              color="amber"
            />
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              placeholder={isDebt ? "e.g., Credit Card, Car Loan" : "e.g., Rent, Electric Bill"}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          {/* Amount / Minimum Payment */}
          <div className="space-y-2">
            <Label htmlFor="amount">{isDebt ? "Monthly Payment" : "Amount"}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                {currency}
              </span>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-14"
                required
              />
            </div>
          </div>

          {/* Debt-specific fields */}
          {isDebt && (
            <>
              {/* Total Amount */}
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount / Credit Limit</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                    {currency}
                  </span>
                  <Input
                    id="totalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="100000"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="pl-14"
                  />
                </div>
              </div>

              {/* Remaining Balance */}
              <div className="space-y-2">
                <Label htmlFor="remainingBalance">Remaining Balance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                    {currency}
                  </span>
                  <Input
                    id="remainingBalance"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="45000"
                    value={remainingBalance}
                    onChange={(e) => setRemainingBalance(e.target.value)}
                    className="pl-14"
                  />
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (APR %)</Label>
                <div className="relative">
                  <Input
                    id="interestRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="18.99"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                    %
                  </span>
                </div>
              </div>

              {/* Payment Type */}
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select value={paymentType} onValueChange={(v) => setPaymentType(v as "fixed" | "variable")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (same amount each period)</SelectItem>
                    <SelectItem value="variable">Variable (adjust each month)</SelectItem>
                  </SelectContent>
                </Select>
                {paymentType === "variable" && (
                  <p className="text-xs text-stone-500">
                    You can adjust the payment amount each month directly from the budget view.
                  </p>
                )}
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode("manual");
                      setPaymentBucketId(null);
                    }}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                      paymentMode === "manual"
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                    )}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("auto_deduct")}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                      paymentMode === "auto_deduct"
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                    )}
                  >
                    Auto-deduct
                  </button>
                </div>
                <p className="text-xs text-stone-500">
                  {paymentMode === "manual"
                    ? "You'll record payments manually each time you pay."
                    : "Payments will automatically deduct from the selected bucket."}
                </p>
              </div>

              {/* Bucket Selection (only for auto-deduct) */}
              {paymentMode === "auto_deduct" && (
                <div className="space-y-2">
                  <Label htmlFor="paymentBucket">Deduct From Bucket</Label>
                  <Select
                    value={paymentBucketId ?? ""}
                    onValueChange={(v) => setPaymentBucketId(v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bucket" />
                    </SelectTrigger>
                    <SelectContent>
                      {buckets.length === 0 ? (
                        <SelectItem value="" disabled>
                          No buckets available
                        </SelectItem>
                      ) : (
                        buckets.map((bucket) => (
                          <SelectItem key={bucket.id} value={bucket.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: bucket.color ?? "#6b7280" }}
                              />
                              {bucket.name}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {buckets.length === 0 && (
                    <p className="text-xs text-amber-600">
                      Create buckets first to use auto-deduct.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Day of Month)</Label>
            <Select value={dueDate} onValueChange={setDueDate}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                    {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency (hidden for debt, always monthly) */}
          {!isDebt && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="once">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : `Add ${isDebt ? "Debt" : "Bill"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
