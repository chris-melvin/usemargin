"use client";

import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePaddle } from "@/components/paddle";
import { createCheckout } from "@/actions/subscriptions/create-checkout";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CheckoutButtonProps extends Omit<ComponentProps<typeof Button>, "onClick"> {
  billingCycle: "monthly" | "yearly";
  isLoggedIn: boolean;
  children: React.ReactNode;
}

export function CheckoutButton({
  billingCycle,
  isLoggedIn,
  children,
  disabled,
  ...props
}: CheckoutButtonProps) {
  const router = useRouter();
  const { paddle, isLoaded } = usePaddle();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    // If not logged in, redirect to login
    if (!isLoggedIn) {
      router.push("/login?redirect=/pricing");
      return;
    }

    // Check if Paddle is loaded
    if (!paddle || !isLoaded) {
      toast.error("Payment system is loading. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Create checkout session via server action
      const result = await createCheckout({
        billingCycle,
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to create checkout");
        return;
      }

      // Open Paddle overlay with the transaction ID
      paddle.Checkout.open({
        transactionId: result.data.sessionId,
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
