"use client";

import { useState } from "react";
import Link from "next/link";
import type { RoadmapItem, RoadmapStatus } from "@repo/database";
import { RoadmapBoard } from "@/components/roadmap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RoadmapPageClientProps {
  items: Record<RoadmapStatus, RoadmapItem[]>;
  votedItemIds: string[];
  isAuthenticated: boolean;
}

export function RoadmapPageClient({
  items,
  votedItemIds,
  isAuthenticated,
}: RoadmapPageClientProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  return (
    <>
      <RoadmapBoard
        items={items}
        votedItemIds={votedItemIds}
        isAuthenticated={isAuthenticated}
        onAuthRequired={() => setShowAuthDialog(true)}
      />

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to vote</DialogTitle>
            <DialogDescription>
              Create a free account or sign in to vote for features you want to
              see prioritized.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Button asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/signup">Create Free Account</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
