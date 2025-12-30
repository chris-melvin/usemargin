"use client";

import { useState, useCallback } from "react";
import { Banknote, Plus, Trash2, Check } from "lucide-react";
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
import type { WizardIncome } from "@/lib/budget-setup";
import { INCOME_FREQUENCIES } from "@/lib/budget-setup";
import { CURRENCY } from "@/lib/constants";

interface IncomeSetupSectionProps {
  incomes: WizardIncome[];
  onIncomesChange: (incomes: WizardIncome[]) => void;
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

export function IncomeSetupSection({
  incomes,
  onIncomesChange,
}: IncomeSetupSectionProps) {
  const [showAddForm, setShowAddForm] = useState(incomes.length === 0);
  const hasIncome = incomes.length > 0;

  const addIncome = useCallback(
    (income: Omit<WizardIncome, "id">) => {
      const newIncome: WizardIncome = {
        ...income,
        id: crypto.randomUUID(),
      };
      onIncomesChange([...incomes, newIncome]);
      setShowAddForm(false);
    },
    [incomes, onIncomesChange]
  );

  const removeIncome = useCallback(
    (id: string) => {
      const newIncomes = incomes.filter((i) => i.id !== id);
      onIncomesChange(newIncomes);
      if (newIncomes.length === 0) {
        setShowAddForm(true);
      }
    },
    [incomes, onIncomesChange]
  );

  const totalMonthlyIncome = incomes.reduce((sum, i) => {
    // Normalize to monthly
    switch (i.frequency) {
      case "weekly": return sum + i.amount * 4.33;
      case "biweekly": return sum + i.amount * 2.17;
      case "yearly": return sum + i.amount / 12;
      case "quarterly": return sum + i.amount / 3;
      default: return sum + i.amount;
    }
  }, 0);

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Banknote className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-stone-900">Monthly Income</h2>
          <p className="text-sm text-stone-500">Where does your money come from?</p>
        </div>
        {hasIncome && (
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-blue-600" />
          </div>
        )}
      </div>

      {/* Income List */}
      {incomes.length > 0 && (
        <div className="space-y-2 mb-4">
          {incomes.map((income) => (
            <IncomeCard
              key={income.id}
              income={income}
              onRemove={() => removeIncome(income.id)}
            />
          ))}
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-700">Total Monthly</span>
            <span className="text-sm font-semibold text-blue-700">
              {CURRENCY}{Math.round(totalMonthlyIncome).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm ? (
        <AddIncomeForm
          onAdd={addIncome}
          onCancel={() => incomes.length > 0 && setShowAddForm(false)}
          isPrimary={incomes.length === 0}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-3 text-sm font-medium text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-600"
        >
          <Plus className="h-4 w-4" />
          Add Another Income
        </button>
      )}
    </div>
  );
}

function IncomeCard({
  income,
  onRemove,
}: {
  income: WizardIncome;
  onRemove: () => void;
}) {
  const frequencyLabel =
    INCOME_FREQUENCIES.find((f) => f.value === income.frequency)?.label ||
    income.frequency;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
      <div>
        <p className="font-medium text-stone-800">{income.label}</p>
        <p className="text-xs text-stone-500">
          {frequencyLabel}
          {income.dayOfMonth && ` - Day ${income.dayOfMonth}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-stone-800">
          {CURRENCY}{income.amount.toLocaleString()}
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

function AddIncomeForm({
  onAdd,
  onCancel,
  isPrimary,
}: {
  onAdd: (income: Omit<WizardIncome, "id">) => void;
  onCancel: () => void;
  isPrimary: boolean;
}) {
  const [label, setLabel] = useState(isPrimary ? "Salary" : "");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<WizardIncome["frequency"]>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(15);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFormattedNumber(amount);
    if (!label.trim() || parsedAmount <= 0) return;

    onAdd({
      label: label.trim(),
      amount: parsedAmount,
      frequency,
      dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
      isPrimary,
    });

    // Reset form
    setLabel("");
    setAmount("");
    setFrequency("monthly");
    setDayOfMonth(15);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setAmount(formatted);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-stone-50/50 rounded-xl border border-stone-100">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Label */}
        <div className="space-y-1.5">
          <Label className="text-stone-600">Source</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Salary, Freelance"
            className="bg-white"
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label className="text-stone-600">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
              {CURRENCY}
            </span>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="25,000"
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Frequency */}
        <div className="space-y-1.5">
          <Label className="text-stone-600">Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as WizardIncome["frequency"])}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INCOME_FREQUENCIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Day of Month */}
        {frequency === "monthly" && (
          <div className="space-y-1.5">
            <Label className="text-stone-600">Pay Day</Label>
            <Select
              value={dayOfMonth?.toString() || "15"}
              onValueChange={(v) => setDayOfMonth(parseInt(v))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
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
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {!isPrimary && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!label.trim() || !amount}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isPrimary ? "Add Income" : "Add"}
        </Button>
      </div>
    </form>
  );
}
