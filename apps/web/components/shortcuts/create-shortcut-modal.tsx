"use client";

import { useState, useEffect, useRef } from "react";
import { X, Zap, Sparkles, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconPicker } from "@/components/ui/icon-picker";

interface CreateShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: string;
  amount: number;
  onSave: (trigger: string, label: string, icon?: string) => void;
  onSaveAndLog: (trigger: string, label: string, amount: number, icon?: string) => void;
}

// Common emoji icons for quick selection
const QUICK_ICONS = ["📚", "🎮", "🎬", "🎵", "💊", "🏋️", "🎨", "✂️", "🎁", "💄", "🧴", "📱"];

export function CreateShortcutModal({
  isOpen,
  onClose,
  trigger,
  amount,
  onSave,
  onSaveAndLog,
}: CreateShortcutModalProps) {
  const [label, setLabel] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setLabel("");
      setSelectedIcon(undefined);
      setIsSaving(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveOnly = () => {
    if (!label.trim()) return;
    setIsSaving(true);
    onSave(trigger, label.trim(), selectedIcon);
    onClose();
  };

  const handleSaveAndLog = () => {
    if (!label.trim()) return;
    setIsSaving(true);
    onSaveAndLog(trigger, label.trim(), amount, selectedIcon);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && label.trim()) {
      handleSaveAndLog();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header with gradient */}
        <div className="relative px-5 py-4 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100/50">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">New Shortcut</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-mono font-bold text-stone-800">@{trigger}</span>
            <span className="text-stone-400">→</span>
            <span className="text-sm text-stone-500">{formatCurrency(amount, CURRENCY)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Label Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Label for @{trigger}
            </label>
            <Input
              ref={inputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`e.g., "Book Purchase", "Movie Ticket"`}
            />
            <p className="mt-1.5 text-[10px] text-stone-400">
              When you type <span className="font-mono font-medium">@{trigger} 500</span>, it will log "{label || "..."}" for {CURRENCY}500
            </p>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Icon (optional)
            </label>
            <IconPicker
              icons={QUICK_ICONS}
              value={selectedIcon}
              onChange={(icon) => setSelectedIcon(icon === selectedIcon ? undefined : icon)}
              color="amber"
              size="sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveOnly}
            disabled={!label.trim() || isSaving}
            className="flex-1"
          >
            Save Shortcut
          </Button>
          <Button
            onClick={handleSaveAndLog}
            disabled={!label.trim() || isSaving}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Save & Log
          </Button>
        </div>
      </div>
    </div>
  );
}
