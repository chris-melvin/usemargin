"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Wallet, TrendingUp, Building2, PiggyBank, Coins, Home, Car, Bitcoin, Briefcase, MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { AssetType } from "@repo/database";

const TYPE_ICONS: Record<AssetType, typeof Wallet> = {
  cash: Coins,
  investment: TrendingUp,
  property: Home,
  vehicle: Car,
  crypto: Bitcoin,
  retirement: Briefcase,
  other: MoreHorizontal,
};

const TYPE_LABELS: Record<AssetType, string> = {
  cash: "Cash",
  investment: "Investment",
  property: "Property",
  vehicle: "Vehicle",
  crypto: "Crypto",
  retirement: "Retirement",
  other: "Other",
};

const TYPE_COLORS: Record<AssetType, string> = {
  cash: "#10B981",
  investment: "#3B82F6",
  property: "#8B5CF6",
  vehicle: "#F59E0B",
  crypto: "#F97316",
  retirement: "#14B8A6",
  other: "#6B7280",
};

export interface AccountCardProps {
  id: string;
  name: string;
  type: AssetType;
  balance: number;
  institution?: string | null;
  isLiquid?: boolean;
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function AccountCard({
  id,
  name,
  type,
  balance,
  institution,
  isLiquid,
  onClick,
  onEdit,
}: AccountCardProps) {
  const Icon = TYPE_ICONS[type];
  const color = TYPE_COLORS[type];

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => onClick?.(id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <h3 className="font-medium">{name}</h3>
              <p className="text-sm text-muted-foreground">
                {institution || TYPE_LABELS[type]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{formatCurrency(balance)}</div>
            {isLiquid && (
              <span className="text-xs text-green-600">Liquid</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface AccountsSummaryCardProps {
  totalBalance: number;
  liquidBalance: number;
  investmentBalance: number;
  accountCount: number;
  onAddAccount?: () => void;
}

export function AccountsSummaryCard({
  totalBalance,
  liquidBalance,
  investmentBalance,
  accountCount,
  onAddAccount,
}: AccountsSummaryCardProps) {
  const liquidPercent = totalBalance > 0 ? (liquidBalance / totalBalance) * 100 : 0;
  const investmentPercent = totalBalance > 0 ? (investmentBalance / totalBalance) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Accounts</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onAddAccount}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatCurrency(totalBalance)}</span>
          <span className="text-sm text-muted-foreground">
            across {accountCount} accounts
          </span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Liquid</span>
              <span className="font-medium">{formatCurrency(liquidBalance)}</span>
            </div>
            <Progress value={liquidPercent} className="h-1.5 bg-emerald-100" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Investments</span>
              <span className="font-medium">{formatCurrency(investmentBalance)}</span>
            </div>
            <Progress value={investmentPercent} className="h-1.5 bg-blue-100" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="rounded-lg bg-muted p-2 text-center">
            <div className="text-lg font-semibold">{accountCount}</div>
            <div className="text-xs text-muted-foreground">Accounts</div>
          </div>
          <div className="rounded-lg bg-muted p-2 text-center">
            <div className="text-lg font-semibold">
              {formatCurrency(liquidBalance)}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface EmptyAccountsStateProps {
  onAddAccount?: () => void;
}

export function EmptyAccountsState({ onAddAccount }: EmptyAccountsStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 rounded-full bg-muted p-3">
          <Wallet className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium">No accounts yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first account to start tracking your money
        </p>
        <Button className="mt-4" onClick={onAddAccount}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </CardContent>
    </Card>
  );
}
