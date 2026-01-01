"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Upload, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resetOnboarding } from "@/actions/onboarding";

export function DataSettings() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const handleExportCSV = () => {
    startTransition(async () => {
      // TODO: Implement CSV export
      toast.info("CSV export coming soon!");
    });
  };

  const handleExportJSON = () => {
    startTransition(async () => {
      // TODO: Implement JSON export
      toast.info("JSON export coming soon!");
    });
  };

  const handleResetOnboarding = () => {
    startTransition(async () => {
      const result = await resetOnboarding();
      if (result.success) {
        toast.success("Onboarding reset successfully");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reset onboarding");
      }
    });
  };

  const handleClearExpenses = () => {
    // TODO: Implement expense clearing
    toast.info("Clear expenses coming soon!");
    setIsClearDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Export Section - Coming Soon */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Export Data</CardTitle>
            <Badge variant="outline" className="text-xs font-normal">Coming Soon</Badge>
          </div>
          <CardDescription>
            Download your expense data in various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start gap-2"
              disabled
            >
              <Download className="w-4 h-4" />
              Export as CSV
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              disabled
            >
              <Download className="w-4 h-4" />
              Export as JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Section - Coming Soon */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Import Data</CardTitle>
            <Badge variant="outline" className="text-xs font-normal">Coming Soon</Badge>
          </div>
          <CardDescription>
            Import expenses from a file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="justify-start gap-2"
            disabled
          >
            <Upload className="w-4 h-4" />
            Import from CSV
          </Button>
        </CardContent>
      </Card>

      {/* Reset Options */}
      <Card>
        <CardHeader>
          <CardTitle>Reset Options</CardTitle>
          <CardDescription>
            Reset various parts of your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reset Onboarding */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-900">Reset Onboarding</p>
              <p className="text-xs text-stone-500">
                Show the welcome tour and tips again
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleResetOnboarding}
              disabled={isPending}
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>

          <Separator />

          {/* Danger Zone - Coming Soon */}
          <div className="space-y-3 opacity-60">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-medium">Danger Zone</p>
              <Badge variant="outline" className="text-xs font-normal">Coming Soon</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-rose-200 bg-rose-50/50">
              <div>
                <p className="text-sm font-medium text-stone-900">Clear All Expenses</p>
                <p className="text-xs text-stone-500">
                  Permanently delete all your expense records
                </p>
              </div>
              <Button variant="destructive" size="sm" className="gap-2" disabled>
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
