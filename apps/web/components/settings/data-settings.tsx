"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Upload, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your expense data in various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={handleExportCSV}
              disabled={isPending}
            >
              <Download className="w-4 h-4" />
              Export as CSV
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={handleExportJSON}
              disabled={isPending}
            >
              <Download className="w-4 h-4" />
              Export as JSON
            </Button>
          </div>
          <p className="text-xs text-stone-500">
            Your exported data includes all expenses, categories, and settings
          </p>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
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
          <p className="text-xs text-stone-500 mt-2">
            Coming soon - import your expense history from other apps
          </p>
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

          {/* Danger Zone */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-medium">Danger Zone</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-rose-200 bg-rose-50/50">
              <div>
                <p className="text-sm font-medium text-stone-900">Clear All Expenses</p>
                <p className="text-xs text-stone-500">
                  Permanently delete all your expense records
                </p>
              </div>
              <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clear All Expenses</DialogTitle>
                    <DialogDescription>
                      This will permanently delete all your expense records. This action
                      cannot be undone. Your settings and shortcuts will be preserved.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsClearDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleClearExpenses}>
                      Clear All Expenses
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
