"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { AssetType } from "@repo/database";

const ACCOUNT_TYPES: { value: AssetType; label: string }[] = [
  { value: "cash", label: "Cash / Checking" },
  { value: "investment", label: "Investment Account" },
  { value: "crypto", label: "Crypto Wallet" },
  { value: "retirement", label: "Retirement (401k, IRA)" },
  { value: "property", label: "Real Estate" },
  { value: "vehicle", label: "Vehicle" },
  { value: "other", label: "Other" },
];

export interface AccountFormData {
  name: string;
  type: AssetType;
  balance: string;
  institution: string;
  accountNumber: string;
  notes: string;
}

export interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateAccountDialogProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    type: "cash",
    balance: "",
    institution: "",
    accountNumber: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    await onSubmit(formData);
    setFormData({
      name: "",
      type: "cash",
      balance: "",
      institution: "",
      accountNumber: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            Add a bank account, investment, or asset to track.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Chase Checking"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: AssetType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance</Label>
            <Input
              id="balance"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Institution (Optional)</Label>
            <Input
              id="institution"
              placeholder="e.g., Chase Bank"
              value={formData.institution}
              onChange={(e) =>
                setFormData({ ...formData, institution: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Any additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface UpdateBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  currentBalance: number;
  onSubmit: (newBalance: number) => Promise<void>;
  isLoading?: boolean;
}

export function UpdateBalanceDialog({
  open,
  onOpenChange,
  accountName,
  currentBalance,
  onSubmit,
  isLoading,
}: UpdateBalanceDialogProps) {
  const [balance, setBalance] = useState(currentBalance.toString());

  // Update local state when dialog opens with new values
  useEffect(() => {
    if (open) {
      setBalance(currentBalance.toString());
    }
  }, [open, currentBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return;
    await onSubmit(numBalance);
  };

  const change = parseFloat(balance) - currentBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Balance</DialogTitle>
          <DialogDescription>
            Update the balance for {accountName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="balance">New Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              autoFocus
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Current: {formatCurrency(currentBalance)}
              </span>
              {change !== 0 && (
                <span
                  className={`font-medium ${
                    change > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {change > 0 ? "+" : ""}
                  {formatCurrency(change)}
                </span>
              )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Balance
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
