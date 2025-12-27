"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import { getPaymentProvider, type CheckoutSession } from "@/lib/payments";
import { z } from "zod";

const createCheckoutSchema = z.object({
  billingCycle: z.enum(["monthly", "yearly"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

/**
 * Create a checkout session for a new subscription
 */
export async function createCheckout(
  input: CreateCheckoutInput
): Promise<ActionResult<CheckoutSession>> {
  // 1. Authentication check
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, email } = authResult.data;

  // 2. Validate input
  const validation = createCheckoutSchema.safeParse(input);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  // 3. Create checkout session
  try {
    const provider = getPaymentProvider();
    const session = await provider.createCheckout({
      userId,
      email: email ?? "",
      billingCycle: validation.data.billingCycle,
      successUrl: validation.data.successUrl,
      cancelUrl: validation.data.cancelUrl,
    });

    return success(session);
  } catch (err) {
    console.error("Failed to create checkout:", err);
    return error("Failed to create checkout session", "INTERNAL_ERROR");
  }
}

/**
 * Create checkout from form data
 */
export async function createCheckoutFromForm(
  formData: FormData
): Promise<ActionResult<CheckoutSession>> {
  const input = {
    billingCycle: formData.get("billingCycle") as "monthly" | "yearly",
    successUrl: formData.get("successUrl") as string,
    cancelUrl: formData.get("cancelUrl") as string,
  };

  return createCheckout(input);
}
