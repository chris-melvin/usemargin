"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, AlertCircle, Plus, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface BillCardProps {
  id: string;
  name: string;
  amount: number;
  dueDate: number | null;
  status: string;
  daysUntilDue: number | null;
  isOverdue: boolean;
  category?: string;
  onMarkPaid?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function BillCard({
  id,
  name,
  amount,
  dueDate,
  status,
  daysUntilDue,
  isOverdue,
  category,
  onMarkPaid,
  onClick,
}: BillCardProps) {
  const getStatusColor = () => {
    if (status === "paid") return "bg-green-100 text-green-700";
    if (isOverdue) return "bg-red-100 text-red-700";
    if (daysUntilDue !== null && daysUntilDue <= 3) return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  const getStatusText = () => {
    if (status === "paid") return "Paid";
    if (isOverdue) return `Overdue by ${Math.abs(daysUntilDue || 0)} days`;
    if (daysUntilDue === 0) return "Due today";
    if (daysUntilDue === 1) return "Due tomorrow";
    return `Due in ${daysUntilDue} days`;
  };

  return (
    <Card
      className={cn(
        "transition-all",
        status !== "paid" && "cursor-pointer hover:shadow-md",
        status === "paid" && "opacity-60"
      )}
      onClick={() => status !== "paid" && onClick?.(id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                status === "paid"
                  ? "bg-green-100"
                  : isOverdue
                  ? "bg-red-100"
                  : "bg-blue-100"
              )}
            >
              {status === "paid" ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : isOverdue ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Calendar className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium">{name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn("text-xs", getStatusColor())}>
                  {getStatusText()}
                </Badge>
                {dueDate && (
                  <span className="text-xs text-muted-foreground">
                    Day {dueDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-semibold">{formatCurrency(amount)}</div>
              {category && (
                <span className="text-xs text-muted-foreground">{category}</span>
              )}
            </div>

            {status !== "paid" && onMarkPaid && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkPaid(id);
                }}
              >
                <Check className="mr-1 h-4 w-4" />
                Pay
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface BillsSummaryCardProps {
  totalDueThisMonth: number;
  upcomingCount: number;
  overdueCount: number;
  paidCount: number;
  onAddBill?: () => void;
}

export function BillsSummaryCard({
  totalDueThisMonth,
  upcomingCount,
  overdueCount,
  paidCount,
  onAddBill,
}: BillsSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Bills to Pay</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onAddBill}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatCurrency(totalDueThisMonth)}</span>
          <span className="text-sm text-muted-foreground">due this month</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div
            className={cn(
              "rounded-lg p-2 text-center",
              overdueCount > 0 ? "bg-red-100" : "bg-muted"
            )}
          >
            <div
              className={cn(
                "text-lg font-semibold",
                overdueCount > 0 && "text-red-700"
              )}
            >
              {overdueCount}
            </div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>

          <div className="rounded-lg bg-amber-50 p-2 text-center">
            <div className="text-lg font-semibold text-amber-700">{upcomingCount}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </div>

          <div className="rounded-lg bg-green-50 p-2 text-center">
            <div className="text-lg font-semibold text-green-700">{paidCount}</div>
            <div className="text-xs text-muted-foreground">Paid</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface EmptyBillsStateProps {
  onAddBill?: () => void;
}

export function EmptyBillsState({ onAddBill }: EmptyBillsStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 rounded-full bg-muted p-3">
          <Receipt className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium">No bills yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add recurring bills to keep track of what's due
        </p>
        <Button className="mt-4" onClick={onAddBill}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bill
        </Button>
      </CardContent>
    </Card>
  );
}
