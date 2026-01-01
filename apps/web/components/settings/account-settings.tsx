"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { LogOut, Crown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/actions/auth";
import { getPortalUrl } from "@/actions/subscriptions";
import type { SubscriptionInfo } from "@/actions/subscriptions/get-subscription";

interface AccountSettingsProps {
  userEmail: string;
  subscription: SubscriptionInfo | null;
}

export function AccountSettings({ userEmail, subscription }: AccountSettingsProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  const handleManageSubscription = () => {
    startTransition(async () => {
      const result = await getPortalUrl();
      if (result.success && result.data) {
        window.location.href = result.data.portalUrl;
      } else {
        toast.error("Failed to open subscription portal");
      }
    });
  };

  const userInitial = userEmail.charAt(0).toUpperCase();
  const isPro = subscription?.tier === "pro";

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-amber-100 text-amber-700 text-xl font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">
                {userEmail}
              </p>
              <p className="text-xs text-stone-500">
                Signed in with email
              </p>
            </div>
          </div>

          <Separator />

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="bg-stone-50"
            />
            <p className="text-xs text-stone-500">
              Your email cannot be changed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-stone-200">
                <Crown className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-stone-900">Free Plan</p>
                  <Badge variant="secondary">free</Badge>
                </div>
                <p className="text-xs text-stone-500">
                  Pro features coming soon
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Button className="w-full gap-2" disabled>
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </Button>
            <Badge className="absolute -top-2 -right-2 bg-amber-500 hover:bg-amber-500">
              Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sign Out */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleSignOut}
            disabled={isPending}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>

          <Separator />

          {/* Danger Zone - Coming Soon */}
          <div className="space-y-3 opacity-60">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-medium">Danger Zone</p>
              <Badge variant="outline" className="text-xs font-normal">Coming Soon</Badge>
            </div>
            <Button variant="destructive" className="w-full" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
