"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/ui/icon-picker";
import { Loader2 } from "lucide-react";

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
];

const PRESET_ICONS = [
  "🎯", "✈️", "🏠", "🚗", "📱", "💻", "👗", "🎮",
  "🎓", "💍", "🏥", "🐶", "✈️", "🎁", "💼", "🏖️"
];

export interface GoalFormData {
  name: string;
  targetAmount: string;
  currentBalance: string;
  targetDate: string;
  icon: string;
  color: string;
}

export interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GoalFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateGoalDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateGoalDialogProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    name: "",
    targetAmount: "",
    currentBalance: "",
    targetDate: "",
    icon: "🎯",
    color: "#3B82F6",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      name: "",
      targetAmount: "",
      currentBalance: "",
      targetDate: "",
      icon: "🎯",
      color: "#3B82F6",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Savings Goal</DialogTitle>
          <DialogDescription>
            Set a target and start saving toward something meaningful.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              placeholder="e.g., Vacation to Japan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount</Label>
              <Input
                id="targetAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="5000"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentBalance">Starting Amount (Optional)</Label>
              <Input
                id="currentBalance"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={formData.currentBalance}
                onChange={(e) =>
                  setFormData({ ...formData, currentBalance: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date (Optional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) =>
                setFormData({ ...formData, targetDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-all ${
                    formData.icon === icon
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-8 w-8 rounded-full transition-all ${
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name || !formData.targetAmount}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface ContributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalName: string;
  currentBalance: number;
  targetAmount: number;
  onSubmit: (amount: number, note?: string) => Promise<void>;
  isLoading?: boolean;
}

export function ContributeDialog({
  open,
  onOpenChange,
  goalName,
  currentBalance,
  targetAmount,
  onSubmit,
  isLoading,
}: ContributeDialogProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    await onSubmit(numAmount, note || undefined);
    setAmount("");
    setNote("");
  };

  const remaining = targetAmount - currentBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contribute to {goalName}</DialogTitle>
          <DialogDescription>
            Add funds toward your goal. Current progress: {" "}
            {formatCurrency(currentBalance)} of {formatCurrency(targetAmount)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
            {remaining > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(remaining)} needed to reach goal
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              placeholder="e.g., Birthday money"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !amount}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Contribute
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function for formatting currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
