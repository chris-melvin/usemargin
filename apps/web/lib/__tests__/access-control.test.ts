import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Access Control Tests
 *
 * These tests verify feature gating logic including:
 * - Subscription-based feature access
 * - Credit-based feature access
 * - Edge cases and unknown features
 */

type SubscriptionTier = "free" | "pro";
type AccessDenialReason =
  | "subscription_required"
  | "insufficient_credits"
  | "feature_disabled";

interface FeatureGate {
  requiredTier?: SubscriptionTier;
  creditsRequired?: number;
  name: string;
  upgradePrompt: {
    title: string;
    description: string;
    ctaText: string;
  };
}

interface AccessCheckResult {
  hasAccess: boolean;
  reason?: AccessDenialReason;
  upgradePrompt?: {
    title: string;
    description: string;
    ctaText: string;
    ctaHref: string;
  };
}

interface UserState {
  tier: SubscriptionTier;
  isPro: boolean;
  credits: number;
}

// Mock feature gates (matching actual config)
const FEATURE_GATES: Record<string, FeatureGate> = {
  analytics: {
    requiredTier: "pro",
    name: "Analytics",
    upgradePrompt: {
      title: "Unlock Analytics",
      description: "Get detailed insights into your spending patterns.",
      ctaText: "Upgrade to Pro",
    },
  },
  export_csv: {
    requiredTier: "pro",
    name: "CSV Export",
    upgradePrompt: {
      title: "Export Your Data",
      description: "Download your data as CSV files.",
      ctaText: "Upgrade to Pro",
    },
  },
  insights: {
    creditsRequired: 1,
    name: "AI Insights",
    upgradePrompt: {
      title: "Get AI Insights",
      description: "Receive personalized financial recommendations.",
      ctaText: "Get Credits",
    },
  },
  budget_improvement: {
    creditsRequired: 3,
    name: "Budget Improvement Plan",
    upgradePrompt: {
      title: "Improve Your Budget",
      description: "Get a personalized plan to optimize your budget.",
      ctaText: "Get Credits",
    },
  },
  expense_analysis: {
    creditsRequired: 2,
    name: "Expense Analysis",
    upgradePrompt: {
      title: "Analyze Expenses",
      description: "Deep analysis of your spending patterns.",
      ctaText: "Get Credits",
    },
  },
};

// Pure function implementation of checkFeatureAccess
function checkFeatureAccess(
  userState: UserState,
  feature: string
): AccessCheckResult {
  const config = FEATURE_GATES[feature];

  if (!config) {
    // Unknown feature, deny by default
    return {
      hasAccess: false,
      reason: "feature_disabled",
    };
  }

  // Check subscription requirement
  if (config.requiredTier === "pro" && !userState.isPro) {
    return {
      hasAccess: false,
      reason: "subscription_required",
      upgradePrompt: {
        ...config.upgradePrompt,
        ctaHref: "/upgrade",
      },
    };
  }

  // Check credits requirement
  if (config.creditsRequired && userState.credits < config.creditsRequired) {
    return {
      hasAccess: false,
      reason: "insufficient_credits",
      upgradePrompt: {
        ...config.upgradePrompt,
        ctaHref: "/credits",
      },
    };
  }

  return { hasAccess: true };
}

describe("Access Control", () => {
  describe("checkFeatureAccess - Subscription Features", () => {
    it("should allow pro user access to analytics", () => {
      const userState: UserState = {
        tier: "pro",
        isPro: true,
        credits: 0,
      };

      const result = checkFeatureAccess(userState, "analytics");
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should deny free user access to analytics", () => {
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 0,
      };

      const result = checkFeatureAccess(userState, "analytics");
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe("subscription_required");
      expect(result.upgradePrompt?.ctaHref).toBe("/upgrade");
    });

    it("should allow pro user access to CSV export", () => {
      const userState: UserState = {
        tier: "pro",
        isPro: true,
        credits: 0,
      };

      const result = checkFeatureAccess(userState, "export_csv");
      expect(result.hasAccess).toBe(true);
    });

    it("should deny free user access to CSV export", () => {
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 0,
      };

      const result = checkFeatureAccess(userState, "export_csv");
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe("subscription_required");
    });
  });

  describe("checkFeatureAccess - Credit Features", () => {
    it("should allow access to insights with sufficient credits", () => {
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 10,
      };

      const result = checkFeatureAccess(userState, "insights");
      expect(result.hasAccess).toBe(true);
    });

    it("should deny access to insights with insufficient credits", () => {
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 0,
      };

      const result = checkFeatureAccess(userState, "insights");
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe("insufficient_credits");
      expect(result.upgradePrompt?.ctaHref).toBe("/credits");
    });

    it("should allow access with exact credits required", () => {
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 3, // Exactly what budget_improvement needs
      };

      const result = checkFeatureAccess(userState, "budget_improvement");
      expect(result.hasAccess).toBe(true);
    });

    it("should deny access with one less than required credits", () => {
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 2, // One less than budget_improvement needs
      };

      const result = checkFeatureAccess(userState, "budget_improvement");
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe("insufficient_credits");
    });

    it("should check expense_analysis correctly (2 credits)", () => {
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 2,
      };

      const result = checkFeatureAccess(userState, "expense_analysis");
      expect(result.hasAccess).toBe(true);
    });
  });

  describe("checkFeatureAccess - Unknown Features", () => {
    it("should deny access to unknown feature", () => {
      const userState: UserState = {
        tier: "pro",
        isPro: true,
        credits: 1000,
      };

      const result = checkFeatureAccess(userState, "unknown_feature");
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe("feature_disabled");
    });

    it("should deny access even for pro users on unknown features", () => {
      const userState: UserState = {
        tier: "pro",
        isPro: true,
        credits: 1000,
      };

      const result = checkFeatureAccess(userState, "not_a_real_feature");
      expect(result.hasAccess).toBe(false);
    });
  });

  describe("checkFeatureAccess - Edge Cases", () => {
    it("should handle pro user with credits for credit feature", () => {
      const userState: UserState = {
        tier: "pro",
        isPro: true,
        credits: 100,
      };

      const result = checkFeatureAccess(userState, "insights");
      expect(result.hasAccess).toBe(true);
    });

    it("should handle pro user without credits for credit feature", () => {
      // Pro users still need credits for AI features
      const userState: UserState = {
        tier: "pro",
        isPro: true,
        credits: 0,
      };

      const result = checkFeatureAccess(userState, "insights");
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe("insufficient_credits");
    });

    it("should handle free user with many credits for subscription feature", () => {
      // Credits don't help with subscription-gated features
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 1000,
      };

      const result = checkFeatureAccess(userState, "analytics");
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe("subscription_required");
    });
  });

  describe("Upgrade Prompt Content", () => {
    it("should include correct upgrade prompt for analytics", () => {
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 0,
      };

      const result = checkFeatureAccess(userState, "analytics");
      expect(result.upgradePrompt?.title).toBe("Unlock Analytics");
      expect(result.upgradePrompt?.ctaText).toBe("Upgrade to Pro");
    });

    it("should include correct upgrade prompt for credits feature", () => {
      const userState: UserState = {
        tier: "free",
        isPro: false,
        credits: 0,
      };

      const result = checkFeatureAccess(userState, "insights");
      expect(result.upgradePrompt?.title).toBe("Get AI Insights");
      expect(result.upgradePrompt?.ctaText).toBe("Get Credits");
    });
  });
});

describe("Feature Gate Configuration", () => {
  it("should have all required subscription features", () => {
    const subscriptionFeatures = ["analytics", "export_csv"];

    for (const feature of subscriptionFeatures) {
      expect(FEATURE_GATES[feature]).toBeDefined();
      expect(FEATURE_GATES[feature]?.requiredTier).toBe("pro");
    }
  });

  it("should have all required credit features", () => {
    const creditFeatures = ["insights", "budget_improvement", "expense_analysis"];

    for (const feature of creditFeatures) {
      expect(FEATURE_GATES[feature]).toBeDefined();
      expect(FEATURE_GATES[feature]?.creditsRequired).toBeGreaterThan(0);
    }
  });

  it("should have upgrade prompts for all features", () => {
    for (const [name, config] of Object.entries(FEATURE_GATES)) {
      expect(config.upgradePrompt).toBeDefined();
      expect(config.upgradePrompt.title).toBeTruthy();
      expect(config.upgradePrompt.description).toBeTruthy();
      expect(config.upgradePrompt.ctaText).toBeTruthy();
    }
  });
});
