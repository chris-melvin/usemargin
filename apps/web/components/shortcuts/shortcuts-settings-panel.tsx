"use client";

import { useState } from "react";
import { X, Trash2, Edit3, Plus, Zap, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomShortcut } from "@/lib/types";

interface ShortcutsSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: CustomShortcut[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<CustomShortcut, "id" | "createdAt">>) => void;
  onCreateNew: () => void;
}

export function ShortcutsSettingsPanel({
  isOpen,
  onClose,
  shortcuts,
  onDelete,
  onUpdate,
  onCreateNew,
}: ShortcutsSettingsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  if (!isOpen) return null;

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (shortcut: CustomShortcut) => {
    setEditingId(shortcut.id);
    setEditLabel(shortcut.label);
  };

  const handleSaveEdit = (id: string) => {
    if (editLabel.trim()) {
      onUpdate(id, { label: editLabel.trim() });
    }
    setEditingId(null);
    setEditLabel("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
  };

  const handleDeleteConfirm = (id: string) => {
    if (confirm("Delete this shortcut? This action cannot be undone.")) {
      onDelete(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Custom Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Add */}
        <div className="px-5 py-4 space-y-3 border-b border-stone-100">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className={cn(
                "w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl",
                "text-sm text-stone-700 placeholder:text-stone-300",
                "focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300",
                "transition-all duration-200"
              )}
            />
          </div>

          {/* Add New Button */}
          <button
            onClick={onCreateNew}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-stone-200",
              "flex items-center justify-center gap-2 transition-all duration-200",
              "text-stone-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/50"
            )}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Create New Shortcut</span>
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-stone-300" />
              </div>
              <p className="text-stone-500 text-sm">
                {shortcuts.length === 0
                  ? "No shortcuts yet. Create one to get started!"
                  : "No shortcuts match your search."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredShortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  className={cn(
                    "p-4 bg-stone-50 rounded-xl border border-stone-100",
                    "hover:border-stone-200 transition-all duration-200"
                  )}
                >
                  {editingId === shortcut.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className={cn(
                            "w-full px-3 py-2 bg-white border border-stone-200 rounded-lg",
                            "text-sm text-stone-700",
                            "focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300"
                          )}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(shortcut.id);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-3 py-2 text-sm text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(shortcut.id)}
                          className="flex-1 px-3 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{shortcut.icon || "⚡"}</span>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono font-semibold text-stone-800">
                              @{shortcut.trigger}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">{shortcut.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(shortcut)}
                          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(shortcut.id)}
                          className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50">
          <p className="text-[10px] text-stone-400 text-center">
            Type <span className="font-mono font-medium">@shortcut amount</span> in the input bar to use
          </p>
        </div>
      </div>
    </div>
  );
}
