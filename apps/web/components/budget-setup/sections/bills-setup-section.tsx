"use client";

import { useState, useCallback } from "react";
import { Receipt, Plus, Trash2, Check, PartyPopper } from "lucide-react";
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
import type { WizardBill, BillCategory } from "@/lib/budget-setup";
import { BILL_FREQUENCIES, BILL_CATEGORIES } from "@/lib/budget-setup";
import { CURRENCY } from "@/lib/constants";

interface BillsSetupSectionProps {
  bills: WizardBill[];
  onBillsChange: (bills: WizardBill[]) => void;
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

export function BillsSetupSection({
  bills,
  onBillsChange,
}: BillsSetupSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const hasBills = bills.length > 0;

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

  const totalMonthlyBills = bills.reduce((sum, b) => {
    // Normalize to monthly
    switch (b.frequency) {
      case "weekly": return sum + b.amount * 4.33;
      case "biweekly": return sum + b.amount * 2.17;
      case "yearly": return sum + b.amount / 12;
      default: return sum + b.amount;
    }
  }, 0);

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-stone-900">Monthly Bills</h2>
          <p className="text-sm text-stone-500">Fixed expenses you pay regularly</p>
        </div>
        {hasBills && (
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-amber-600" />
          </div>
        )}
      </div>

      {/* Bills List */}
      {bills.length > 0 && (
        <div className="space-y-2 mb-4">
          {bills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onRemove={() => removeBill(bill.id)}
            />
          ))}
          <div className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg">
            <span className="text-sm font-medium text-amber-700">Total Monthly</span>
            <span className="text-sm font-semibold text-amber-700">
              {CURRENCY}{Math.round(totalMonthlyBills).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasBills && !showAddForm && (
        <div className="text-center py-4 mb-4 bg-stone-50 rounded-xl">
          <PartyPopper className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-400">No bills? Lucky you!</p>
        </div>
      )}

      {/* Add Form */}
      {showAddForm ? (
        <AddBillForm
          onAdd={addBill}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-3 text-sm font-medium text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-600"
        >
          <Plus className="h-4 w-4" />
          {hasBills ? "Add Another Bill" : "Add Bill"}
        </button>
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

  const categoryLabel =
    BILL_CATEGORIES.find((c) => c.value === bill.category)?.label ||
    bill.category;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
      <div>
        <p className="font-medium text-stone-800">{bill.label}</p>
        <p className="text-xs text-stone-500">
          {categoryLabel} - {frequencyLabel}
          {bill.dueDate && ` - Due ${bill.dueDate}${bill.dueDate === 1 || bill.dueDate === 21 || bill.dueDate === 31 ? "st" : bill.dueDate === 2 || bill.dueDate === 22 ? "nd" : bill.dueDate === 3 || bill.dueDate === 23 ? "rd" : "th"}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-stone-800">
          {CURRENCY}{bill.amount.toLocaleString()}
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
    const parsedAmount = parseFormattedNumber(amount);
    if (!label.trim() || parsedAmount <= 0) return;

    onAdd({
      label: label.trim(),
      amount: parsedAmount,
      frequency,
      category,
      dueDate: frequency === "monthly" ? dueDate : undefined,
    });

    // Reset form
    setLabel("");
    setAmount("");
    setFrequency("monthly");
    setCategory("other");
    setDueDate(undefined);
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
          <Label className="text-stone-600">Bill Name</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Rent, Electric, Internet"
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
              placeholder="3,500"
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-stone-600">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as BillCategory)}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BILL_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frequency */}
        <div className="space-y-1.5">
          <Label className="text-stone-600">Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as WizardBill["frequency"])}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BILL_FREQUENCIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        {frequency === "monthly" && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-stone-600">Due Date (optional)</Label>
            <Select
              value={dueDate?.toString() || "none"}
              onValueChange={(v) => setDueDate(v === "none" ? undefined : parseInt(v))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="No specific date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific date</SelectItem>
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
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!label.trim() || !amount}
          className="bg-amber-600 hover:bg-amber-700"
        >
          Add Bill
        </Button>
      </div>
    </form>
  );
}
