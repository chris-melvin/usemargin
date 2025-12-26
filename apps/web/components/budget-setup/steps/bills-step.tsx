"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Home, Zap, Tv, CreditCard, Shield, MoreHorizontal } from "lucide-react";
import type { WizardBill, BillCategory } from "@/lib/budget-setup";
import { BILL_FREQUENCIES, BILL_CATEGORIES } from "@/lib/budget-setup";
import { CURRENCY } from "@/lib/constants";

const CATEGORY_ICONS: Record<BillCategory, typeof Home> = {
  housing: Home,
  utilities: Zap,
  subscriptions: Tv,
  loans: CreditCard,
  insurance: Shield,
  other: MoreHorizontal,
};

interface BillsStepProps {
  bills: WizardBill[];
  onBillsChange: (bills: WizardBill[]) => void;
}

export function BillsStep({ bills, onBillsChange }: BillsStepProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const addBill = useCallback(
    (bill: Omit<WizardBill, "id">) => {
      const newBill: WizardBill = {
        ...bill,
        id: crypto.randomUUID(),
      };
      onBillsChange([...bills, newBill]);
      setShowAddForm(false);
    },
    [bills, onBillsChange]
  );

  const removeBill = useCallback(
    (id: string) => {
      onBillsChange(bills.filter((b) => b.id !== id));
    },
    [bills, onBillsChange]
  );

  // Group bills by category
  const groupedBills = bills.reduce(
    (acc, bill) => {
      const category = bill.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(bill);
      return acc;
    },
    {} as Record<BillCategory, WizardBill[]>
  );

  const totalMonthly = bills.reduce((sum, bill) => {
    // Normalize to monthly
    switch (bill.frequency) {
      case "weekly":
        return sum + bill.amount * 4.33;
      case "biweekly":
        return sum + bill.amount * 2.17;
      case "yearly":
        return sum + bill.amount / 12;
      default:
        return sum + bill.amount;
    }
  }, 0);

  return (
    <div className="space-y-6">
      {/* Info text */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm text-stone-600">
          Add your fixed monthly expenses like rent, utilities, and
          subscriptions. These will be automatically deducted from your income
          to calculate your available budget.
        </p>
      </div>

      {/* Bills list */}
      {bills.length > 0 && (
        <div className="space-y-4">
          {BILL_CATEGORIES.map(({ value: category, label }) => {
            const categoryBills = groupedBills[category];
            if (!categoryBills?.length) return null;

            const Icon = CATEGORY_ICONS[category];

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
                <div className="space-y-2 pl-6">
                  {categoryBills.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onRemove={() => removeBill(bill.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-100 px-4 py-3">
            <span className="font-medium text-stone-600">
              Total Monthly Fixed Expenses
            </span>
            <span className="text-lg font-bold text-stone-800">
              {CURRENCY}
              {Math.round(totalMonthly).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Add form */}
      {showAddForm ? (
        <AddBillForm onAdd={addBill} onCancel={() => setShowAddForm(false)} />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 py-4 text-sm font-medium text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-50"
        >
          <Plus className="h-4 w-4" />
          Add Fixed Expense
        </button>
      )}

      {/* Skip hint */}
      {bills.length === 0 && (
        <p className="text-center text-sm text-stone-500">
          No fixed expenses? You can skip this step and add them later.
        </p>
      )}
    </div>
  );
}

function BillCard({
  bill,
  onRemove,
}: {
  bill: WizardBill;
  onRemove: () => void;
}) {
  const frequencyLabel =
    BILL_FREQUENCIES.find((f) => f.value === bill.frequency)?.label ||
    bill.frequency;

  return (
    <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <div>
        <h4 className="font-medium text-stone-800">{bill.label}</h4>
        <p className="text-sm text-stone-500">
          {frequencyLabel}
          {bill.dueDate && ` · Due on ${bill.dueDate}th`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-stone-800">
          {CURRENCY}
          {bill.amount.toLocaleString()}
        </span>
        <button
          onClick={onRemove}
          className="rounded p-1 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AddBillForm({
  onAdd,
  onCancel,
}: {
  onAdd: (bill: Omit<WizardBill, "id">) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<WizardBill["frequency"]>("monthly");
  const [category, setCategory] = useState<BillCategory>("other");
  const [dueDate, setDueDate] = useState<number | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !amount) return;

    onAdd({
      label: label.trim(),
      amount: parseFloat(amount),
      frequency,
      category,
      dueDate: frequency === "monthly" ? dueDate : undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
    >
      <h3 className="mb-4 font-medium text-stone-800">Add Fixed Expense</h3>

      <div className="space-y-4">
        {/* Category selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {BILL_CATEGORIES.map(({ value, label, icon }) => {
              const Icon = CATEGORY_ICONS[value];
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors ${
                    category === value
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Name
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Rent, Electric Bill, Netflix"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Amount and Frequency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
                {CURRENCY}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-stone-300 py-2 pl-8 pr-3 text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as WizardBill["frequency"])
              }
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {BILL_FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due date (for monthly) */}
        {frequency === "monthly" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Due Date (optional)
            </label>
            <select
              value={dueDate || ""}
              onChange={(e) =>
                setDueDate(e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">No specific date</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                  {day === 1
                    ? "st"
                    : day === 2
                      ? "nd"
                      : day === 3
                        ? "rd"
                        : "th"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!label.trim() || !amount}
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Expense
          </button>
        </div>
      </div>
    </form>
  );
}
