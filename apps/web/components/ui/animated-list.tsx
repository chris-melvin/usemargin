"use client";

import { useTransition, animated, config } from "@react-spring/web";
import { type ReactNode, Children, isValidElement, cloneElement } from "react";
import { cn } from "@/lib/utils";
import { STAGGER } from "@/lib/motion/config";

interface AnimatedListProps {
  children: ReactNode;
  /** Stagger delay between items in ms */
  stagger?: number;
  /** Animation direction */
  from?: "bottom" | "top" | "left" | "right" | "scale";
  /** Custom class for the container */
  className?: string;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
  /** Key to trigger re-animation */
  animationKey?: string | number;
}

/**
 * Animates list items with staggered entrance
 */
export function AnimatedList({
  children,
  stagger = STAGGER.normal,
  from = "bottom",
  className,
  animateOnMount = true,
  animationKey,
}: AnimatedListProps) {
  const items = Children.toArray(children).filter(isValidElement);

  const getInitialTransform = () => {
    switch (from) {
      case "bottom":
        return { opacity: 0, y: 20 };
      case "top":
        return { opacity: 0, y: -20 };
      case "left":
        return { opacity: 0, x: -20 };
      case "right":
        return { opacity: 0, x: 20 };
      case "scale":
        return { opacity: 0, scale: 0.9 };
      default:
        return { opacity: 0, y: 20 };
    }
  };

  const getFinalTransform = () => {
    switch (from) {
      case "bottom":
      case "top":
        return { opacity: 1, y: 0 };
      case "left":
      case "right":
        return { opacity: 1, x: 0 };
      case "scale":
        return { opacity: 1, scale: 1 };
      default:
        return { opacity: 1, y: 0 };
    }
  };

  const transitions = useTransition(
    animateOnMount ? items : [],
    {
      keys: (item) => (item as React.ReactElement).key || items.indexOf(item as React.ReactElement),
      from: getInitialTransform(),
      enter: getFinalTransform(),
      trail: stagger,
      config: config.gentle,
      reset: animationKey !== undefined,
    }
  );

  if (!animateOnMount) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {transitions((style, item) => (
        <animated.div style={style}>
          {item}
        </animated.div>
      ))}
    </div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  /** Index in the list for stagger calculation */
  index: number;
  /** Stagger delay in ms */
  stagger?: number;
  /** Animation direction */
  from?: "bottom" | "top" | "left" | "right" | "scale";
  /** Custom class */
  className?: string;
}

/**
 * Individual animated list item (use when you need more control)
 */
export function AnimatedListItem({
  children,
  index,
  stagger = STAGGER.normal,
  from = "bottom",
  className,
}: AnimatedListItemProps) {
  const getTransformOrigin = () => {
    switch (from) {
      case "bottom":
        return "translateY(20px)";
      case "top":
        return "translateY(-20px)";
      case "left":
        return "translateX(-20px)";
      case "right":
        return "translateX(20px)";
      case "scale":
        return "scale(0.9)";
      default:
        return "translateY(20px)";
    }
  };

  return (
    <div
      className={cn("animate-in fade-in", className)}
      style={{
        animation: `slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        animationDelay: `${index * stagger}ms`,
        opacity: 0,
        transform: getTransformOrigin(),
      }}
    >
      {children}
    </div>
  );
}

// Add keyframes to global styles or use CSS-in-JS
const slideInKeyframes = `
@keyframes slideIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(0) scale(1);
  }
}
`;

// Inject keyframes if not already present
if (typeof document !== "undefined") {
  const styleId = "animated-list-keyframes";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = slideInKeyframes;
    document.head.appendChild(style);
  }
}
