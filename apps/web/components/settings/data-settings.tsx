"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { resetOnboarding } from "@/actions/onboarding";
import { exportExpensesCSV } from "@/actions/expenses";

export function DataSettings() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleExportCSV = () => {
    startTransition(async () => {
      const result = await exportExpensesCSV();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ledgr-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Expenses exported successfully");
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

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your expense data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={handleExportCSV}
            disabled={isPending}
          >
            <Download className="w-4 h-4" />
            Export as CSV
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

          {/* Danger Zone */}
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
