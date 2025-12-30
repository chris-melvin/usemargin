"use client";

import { useState, useCallback, useEffect } from "react";
import { CreditCard, Plus, Trash2, Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY } from "@/lib/constants";
import type { WizardDebt } from "@/lib/budget-setup";

export type { WizardDebt };

interface DebtSetupSectionProps {
  debts: WizardDebt[];
  onDebtsChange: (debts: WizardDebt[]) => void;
}

const DEBT_ICONS = ["💳", "💰", "🏠", "🚗", "🏦", "📱", "💸", "🎓"];

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

function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/,/g, "")) || 0;
}

export function DebtSetupSection({
  debts,
  onDebtsChange,
}: DebtSetupSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const hasDebts = debts.length > 0;

  const addDebt = useCallback(
    (debt: Omit<WizardDebt, "id">) => {
      const newDebt: WizardDebt = {
        ...debt,
        id: crypto.randomUUID(),
      };
      onDebtsChange([...debts, newDebt]);
      setShowAddForm(false);
    },
    [debts, onDebtsChange]
  );

  const removeDebt = useCallback(
    (id: string) => {
      onDebtsChange(debts.filter((d) => d.id !== id));
    },
    [debts, onDebtsChange]
  );

  const totalMonthlyPayments = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const totalDebtBalance = debts.reduce((sum, d) => sum + (d.totalBalance || 0), 0);

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-rose-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-stone-900">Debt & Loans</h2>
          <p className="text-sm text-stone-500">Credit cards, loans, utang</p>
        </div>
        {hasDebts && (
          <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-rose-600" />
          </div>
        )}
      </div>

      {/* Debts List */}
      {debts.length > 0 && (
        <div className="space-y-2 mb-4">
          {debts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onRemove={() => removeDebt(debt.id)}
            />
          ))}
          <div className="flex items-center justify-between px-3 py-2 bg-rose-50 rounded-lg">
            <span className="text-sm font-medium text-rose-700">Monthly Payments</span>
            <span className="text-sm font-semibold text-rose-700">
              {CURRENCY}{totalMonthlyPayments.toLocaleString()}
            </span>
          </div>
          {totalDebtBalance > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-stone-50 rounded-lg">
              <span className="text-sm font-medium text-stone-600">Total Balance</span>
              <span className="text-sm font-semibold text-stone-600">
                {CURRENCY}{totalDebtBalance.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasDebts && !showAddForm && (
        <div className="text-center py-4 mb-4 bg-stone-50 rounded-xl">
          <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-400">No debt? Good for you!</p>
        </div>
      )}

      {/* Add Form */}
      {showAddForm ? (
        <AddDebtForm
          onAdd={addDebt}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-3 text-sm font-medium text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-600"
        >
          <Plus className="h-4 w-4" />
          {hasDebts ? "Add Another Debt" : "Add Debt"}
        </button>
      )}
    </div>
  );
}

function DebtCard({
  debt,
  onRemove,
}: {
  debt: WizardDebt;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
      <div className="flex items-center gap-3">
        <span className="text-xl">{debt.icon}</span>
        <div>
          <p className="font-medium text-stone-800">{debt.label}</p>
          <p className="text-xs text-stone-500">
            {debt.dueDate && `Due ${debt.dueDate}${debt.dueDate === 1 || debt.dueDate === 21 || debt.dueDate === 31 ? "st" : debt.dueDate === 2 || debt.dueDate === 22 ? "nd" : debt.dueDate === 3 || debt.dueDate === 23 ? "rd" : "th"}`}
            {debt.monthsRemaining && ` - ${debt.monthsRemaining} months left`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-stone-800">
          {CURRENCY}{debt.monthlyPayment.toLocaleString()}/mo
        </span>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AddDebtForm({
  onAdd,
  onCancel,
}: {
  onAdd: (debt: Omit<WizardDebt, "id">) => void;
  onCancel: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [label, setLabel] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [monthsRemaining, setMonthsRemaining] = useState("");
  const [totalBalance, setTotalBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [icon, setIcon] = useState("💳");

  // Auto-detect icon when name changes
  useEffect(() => {
    if (label && !showAdvanced) {
      const detected = detectDebtType(label);
      setIcon(detected.icon);
    }
  }, [label, showAdvanced]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPayment = parseFormattedNumber(monthlyPayment);
    if (!label.trim() || parsedPayment <= 0) return;

    onAdd({
      label: label.trim(),
      monthlyPayment: parsedPayment,
      dueDate: dueDate ? parseInt(dueDate, 10) : undefined,
      totalBalance: totalBalance ? parseFormattedNumber(totalBalance) : undefined,
      interestRate: interestRate ? parseFloat(interestRate) / 100 : undefined,
      monthsRemaining: monthsRemaining ? parseInt(monthsRemaining, 10) : undefined,
      icon,
    });

    // Reset form
    setLabel("");
    setDueDate("");
    setMonthlyPayment("");
    setMonthsRemaining("");
    setTotalBalance("");
    setInterestRate("");
    setIcon("💳");
    setShowAdvanced(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-stone-50/50 rounded-xl border border-stone-100">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-stone-600">Name</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., BDO Card, Car Loan, Utang kay Juan"
            className="bg-white"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <Label className="text-stone-600">Due Date</Label>
          <Select value={dueDate} onValueChange={setDueDate}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}{day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monthly Payment */}
        <div className="space-y-1.5">
          <Label className="text-stone-600">Monthly Payment</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
              {CURRENCY}
            </span>
            <Input
              type="text"
              inputMode="decimal"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(formatNumber(e.target.value))}
              placeholder="5,000"
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Months to Pay */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-stone-600">Months to Pay (optional)</Label>
          <Select value={monthsRemaining} onValueChange={setMonthsRemaining}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select duration" />
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
            <p className="text-xs text-stone-400">
              Target payoff: {new Date(new Date().getFullYear(), new Date().getMonth() + parseInt(monthsRemaining), 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
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

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Total Balance */}
            <div className="space-y-1.5">
              <Label className="text-stone-600">Total Balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                  {CURRENCY}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={totalBalance}
                  onChange={(e) => setTotalBalance(formatNumber(e.target.value))}
                  placeholder="45,000"
                  className="pl-10 bg-white"
                />
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-1.5">
              <Label className="text-stone-600">Interest Rate (APR)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="24.99"
                  className="pr-8 bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Icon Picker */}
          <div className="space-y-1.5">
            <Label className="text-stone-600">Icon</Label>
            <div className="flex flex-wrap gap-2">
              {DEBT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    icon === emoji
                      ? "bg-rose-100 ring-2 ring-rose-500"
                      : "bg-stone-100 hover:bg-stone-200"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!label.trim() || !monthlyPayment}
          className="bg-rose-600 hover:bg-rose-700"
        >
          Add Debt
        </Button>
      </div>
    </form>
  );
}
