"use client";

import { cn } from "@/lib/utils";

const colorClasses = {
  amber: {
    selected: "bg-amber-100 ring-2 ring-amber-500 scale-110",
    base: "bg-stone-100 hover:bg-stone-200",
  },
  rose: {
    selected: "bg-rose-100 ring-2 ring-rose-500 scale-110",
    base: "bg-stone-100 hover:bg-stone-200",
  },
  teal: {
    selected: "bg-teal-100 ring-2 ring-teal-500 scale-110",
    base: "bg-stone-100 hover:bg-stone-200",
  },
  blue: {
    selected: "bg-blue-100 ring-2 ring-blue-500 scale-110",
    base: "bg-stone-100 hover:bg-stone-200",
  },
  emerald: {
    selected: "bg-emerald-100 ring-2 ring-emerald-500 scale-110",
    base: "bg-stone-100 hover:bg-stone-200",
  },
} as const;

type ColorVariant = keyof typeof colorClasses;

interface IconPickerProps {
  icons: readonly string[];
  value: string | undefined;
  onChange: (icon: string) => void;
  color?: ColorVariant;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8 text-base",
  md: "w-10 h-10 text-xl",
  lg: "w-12 h-12 text-2xl",
};

export function IconPicker({
  icons,
  value,
  onChange,
  color = "amber",
  className,
  size = "md",
}: IconPickerProps) {
  const colors = colorClasses[color];
  const sizeClass = sizeClasses[size];

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {icons.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className={cn(
            "rounded-lg flex items-center justify-center transition-all duration-150",
            sizeClass,
            value === icon ? colors.selected : colors.base
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
