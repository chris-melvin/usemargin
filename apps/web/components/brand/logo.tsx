"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "default" | "mono" | "white";
  className?: string;
}

const sizeMap = {
  sm: { icon: "h-6 w-6", text: "text-base", gap: "gap-1.5" },
  md: { icon: "h-8 w-8", text: "text-lg", gap: "gap-2" },
  lg: { icon: "h-10 w-10", text: "text-xl", gap: "gap-2.5" },
  xl: { icon: "h-12 w-12", text: "text-2xl", gap: "gap-3" },
};

const variantMap = {
  default: {
    iconBg: "from-teal-400 to-teal-600",
    iconText: "text-white",
    use: "text-neutral-700",
    margin: "text-teal-600",
  },
  mono: {
    iconBg: "from-neutral-600 to-neutral-800",
    iconText: "text-white",
    use: "text-neutral-700",
    margin: "text-neutral-800",
  },
  white: {
    iconBg: "from-white/90 to-white",
    iconText: "text-teal-600",
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
      {/* Logo Icon - Calendar with margin note aesthetic */}
      <div
        className={cn(
          "relative rounded-lg bg-gradient-to-br shadow-sm flex items-center justify-center",
          sizeStyles.icon,
          variantStyles.iconBg
        )}
      >
        {/* Calendar icon with pen/annotation motif */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn("w-[60%] h-[60%]", variantStyles.iconText)}
          strokeWidth="1.5"
          stroke="currentColor"
        >
          {/* Calendar base */}
          <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
          {/* Calendar top binding */}
          <path d="M8 2v4M16 2v4" strokeLinecap="round" />
          {/* Calendar line */}
          <path d="M3 10h18" strokeLinecap="round" />
          {/* Margin annotation line - the "marginalia" element */}
          <path
            d="M7 14h5M7 18h8"
            strokeLinecap="round"
            strokeWidth="1.5"
            opacity="0.8"
          />
          {/* Annotation dot/asterisk */}
          <circle cx="17" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
        </svg>
      </div>

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
