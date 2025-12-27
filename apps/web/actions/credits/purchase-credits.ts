"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import {
  getPaymentProvider,
  getCreditPack,
  CREDIT_PACKS,
  type CheckoutSession,
} from "@/lib/payments";
import { z } from "zod";

const purchaseCreditsSchema = z.object({
  packId: z.enum(["pack_25", "pack_75", "pack_200"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;

/**
 * Get available credit packs
 */
export async function getCreditPacks() {
  return success(CREDIT_PACKS);
}

/**
 * Create a checkout session to purchase a credit pack
 */
export async function purchaseCredits(
  input: PurchaseCreditsInput
): Promise<ActionResult<CheckoutSession>> {
  // 1. Authentication check
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, email } = authResult.data;

  // 2. Validate input
  const validation = purchaseCreditsSchema.safeParse(input);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  // 3. Verify pack exists
  const pack = getCreditPack(validation.data.packId);
  if (!pack) {
    return error("Invalid credit pack", "VALIDATION_ERROR");
  }

  // 4. Create checkout session
  try {
    const provider = getPaymentProvider();
    const session = await provider.createCreditPackCheckout({
      userId,
      email: email ?? "",
      packId: validation.data.packId,
      successUrl: validation.data.successUrl,
      cancelUrl: validation.data.cancelUrl,
    });

    return success(session);
  } catch (err) {
    console.error("Failed to create credit pack checkout:", err);
    return error("Failed to create checkout session", "INTERNAL_ERROR");
  }
}

/**
 * Create checkout from form data
 */
export async function purchaseCreditsFromForm(
  formData: FormData
): Promise<ActionResult<CheckoutSession>> {
  const packIdRaw = formData.get("packId");
  const successUrl = formData.get("successUrl");
  const cancelUrl = formData.get("cancelUrl");

  // Validate input with Zod schema
  const validation = purchaseCreditsSchema.safeParse({
    packId: packIdRaw,
    successUrl,
    cancelUrl,
  });

  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  return purchaseCredits(validation.data);
}
