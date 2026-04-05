"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface GoalCardProps {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  progressPercentage: number;
  icon: string | null;
  color: string | null;
  isCompleted?: boolean;
  onContribute?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function GoalCard({
  id,
  name,
  targetAmount,
  currentBalance,
  progressPercentage,
  icon,
  color,
  isCompleted,
  onContribute,
  onClick,
}: GoalCardProps) {
  const displayIcon = icon ?? "🎯";
  const displayColor = color ?? "#3B82F6";

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => onClick?.(id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{ backgroundColor: `${displayColor}20` }}
          >
            {displayIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(currentBalance)} of {formatCurrency(targetAmount)}
            </p>
          </div>
          {isCompleted && (
            <div className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Done!
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progressPercentage}%</span>
            <span className="text-muted-foreground">
              {formatCurrency(targetAmount - currentBalance)} left
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2"
            style={
              {
                "--progress-background": `${displayColor}30`,
                "--progress-indicator": displayColor,
              } as React.CSSProperties
            }
          />
        </div>

        {!isCompleted && onContribute && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onContribute(id);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Contribute
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export interface GoalsSummaryCardProps {
  totalSaved: number;
  totalTarget: number;
  activeGoals: number;
  completedGoals: number;
  onAddGoal?: () => void;
}

export function GoalsSummaryCard({
  totalSaved,
  totalTarget,
  activeGoals,
  completedGoals,
  onAddGoal,
}: GoalsSummaryCardProps) {
  const progress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Savings Goals</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onAddGoal}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatCurrency(totalSaved)}</span>
          <span className="text-sm text-muted-foreground">
            of {formatCurrency(totalTarget)}
          </span>
        </div>

        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}% complete</span>
            <span>
              {activeGoals} active • {completedGoals} done
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="rounded-lg bg-muted p-2 text-center">
            <div className="text-lg font-semibold">{activeGoals}</div>
            <div className="text-xs text-muted-foreground">Active Goals</div>
          </div>
          <div className="rounded-lg bg-muted p-2 text-center">
            <div className="text-lg font-semibold">{completedGoals}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface EmptyGoalsStateProps {
  onAddGoal?: () => void;
}

export function EmptyGoalsState({ onAddGoal }: EmptyGoalsStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 rounded-full bg-muted p-3">
          <Target className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium">No savings goals yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a goal to start tracking your progress
        </p>
        <Button className="mt-4" onClick={onAddGoal}>
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </CardContent>
    </Card>
  );
}
