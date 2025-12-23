"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onAddExpense: (amount: number, label: string) => void;
}

export function ExpenseModal({
  isOpen,
  onClose,
  selectedDate,
  onAddExpense,
}: ExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onAddExpense(numAmount, label || "Misc");
    setAmount("");
    setLabel("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Day Details</DialogTitle>
          <p className="text-stone-400 text-sm">
            {selectedDate.toLocaleDateString("default", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* Manual Input Fields */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Amount
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
                className="text-3xl font-mono border-0 border-b border-stone-100 rounded-none focus-visible:ring-0 focus-visible:border-stone-900 px-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Label
              </Label>
              <Input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Misc Spend"
                className="text-xl border-0 border-b border-stone-100 rounded-none focus-visible:ring-0 focus-visible:border-stone-900 px-0"
              />
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-stone-900 text-stone-50 py-6 rounded-3xl font-medium hover:bg-stone-800 transition-all active:scale-95 shadow-lg"
          >
            Log Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
