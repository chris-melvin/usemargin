"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "default" | "mono" | "white";
  className?: string;
}

const sizeMap = {
  sm: { icon: 24, iconClass: "h-6 w-6", text: "text-base", gap: "gap-1.5" },
  md: { icon: 32, iconClass: "h-8 w-8", text: "text-lg", gap: "gap-2" },
  lg: { icon: 40, iconClass: "h-10 w-10", text: "text-xl", gap: "gap-2.5" },
  xl: { icon: 48, iconClass: "h-12 w-12", text: "text-2xl", gap: "gap-3" },
};

const variantMap = {
  default: {
    use: "text-neutral-700",
    margin: "text-teal-600",
  },
  mono: {
    use: "text-neutral-700",
    margin: "text-neutral-800",
  },
  white: {
    use: "text-white/80",
    margin: "text-white",
  },
};

export function Logo({
  size = "md",
  showText = true,
  variant = "default",
  className,
}: LogoProps) {
  const sizeStyles = sizeMap[size];
  const variantStyles = variantMap[variant];

  return (
    <div className={cn("flex items-center", sizeStyles.gap, className)}>
      {/* Logo Icon */}
      <Image
        src="/logo.png"
        alt="useMargin"
        width={sizeStyles.icon}
        height={sizeStyles.icon}
        className={sizeStyles.iconClass}
        priority
      />

      {/* Logo Text */}
      {showText && (
        <div className={cn("font-serif font-semibold tracking-tight", sizeStyles.text)}>
          <span className={variantStyles.use}>use</span>
          <span className={variantStyles.margin}>Margin</span>
        </div>
      )}
    </div>
  );
}

// Export icon-only version for favicons and small spaces
export function LogoIcon({
  size = "md",
  variant = "default",
  className,
}: Omit<LogoProps, "showText">) {
  return (
    <Logo size={size} variant={variant} showText={false} className={className} />
  );
}
