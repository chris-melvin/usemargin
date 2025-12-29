import { Suspense } from "react";
import { getAllRoadmapItems } from "@/actions/roadmap";
import { RoadmapManager } from "@/components/admin/roadmap-manager";

export const metadata = {
  title: "Roadmap Management | Admin",
};

async function RoadmapContent() {
  const result = await getAllRoadmapItems();

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Failed to load roadmap items. Please try again later.
        </p>
      </div>
    );
  }

  return <RoadmapManager initialItems={result.data} />;
}

export default function AdminRoadmapPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Roadmap</h1>
        <p className="text-muted-foreground mt-1">
          Manage public roadmap items and feature requests.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-10 w-full bg-stone-200 rounded animate-pulse" />
            <div className="h-64 w-full bg-stone-100 rounded animate-pulse" />
          </div>
        }
      >
        <RoadmapContent />
      </Suspense>
    </div>
  );
}
