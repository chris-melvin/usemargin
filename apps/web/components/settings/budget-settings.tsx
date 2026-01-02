"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Calculator, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BucketsSettings } from "./buckets-settings";
import { updateSettings } from "@/actions/settings";
import { formatCurrency } from "@/lib/utils";
import type { UserSettings, BudgetBucket } from "@repo/database";

interface BudgetSettingsProps {
  userSettings: UserSettings;
  buckets?: BudgetBucket[];
}

export function BudgetSettings({ userSettings, buckets = [] }: BudgetSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dailyLimit, setDailyLimit] = useState(String(userSettings.default_daily_limit));
  const [monthlyIncome, setMonthlyIncome] = useState(
    userSettings.total_monthly_income ? String(userSettings.total_monthly_income) : ""
  );
  const [fixedExpenses, setFixedExpenses] = useState(
    userSettings.total_fixed_expenses ? String(userSettings.total_fixed_expenses) : ""
  );

  const hasChanges =
    dailyLimit !== String(userSettings.default_daily_limit) ||
    monthlyIncome !== (userSettings.total_monthly_income ? String(userSettings.total_monthly_income) : "") ||
    fixedExpenses !== (userSettings.total_fixed_expenses ? String(userSettings.total_fixed_expenses) : "");

  const handleSave = () => {
    const limit = parseFloat(dailyLimit);
    if (isNaN(limit) || limit <= 0) {
      toast.error("Please enter a valid daily limit");
      return;
    }

    startTransition(async () => {
      const result = await updateSettings({
        default_daily_limit: limit,
        total_monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
        total_fixed_expenses: fixedExpenses ? parseFloat(fixedExpenses) : null,
      });

      if (result.success) {
        toast.success("Budget settings saved successfully");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save settings");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget Configuration</CardTitle>
          <CardDescription>
            Configure your daily spending limit and income information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily Limit */}
          <div className="space-y-2">
            <Label htmlFor="daily-limit">Default Daily Limit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                {userSettings.currency}
              </span>
              <Input
                id="daily-limit"
                type="number"
                min="0"
                step="1"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="pl-14"
                placeholder="300"
              />
            </div>
            <p className="text-xs text-stone-500">
              Your target spending limit for each day
            </p>
          </div>

          <Separator />

          {/* Monthly Income */}
          <div className="space-y-2">
            <Label htmlFor="monthly-income">Monthly Income</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                {userSettings.currency}
              </span>
              <Input
                id="monthly-income"
                type="number"
                min="0"
                step="1"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="pl-14"
                placeholder="50000"
              />
            </div>
            <p className="text-xs text-stone-500">
              Your total monthly income (used for budget calculations)
            </p>
          </div>

          <Separator />

          {/* Fixed Expenses */}
          <div className="space-y-2">
            <Label htmlFor="fixed-expenses">Fixed Monthly Expenses</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                {userSettings.currency}
              </span>
              <Input
                id="fixed-expenses"
                type="number"
                min="0"
                step="1"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value)}
                className="pl-14"
                placeholder="20000"
              />
            </div>
            <p className="text-xs text-stone-500">
              Rent, utilities, subscriptions, and other fixed monthly costs
            </p>
          </div>

          {/* Calculated Daily Limit */}
          {userSettings.calculated_daily_limit && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      Calculated Daily Limit
                    </p>
                    <p className="text-xs text-stone-500">
                      Based on your income and expenses
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-emerald-600 tabular-nums">
                  {formatCurrency(userSettings.calculated_daily_limit, userSettings.currency)}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Spending Buckets */}
      <BucketsSettings
        buckets={buckets}
        currency={userSettings.currency}
        availableAmount={
          (userSettings.total_monthly_income ?? 0) - (userSettings.total_fixed_expenses ?? 0)
        }
      />

      {/* Budget Setup Link */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Setup Wizard</CardTitle>
          <CardDescription>
            Re-run the setup wizard to recalculate your daily budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/setup">
            <Button variant="outline" className="gap-2">
              Open Budget Setup
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className="min-w-[120px]"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
