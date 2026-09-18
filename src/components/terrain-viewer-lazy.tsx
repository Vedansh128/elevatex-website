import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { ColormapName, HeightField } from "@/lib/terrain";
import type { ViewerPick } from "./terrain-viewer";

const TerrainViewer = lazy(() => import("./terrain-viewer"));

function ViewerSkeleton() {
  return (
    <div className="grid-backdrop flex h-full w-full items-center justify-center rounded-xl border border-border bg-surface/50">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" /> Preparing 3D terrain…
      </span>
    </div>
  );
}

export function LazyTerrainViewer(props: {
  field: HeightField;
  textureUrl: string | null;
  colormapName?: ColormapName;
  onPick?: (pick: ViewerPick) => void;
  picks?: ViewerPick[];
}) {
  return (
    <ClientOnly fallback={<ViewerSkeleton />}>
      <Suspense fallback={<ViewerSkeleton />}>
        <TerrainViewer {...props} />
      </Suspense>
    </ClientOnly>
  );
}
