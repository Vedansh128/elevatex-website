import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, PanelHeader, KeyValue } from "@/components/panel";
import { LazyTerrainViewer } from "@/components/terrain-viewer-lazy";
import type { ViewerPick } from "@/components/terrain-viewer";
import { DemoBadge } from "@/components/brand";
import { Legend } from "@/components/field-canvas";
import { useProject } from "@/lib/project-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/viewer")({
  head: () => ({
    meta: [
      { title: "3D Terrain Flythrough — ElevateX" },
      {
        name: "description",
        content: "Explore the generated terrain in 3D with orbit, flythrough, wireframe and shading modes.",
      },
      { property: "og:title", content: "3D Terrain Flythrough — ElevateX" },
      {
        property: "og:description",
        content: "Interactive Three.js terrain built from the estimated digital surface model.",
      },
    ],
  }),
  component: ViewerPage,
});


function ViewerPage() {
  const { field, textureUrl, image, loadDemo, processingMode } = useProject();
  const [picks, setPicks] = useState<ViewerPick[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  if (!field) {
    return (
      <EmptyState
        title="No terrain mesh yet"
        description="Generate an elevation model first — the 3D viewer builds its mesh from the DSM."
        action={
          <div className="flex gap-2">
            <Link to="/workspace/upload">
              <Button size="sm">Go to upload</Button>
            </Link>
            <Button size="sm" variant="outline" onClick={loadDemo}>
              Load demo scene
            </Button>
          </div>
        }
      />
    );
  }

  const a = picks[0];
  const b = picks[1];

  return (
    <div
      className={cn(
        "space-y-5",
        fullscreen && "fixed inset-0 z-50 overflow-auto bg-background p-4",
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            Interactive 3D terrain
            {processingMode === "demo" ? <DemoBadge label="DEMO MODE" /> : null}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Orbit, fly through, toggle wireframe/texture and click the surface to read elevation.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setFullscreen((v) => !v)}>
          {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          {fullscreen ? "Exit fullscreen" : "Fullscreen 3D"}
        </Button>
      </div>

      <div className={cn("grid gap-5", !fullscreen && "xl:grid-cols-[1.6fr_1fr]")}>
        <div className={cn(fullscreen ? "h-[78vh]" : "h-[30rem] xl:h-[36rem]")}>
          <LazyTerrainViewer
            field={field}
            textureUrl={textureUrl}
            onPick={(pick) =>
              setPicks((prev) => (prev.length >= 2 ? [pick] : [...prev, pick]))
            }
            picks={picks}
          />
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHeader
              title="Surface readout"
              description="Elevation sampled where you clicked the mesh."
              actions={
                <Button size="sm" variant="ghost" onClick={() => setPicks([])}>
                  Clear
                </Button>
              }
            />
            {a ? (
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  Elevation: {a.elevation.toFixed(1)} m
                </p>
                {b ? (
                  <div className="mt-3">
                    <KeyValue label="Point A" value={`${a.elevation.toFixed(1)} m`} />
                    <KeyValue label="Point B" value={`${b.elevation.toFixed(1)} m`} />
                    <KeyValue
                      label="Elevation difference"
                      value={`${(b.elevation - a.elevation).toFixed(1)} m`}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Click a second point for a height difference, or use Measurements for full slope
                    and profile tools.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click anywhere on the terrain to sample its elevation.
              </p>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Scene" />
            <KeyValue label="Texture" value={image?.url ? "Source RGB projected" : "Procedural"} />
            <KeyValue label="Mesh" value={`${field.grid} × ${field.grid} vertices`} />
            <KeyValue label="Ground sample distance" value={`${field.cellSize} m/cell`} />
            <KeyValue
              label="Elevation range"
              value={`${field.min.toFixed(0)}–${field.max.toFixed(0)} m`}
            />
            <div className="mt-3">
              <Legend colormap="terrain" min={field.min} max={field.max} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
