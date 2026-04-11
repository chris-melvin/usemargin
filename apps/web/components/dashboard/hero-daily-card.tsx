"use client";

import { useMemo, lazy, Suspense } from "react";
import { Sparkles, TrendingDown, AlertCircle, Zap } from "lucide-react";
import { isSameDay, subDays } from "date-fns";
import { animated, to } from "@react-spring/web";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useShaderConfig } from "@/components/shaders/use-shader-config";
import { formatInTimezone } from "@/lib/utils/date";
import { useCardTilt } from "./hero-card/use-card-tilt";
import { CardGlareOverlay } from "./hero-card/card-glare-overlay";
import { CardMaterialOverlay } from "./hero-card/card-material-overlay";
import { CardDepthLayer } from "./hero-card/card-depth-layer";
import { CircularProgress } from "./hero-card/circular-progress";
import { CardCustomizeSheet } from "./hero-card/card-customize-sheet";
import { useCardCustomization } from "./hero-card/use-card-customization";
import { ProShaderBackground } from "./hero-card/pro-shader-background";
import {
  type CardPreferences,
  type BackgroundStyle,
  ALL_SHADER_BACKGROUNDS,
  getThemeColors,
  getGreeting,
  isDarkTheme,
} from "./hero-card/card-theme";

const MeshGradient = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.MeshGradient }))
);

const GrainGradient = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.GrainGradient }))
);

interface ExpenseItem {
  label: string;
  amount: number;
}

interface HeroDailyCardProps {
  remaining: number;
  limit?: number;
  spent: number;
  expenses?: ExpenseItem[];
  date?: Date;
  timezone?: string;
  isBudgetMode?: boolean;
  cardPreferences?: CardPreferences;
}

type BudgetStatus = "safe" | "close" | "low" | "over";

function getBudgetStatus(remaining: number, limit: number): BudgetStatus {
  const percentRemaining = (remaining / limit) * 100;
  if (remaining < 0) return "over";
  if (percentRemaining < 20) return "low";
  if (percentRemaining < 50) return "close";
  return "safe";
}

const STATUS_CONFIG = {
  safe: {
    message: "You're on track. Keep it up!",
    icon: Sparkles,
    textColor: "text-emerald-600",
    darkTextColor: "text-emerald-300",
    accentBg: "bg-emerald-50",
    darkAccentBg: "bg-emerald-950/50",
    iconColor: "text-emerald-500",
    darkIconColor: "text-emerald-400",
    barColor: "bg-emerald-400",
    label: "On Track",
  },
  close: {
    message: "Getting close. Spend mindfully.",
    icon: Zap,
    textColor: "text-amber-600",
    darkTextColor: "text-amber-300",
    accentBg: "bg-amber-50",
    darkAccentBg: "bg-amber-950/50",
    iconColor: "text-amber-500",
    darkIconColor: "text-amber-400",
    barColor: "bg-amber-400",
    label: "Watch It",
  },
  low: {
    message: "Almost at limit. Consider pausing.",
    icon: TrendingDown,
    textColor: "text-orange-600",
    darkTextColor: "text-orange-300",
    accentBg: "bg-orange-50",
    darkAccentBg: "bg-orange-950/50",
    iconColor: "text-orange-500",
    darkIconColor: "text-orange-400",
    barColor: "bg-orange-400",
    label: "Low",
  },
  over: {
    message: "Over budget. Tomorrow is a fresh start.",
    icon: AlertCircle,
    textColor: "text-rose-600",
    darkTextColor: "text-rose-300",
    accentBg: "bg-rose-50",
    darkAccentBg: "bg-rose-950/50",
    iconColor: "text-rose-500",
    darkIconColor: "text-rose-400",
    barColor: "bg-rose-400",
    label: "Over",
  },
};

function ShaderBackground({
  bgStyle,
  shaderColors,
  cssGradient,
  enabled,
  speed,
}: {
  bgStyle: BackgroundStyle;
  shaderColors: string[];
  cssGradient: string;
  enabled: boolean;
  speed: number;
}) {
  const fallback = <div className="w-full h-full" style={{ background: cssGradient }} />;

  if (!enabled || bgStyle === "static") {
    return fallback;
  }

  // Shader backgrounds
  if (ALL_SHADER_BACKGROUNDS.includes(bgStyle)) {
    return (
      <ProShaderBackground
        bgStyle={bgStyle}
        colors={shaderColors}
        cssGradient={cssGradient}
        speed={speed}
      />
    );
  }

  if (bgStyle === "grain") {
    return (
      <Suspense fallback={fallback}>
        <GrainGradient
          colors={shaderColors}
          speed={speed}
          width="100%"
          height="100%"
        />
      </Suspense>
    );
  }

  // Default: mesh
  return (
    <Suspense fallback={fallback}>
      <MeshGradient
        colors={shaderColors}
        speed={speed}
        distortion={0.25}
        swirl={0.1}
        grainOverlay={0.02}
        width="100%"
        height="100%"
      />
    </Suspense>
  );
}

export function HeroDailyCard({
  remaining,
  limit = 300,
  spent,
  expenses = [],
  date,
  timezone,
  isBudgetMode = false,
  cardPreferences,
}: HeroDailyCardProps) {
  const { prefs: rawPrefs, update: updatePref } = useCardCustomization(cardPreferences);
  const prefs = rawPrefs;

  const status = useMemo(() => getBudgetStatus(remaining, limit), [remaining, limit]);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const percentRemaining = Math.max(0, (remaining / limit) * 100);
  const { enabled: shadersEnabled, speed } = useShaderConfig();

  const dark = isDarkTheme(prefs.theme);

  const { shaderColors, cssGradient } = useMemo(
    () => getThemeColors(prefs.theme, status, isBudgetMode),
    [prefs.theme, status, isBudgetMode]
  );

  const { rotateX, rotateY, scale, glareX, glareY, bind } = useCardTilt(prefs.enableTilt);

  const now = new Date();
  const displayDate = date ?? now;
  const isDateToday = isSameDay(displayDate, now);
  const isYesterday = isSameDay(displayDate, subDays(now, 1));

  const dayLabel = isDateToday ? "Today" : isYesterday ? "Yesterday" : (
    timezone
      ? formatInTimezone(displayDate, timezone, "EEEE")
      : displayDate.toLocaleDateString("en-US", { weekday: "long" })
  );

  const dateDisplay = timezone
    ? formatInTimezone(displayDate, timezone, "EEEE, MMMM d")
    : displayDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

  const emptyText = isDateToday
    ? "No expenses yet today. Start fresh!"
    : isYesterday
      ? "No expenses recorded"
      : "No expenses yet";

  const expensesLabel = isDateToday ? "Today\u2019s Expenses" : "Expenses";

  const greeting = prefs.displayName ? getGreeting(prefs.displayName) : null;

  return (
    <animated.div
      {...bind}
      className="group/hero"
      style={{
        perspective: "800px",
        transform: to(
          [rotateX, rotateY, scale],
          (rx, ry, s) =>
            `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`
        ),
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div
        className={cn(
          "relative w-full max-w-md mx-auto",
          "rounded-3xl border",
          "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]",
          "overflow-hidden",
          dark
            ? "border-white/10"
            : "border-stone-200/60"
        )}
      >
        {/* Shader / gradient background — Layer 0 */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <ShaderBackground
            bgStyle={prefs.backgroundStyle}
            shaderColors={shaderColors}
            cssGradient={cssGradient}
            enabled={shadersEnabled}
            speed={speed}
          />
        </div>

        {/* Material overlay — Layer 0.5 */}
        {prefs.material !== "default" && (
          <CardMaterialOverlay
            material={prefs.material}
            glareX={glareX}
            glareY={glareY}
          />
        )}

        {/* Glare overlay — Layer 1 */}
        {prefs.enableGlare && (
          <CardGlareOverlay
            glareX={glareX}
            glareY={glareY}
            style={prefs.glareStyle}
          />
        )}

        <div className="relative p-6 sm:p-8" style={{ transformStyle: "preserve-3d" }}>
          {/* Greeting — above date header */}
          {greeting && (
            <CardDepthLayer rotateX={rotateX} rotateY={rotateY}>
              <p className={cn(
                "text-sm font-medium mb-3 animate-in fade-in duration-500",
                dark ? "text-white/60" : "text-neutral-500"
              )}>
                {greeting}
              </p>
            </CardDepthLayer>
          )}

          {/* Header — Layer 2 */}
          <CardDepthLayer rotateX={rotateX} rotateY={rotateY}>
            <div className="flex items-start justify-between mb-6">
              <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                <p className={cn(
                  "text-xs uppercase tracking-[0.2em] font-medium mb-1",
                  dark ? "text-white/40" : "text-neutral-400"
                )}>
                  {dayLabel}
                </p>
                <h2 className={cn(
                  "text-sm sm:text-base font-medium",
                  dark ? "text-white/70" : "text-neutral-600"
                )}>
                  {dateDisplay}
                </h2>
              </div>
              {isBudgetMode && (
                <div
                  className={cn(
                    "animate-in fade-in zoom-in duration-500 delay-100",
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    dark ? config.darkAccentBg : config.accentBg
                  )}
                >
                  <StatusIcon className={cn("w-3.5 h-3.5", dark ? config.darkIconColor : config.iconColor)} />
                  <span className={cn("text-xs font-medium", dark ? config.darkTextColor : config.textColor)}>
                    {config.label}
                  </span>
                </div>
              )}
            </div>
          </CardDepthLayer>

          {isBudgetMode ? (
            <>
              {/* Budget mode: circular progress + remaining amount — Layer 3 */}
              <CardDepthLayer
                rotateX={rotateX}
                rotateY={rotateY}
                zOffset={10}
                parallax={0.5}
              >
                <div className="flex items-center gap-6 sm:gap-8 mb-6">
                  <div className="animate-in fade-in zoom-in duration-700 delay-200 flex-shrink-0">
                    <CircularProgress percent={percentRemaining} status={status} />
                  </div>

                  <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-300 flex-1 min-w-0">
                    <div className="mb-1">
                      <span
                        className={cn(
                          "text-4xl sm:text-5xl font-bold tracking-tight",
                          status === "over"
                            ? (dark ? "text-rose-400" : "text-rose-600")
                            : (dark ? "text-white" : "text-neutral-900")
                        )}
                      >
                        {status === "over" && "-"}
                        {CURRENCY}
                        <AnimatedNumber value={Math.abs(remaining)} duration={600} />
                      </span>
                    </div>
                    <p className={cn("text-sm", dark ? "text-white/40" : "text-neutral-400")}>
                      {status === "over" ? (
                        <>
                          over your {CURRENCY}
                          {limit.toLocaleString()} budget
                        </>
                      ) : (
                        <>
                          remaining of {CURRENCY}
                          {limit.toLocaleString()}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardDepthLayer>

              {/* Insight message — Layer 4 */}
              <CardDepthLayer
                rotateX={rotateX}
                rotateY={rotateY}
                zOffset={5}
                parallax={0.3}
              >
                <div
                  className={cn(
                    "animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400",
                    "flex items-center gap-2 px-4 py-3 rounded-2xl mb-4",
                    dark
                      ? "bg-white/10 border border-white/10"
                      : "bg-white/60 border border-stone-100"
                  )}
                >
                  <div className={cn("w-1 h-8 rounded-full", config.barColor)} />
                  <p className={cn(
                    "text-sm font-medium",
                    dark ? "text-white/70" : "text-neutral-600"
                  )}>
                    {config.message}
                  </p>
                </div>
              </CardDepthLayer>
            </>
          ) : (
            /* Tracking mode: just total spent — Layer 3 */
            <CardDepthLayer
              rotateX={rotateX}
              rotateY={rotateY}
              zOffset={10}
              parallax={0.5}
            >
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 mb-6">
                <div className="mb-1">
                  <span className={cn(
                    "text-4xl sm:text-5xl font-bold tracking-tight",
                    dark ? "text-white" : "text-neutral-900"
                  )}>
                    {CURRENCY}
                    <AnimatedNumber value={spent} duration={600} />
                  </span>
                </div>
                <p className={cn("text-sm", dark ? "text-white/40" : "text-neutral-400")}>
                  spent {dayLabel.toLowerCase()}
                </p>
              </div>
            </CardDepthLayer>
          )}

          {/* Today's expenses — Layer 5 */}
          {expenses.length > 0 && (
            <CardDepthLayer
              rotateX={rotateX}
              rotateY={rotateY}
              zOffset={15}
              parallax={0.8}
            >
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
                <p className={cn(
                  "text-[10px] uppercase tracking-[0.15em] mb-2",
                  dark ? "text-white/40" : "text-neutral-400"
                )}>
                  {expensesLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {expenses.map((expense, i) => (
                    <span
                      key={i}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                        "text-xs font-medium",
                        "animate-in fade-in zoom-in duration-300",
                        dark
                          ? "bg-white/10 border border-white/10 text-white/80"
                          : "bg-white/80 border border-stone-100 text-neutral-600"
                      )}
                      style={{ animationDelay: `${600 + i * 50}ms` }}
                    >
                      {expense.label}
                      <span className={cn("tabular-nums", dark ? "text-white/40" : "text-neutral-400")}>
                        {CURRENCY}
                        {expense.amount}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </CardDepthLayer>
          )}

          {/* Empty state */}
          {expenses.length === 0 && spent === 0 && (
            <div className="animate-in fade-in duration-500 delay-500 text-center py-2">
              <p className={cn("text-xs", dark ? "text-white/40" : "text-neutral-400")}>
                {emptyText}
              </p>
            </div>
          )}
        </div>

        {/* Customize button */}
        <CardCustomizeSheet prefs={rawPrefs} onUpdate={updatePref} dark={dark} />
      </div>
    </animated.div>
  );
}
