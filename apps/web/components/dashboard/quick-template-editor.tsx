"use client";

import { useState, useEffect } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuickTemplate } from "@/hooks/use-quick-templates";

// Common emoji options for expense categories
const EMOJI_OPTIONS = [
  "☕", "🍱", "🍽️", "🍿", "🛵", "🚌", "🚗", "⛽",
  "🛒", "🛍️", "👕", "💊", "🏥", "💇", "🎬", "🎮",
  "📱", "💻", "🏠", "💡", "📚", "✈️", "🎁", "💰",
];

interface QuickTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: QuickTemplate | null;
  onSave: (template: Omit<QuickTemplate, "id">) => void;
  onUpdate: (id: string, updates: Partial<Omit<QuickTemplate, "id">>) => void;
  onDelete: (id: string) => void;
  onResetToDefaults: () => void;
  mode: "add" | "edit" | "manage";
}

export function QuickTemplateEditor({
  open,
  onOpenChange,
  template,
  onSave,
  onUpdate,
  onDelete,
  onResetToDefaults,
  mode,
}: QuickTemplateEditorProps) {
  const [icon, setIcon] = useState("☕");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset form when dialog opens or template changes
  useEffect(() => {
    if (template && mode === "edit") {
      setIcon(template.icon);
      setLabel(template.label);
      setAmount(template.amount.toString());
    } else if (mode === "add") {
      setIcon("☕");
      setLabel("");
      setAmount("");
    }
    setShowDeleteConfirm(false);
  }, [template, mode, open]);

  const handleSubmit = () => {
    const trimmedLabel = label.trim();
    const parsedAmount = parseFloat(amount);

    if (!trimmedLabel || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (mode === "edit" && template) {
      onUpdate(template.id, { icon, label: trimmedLabel, amount: parsedAmount });
    } else {
      onSave({ icon, label: trimmedLabel, amount: parsedAmount });
    }

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (template) {
      onDelete(template.id);
      onOpenChange(false);
    }
  };

  const handleResetToDefaults = () => {
    onResetToDefaults();
    onOpenChange(false);
  };

  const isValid = label.trim().length > 0 && parseFloat(amount) > 0;

  if (mode === "manage") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Quick Templates</DialogTitle>
            <DialogDescription>
              Reset all templates to default values. This will remove any custom
              templates you&apos;ve created.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleResetToDefaults}
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Template" : "Add Quick Template"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update this quick-add template"
              : "Create a new quick-add button for frequent expenses"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Icon Picker */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                    icon === emoji
                      ? "bg-teal-100 ring-2 ring-teal-500"
                      : "bg-neutral-100 hover:bg-neutral-200"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              placeholder="e.g., Coffee, Lunch, Grab"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Default Amount (₱)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 120"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === "edit" && (
            <>
              {showDeleteConfirm ? (
                <div className="flex gap-2 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className="flex-1"
                  >
                    Confirm Delete
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </>
          )}
          <div className="flex gap-2 flex-1 justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid}>
              {mode === "edit" ? "Save Changes" : "Add Template"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
