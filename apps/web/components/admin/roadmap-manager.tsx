"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { RoadmapItem, RoadmapStatus } from "@repo/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  updateRoadmapStatus,
} from "@/actions/roadmap";
import { cn } from "@/lib/utils";

interface RoadmapManagerProps {
  initialItems: RoadmapItem[];
}

const statusOptions: { value: RoadmapStatus; label: string }[] = [
  { value: "under_consideration", label: "Under Consideration" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const statusColors: Record<RoadmapStatus, string> = {
  under_consideration: "bg-stone-100 text-stone-700",
  planned: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

export function RoadmapManager({ initialItems }: RoadmapManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<RoadmapStatus>("under_consideration");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("under_consideration");
    setCategory("");
    setIsPublic(true);
    setEditingItem(null);
  };

  const openDialog = (item?: RoadmapItem) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setDescription(item.description);
      setStatus(item.status);
      setCategory(item.category ?? "");
      setIsPublic(item.is_public);
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (!title || !description) return;

    startTransition(async () => {
      if (editingItem) {
        const result = await updateRoadmapItem(editingItem.id, {
          title,
          description,
          status,
          category: category || null,
          is_public: isPublic,
        });

        if (result.success) {
          setItems((prev) =>
            prev.map((i) => (i.id === editingItem.id ? result.data : i))
          );
          closeDialog();
        }
      } else {
        const result = await createRoadmapItem({
          title,
          description,
          status,
          category: category || null,
          is_public: isPublic,
        });

        if (result.success) {
          setItems((prev) => [...prev, result.data]);
          closeDialog();
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this roadmap item?")) return;

    startTransition(async () => {
      const result = await deleteRoadmapItem(id);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    });
  };

  const handleStatusChange = (id: string, newStatus: RoadmapStatus) => {
    startTransition(async () => {
      const result = await updateRoadmapStatus(id, newStatus);
      if (result.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? result.data : i))
        );
      }
    });
  };

  const handleToggleVisibility = (item: RoadmapItem) => {
    startTransition(async () => {
      const result = await updateRoadmapItem(item.id, {
        is_public: !item.is_public,
      });
      if (result.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? result.data : i))
        );
      }
    });
  };

  // Group items by status
  const groupedItems = items.reduce<Record<RoadmapStatus, RoadmapItem[]>>(
    (acc, item) => {
      acc[item.status].push(item);
      return acc;
    },
    {
      under_consideration: [],
      planned: [],
      in_progress: [],
      completed: [],
    }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} total items
        </p>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Items by Status */}
      {statusOptions.map(({ value, label }) => (
        <div key={value}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-medium text-sm">{label}</h3>
            <span className="text-xs text-muted-foreground">
              ({groupedItems[value].length})
            </span>
          </div>

          <div className="space-y-2">
            {groupedItems[value].length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No items
              </p>
            ) : (
              groupedItems[value].map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {item.title}
                        </h4>
                        {!item.is_public && (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        )}
                        {item.category && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {item.vote_count} votes
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(
                            item.id,
                            e.target.value as RoadmapStatus
                          )
                        }
                        disabled={isPending}
                        className={cn(
                          "text-xs px-2 py-1 rounded border-0 cursor-pointer",
                          statusColors[item.status]
                        )}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleVisibility(item)}
                        disabled={isPending}
                        title={item.is_public ? "Make Private" : "Make Public"}
                      >
                        {item.is_public ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDialog(item)}
                        disabled={isPending}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Roadmap Item" : "Add Roadmap Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Feature or improvement name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the feature..."
                rows={3}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as RoadmapStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Analytics"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="is_public" className="cursor-pointer">
                Visible on public roadmap
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : editingItem
                    ? "Save Changes"
                    : "Create Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
