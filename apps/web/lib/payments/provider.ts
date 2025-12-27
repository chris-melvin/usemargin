/**
 * Payment Provider Factory
 *
 * Singleton factory that returns the configured payment provider.
 * Provider is determined by PAYMENT_PROVIDER environment variable.
 */

import type { PaymentProvider } from "./types";
import { PAYMENT_PROVIDER } from "./config";
import { PaddleProvider } from "./providers/paddle.provider";

let providerInstance: PaymentProvider | null = null;

/**
 * Get the configured payment provider instance (singleton)
 */
export function getPaymentProvider(): PaymentProvider {
  if (!providerInstance) {
    switch (PAYMENT_PROVIDER) {
      case "paddle":
        providerInstance = new PaddleProvider();
        break;
      case "lemonsqueezy":
        // TODO: Implement LemonSqueezy provider when needed
        // providerInstance = new LemonSqueezyProvider();
        throw new Error("LemonSqueezy provider not yet implemented");
      default:
        throw new Error(`Unknown payment provider: ${PAYMENT_PROVIDER}`);
    }
  }
  return providerInstance;
}

/**
 * Reset the provider instance (useful for testing)
 */
export function resetPaymentProvider(): void {
  providerInstance = null;
}
