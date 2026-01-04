"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
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
import { createBill } from "@/actions/bills";
import type { CreateBillInput } from "@/lib/validations/bill.schema";

const DEBT_ICONS = ["💳", "💰", "🏠", "🚗", "🏦", "📱", "💸", "🎓"];

interface DebtQuickFormProps {
  open: boolean;
  onClose: () => void;
  currency: string;
  onSave?: (data: CreateBillInput) => Promise<void>;
}

// Auto-detect debt type and icon from name
function detectDebtType(name: string): { icon: string; type: string } {
  const lower = name.toLowerCase();

  if (/credit|card|visa|mastercard|bdo|bpi|metrobank|security|citibank|unionbank|rcbc|eastwest|pnb|chinabank|maybank/.test(lower)) {
    return { icon: "💳", type: "credit_card" };
  }
  if (/car|auto|vehicle|motor/.test(lower)) {
    return { icon: "🚗", type: "auto_loan" };
  }
  if (/house|home|mortgage|housing|pag-ibig|pagibig/.test(lower)) {
    return { icon: "🏠", type: "mortgage" };
  }
  if (/phone|mobile|iphone|samsung|gadget/.test(lower)) {
    return { icon: "📱", type: "gadget" };
  }
  if (/school|tuition|education|student/.test(lower)) {
    return { icon: "🎓", type: "education" };
  }
  if (/bank|sss|gsis/.test(lower)) {
    return { icon: "🏦", type: "bank_loan" };
  }
  if (/utang|loan|personal|borrowed|hiram/.test(lower)) {
    return { icon: "💰", type: "personal_loan" };
  }
  return { icon: "💳", type: "other" };
}

// Format number with commas
function formatNumber(value: string): string {
  const num = value.replace(/[^0-9.]/g, "");
  const parts = num.split(".");
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return parts.join(".");
}

// Parse formatted number back to plain number
function parseFormattedNumber(value: string): string {
  return value.replace(/,/g, "");
}

export function DebtQuickForm({ open, onClose, currency, onSave }: DebtQuickFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Quick add fields (visible by default)
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [monthsRemaining, setMonthsRemaining] = useState("");

  // Advanced fields (hidden by default)
  const [totalBalance, setTotalBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [icon, setIcon] = useState("💳");

  // Auto-detect icon when name changes
  useEffect(() => {
    if (name && !showAdvanced) {
      const detected = detectDebtType(name);
      setIcon(detected.icon);
    }
  }, [name, showAdvanced]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName("");
      setDueDate("");
      setMonthlyPayment("");
      setMonthsRemaining("");
      setTotalBalance("");
      setInterestRate("");
      setIcon("💳");
      setShowAdvanced(false);
    }
  }, [open]);

  // Calculate end date from months remaining
  const calculateEndDate = (months: number): string => {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + months, 1);
    return endDate.toISOString().split("T")[0] ?? "";
  };

  const handleMonthlyPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setMonthlyPayment(formatted);
  };

  const handleTotalBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setTotalBalance(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(parseFormattedNumber(monthlyPayment));
    const parsedTotal = totalBalance ? parseFloat(parseFormattedNumber(totalBalance)) : null;
    const parsedInterest = interestRate ? parseFloat(interestRate) / 100 : null;
    const parsedMonths = monthsRemaining ? parseInt(monthsRemaining, 10) : null;

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid monthly payment");
      return;
    }

    // Calculate end date if months remaining is provided
    const endDate = parsedMonths && parsedMonths > 0 ? calculateEndDate(parsedMonths) : null;
    const today = new Date().toISOString().split("T")[0] ?? null;

    const data: CreateBillInput = {
      label: name.trim(),
      amount: parsedAmount,
      due_date: dueDate ? parseInt(dueDate, 10) : null,
      icon,
      frequency: "monthly" as const,
      is_recurring: true,
      is_active: true,
      payment_type: "fixed",
      payment_mode: "manual", // Quick form defaults to manual
      // Debt-specific fields
      total_amount: parsedTotal,
      remaining_balance: parsedTotal, // Same as total on creation
      interest_rate: parsedInterest,
      minimum_payment: parsedAmount, // Same as monthly payment
      start_date: today,
      end_date: endDate,
    };

    startTransition(async () => {
      // If onSave is provided, use it (optimistic mode)
      if (onSave) {
        await onSave(data);
        return;
      }

      // Fallback to direct server action (legacy mode)
      const result = await createBill(data);

      if (result.success) {
        toast.success("Debt added successfully");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Credit Card / Utang</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., BDO Card, Car Loan, Utang kay Juan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Select value={dueDate} onValueChange={setDueDate}>
              <SelectTrigger>
                <SelectValue placeholder="Select due date" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                    {day === 1 || day === 21 || day === 31
                      ? "st"
                      : day === 2 || day === 22
                        ? "nd"
                        : day === 3 || day === 23
                          ? "rd"
                          : "th"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Payment */}
          <div className="space-y-2">
            <Label htmlFor="monthlyPayment">Monthly Payment</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                {currency}
              </span>
              <Input
                id="monthlyPayment"
                type="text"
                inputMode="decimal"
                placeholder="5,000"
                value={monthlyPayment}
                onChange={handleMonthlyPaymentChange}
                className="pl-14"
                required
              />
            </div>
          </div>

          {/* Months to Pay */}
          <div className="space-y-2">
            <Label htmlFor="monthsRemaining">Months to Pay</Label>
            <Select value={monthsRemaining} onValueChange={setMonthsRemaining}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="9">9 months</SelectItem>
                <SelectItem value="12">12 months (1 year)</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months (2 years)</SelectItem>
                <SelectItem value="36">36 months (3 years)</SelectItem>
                <SelectItem value="48">48 months (4 years)</SelectItem>
                <SelectItem value="60">60 months (5 years)</SelectItem>
              </SelectContent>
            </Select>
            {monthsRemaining && (
              <p className="text-xs text-stone-500">
                Target payoff: {new Date(new Date().getFullYear(), new Date().getMonth() + parseInt(monthsRemaining), 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {/* More Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            {showAdvanced ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Less options
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                More options
              </>
            )}
          </button>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-400 uppercase tracking-wider">
                Additional Details
              </p>

              {/* Total Balance */}
              <div className="space-y-2">
                <Label htmlFor="totalBalance">Total Balance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                    {currency}
                  </span>
                  <Input
                    id="totalBalance"
                    type="text"
                    inputMode="decimal"
                    placeholder="45,000"
                    value={totalBalance}
                    onChange={handleTotalBalanceChange}
                    className="pl-14"
                  />
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (APR)</Label>
                <div className="relative">
                  <Input
                    id="interestRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="24.99"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                    %
                  </span>
                </div>
              </div>

              {/* Icon Picker */}
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  icons={DEBT_ICONS}
                  value={icon}
                  onChange={(emoji) => setIcon(emoji)}
                  color="rose"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim() || !monthlyPayment}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isPending ? "Adding..." : "Add Debt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
