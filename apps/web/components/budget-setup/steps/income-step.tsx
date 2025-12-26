"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Briefcase, DollarSign } from "lucide-react";
import type { WizardIncome } from "@/lib/budget-setup";
import { INCOME_FREQUENCIES } from "@/lib/budget-setup";
import { CURRENCY } from "@/lib/constants";

interface IncomeStepProps {
  incomes: WizardIncome[];
  onIncomesChange: (incomes: WizardIncome[]) => void;
}

export function IncomeStep({ incomes, onIncomesChange }: IncomeStepProps) {
  const [showAddForm, setShowAddForm] = useState(incomes.length === 0);

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
      onIncomesChange(incomes.filter((i) => i.id !== id));
    },
    [incomes, onIncomesChange]
  );

  const updateIncome = useCallback(
    (id: string, updates: Partial<WizardIncome>) => {
      onIncomesChange(
        incomes.map((i) => (i.id === id ? { ...i, ...updates } : i))
      );
    },
    [incomes, onIncomesChange]
  );

  return (
    <div className="space-y-6">
      {/* Info text */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          Add your income sources to calculate your monthly budget. Start with
          your primary income (salary, wages) and add any additional sources.
        </p>
      </div>

      {/* Income list */}
      {incomes.length > 0 && (
        <div className="space-y-3">
          {incomes.map((income) => (
            <IncomeCard
              key={income.id}
              income={income}
              onUpdate={(updates) => updateIncome(income.id, updates)}
              onRemove={() => removeIncome(income.id)}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      {showAddForm ? (
        <AddIncomeForm
          onAdd={addIncome}
          onCancel={() => setShowAddForm(false)}
          isPrimary={incomes.length === 0}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 py-4 text-sm font-medium text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-50"
        >
          <Plus className="h-4 w-4" />
          Add {incomes.length === 0 ? "Primary" : "Additional"} Income
        </button>
      )}
    </div>
  );
}

function IncomeCard({
  income,
  onUpdate,
  onRemove,
}: {
  income: WizardIncome;
  onUpdate: (updates: Partial<WizardIncome>) => void;
  onRemove: () => void;
}) {
  const frequencyLabel =
    INCOME_FREQUENCIES.find((f) => f.value === income.frequency)?.label ||
    income.frequency;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              income.isPrimary
                ? "bg-amber-100 text-amber-600"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {income.isPrimary ? (
              <Briefcase className="h-5 w-5" />
            ) : (
              <DollarSign className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-stone-800">{income.label}</h3>
            <p className="text-sm text-stone-500">
              {frequencyLabel}
              {income.dayOfMonth && ` · Day ${income.dayOfMonth}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-semibold text-stone-800">
              {CURRENCY}
              {income.amount.toLocaleString()}
            </p>
            {income.isPrimary && (
              <span className="text-xs font-medium text-amber-600">
                Primary
              </span>
            )}
          </div>
          <button
            onClick={onRemove}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
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
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(
    frequency === "monthly" ? 15 : undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !amount) return;

    onAdd({
      label: label.trim(),
      amount: parseFloat(amount),
      frequency,
      dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
      isPrimary,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
    >
      <h3 className="mb-4 font-medium text-stone-800">
        {isPrimary ? "Add Primary Income" : "Add Additional Income"}
      </h3>

      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Income Source
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Salary, Freelance, Rental"
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
                setFrequency(e.target.value as WizardIncome["frequency"])
              }
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {INCOME_FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Day of month (for monthly) */}
        {frequency === "monthly" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Day of Month
            </label>
            <select
              value={dayOfMonth || 15}
              onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
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
            Add Income
          </button>
        </div>
      </div>
    </form>
  );
}
