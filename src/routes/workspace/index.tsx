import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, Layers, Maximize, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, StatCard, KeyValue } from "@/components/panel";
import { PipelineStages } from "@/components/pipeline";
import { DemoBadge } from "@/components/brand";
import { useProject } from "@/lib/project-store";

export const Route = createFileRoute("/workspace/")({
  component: Overview,
});

function Overview() {
  const { image, status, field, calibration, loadDemo, process, processingMode, backendConfigured } =
    useProject();

  const coverageKm2 = field
    ? (((field.grid - 1) * field.cellSize) ** 2 / 1_000_000).toFixed(2)
    : image?.geo?.extentKm2?.toFixed(2);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Project overview</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Single-view height estimation pipeline · SIH 26175 DepthWizard
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={loadDemo}>
            <Sparkles className="size-3.5" /> Load demo scene
          </Button>
          <Button size="sm" onClick={() => void process()} disabled={!image || status === "processing"}>
            <Play className="size-3.5" /> Run pipeline
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Image resolution"
          value={image ? (image.width ? `${image.width} × ${image.height}` : "server read") : "—"}
          hint={image ? image.type : "No image loaded"}
        />
        <StatCard
          label="Processing status"
          value={
            status === "idle"
              ? "Ready"
              : status === "processing"
                ? "Processing"
                : status === "complete"
                  ? "Complete"
                  : "Failed"
          }
          hint={processingMode === "demo" ? "Demo pipeline" : "AI backend"}
        />
        <StatCard
          label="Elevation range"
          value={field ? `${field.min.toFixed(0)}–${field.max.toFixed(0)} m` : "—"}
          hint={calibration.applied ? "Calibrated" : "Awaiting calibration"}
          accent
        />
        <StatCard
          label="Terrain coverage"
          value={coverageKm2 ? `${coverageKm2} km²` : "—"}
          hint={image?.georeferenced ? "From georeferenced extent" : "Relative extent"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <Panel>
          <PanelHeader
            title="Processing pipeline"
            description="RGB image → AI depth → scale calibration → DSM → 3D terrain."
            badge={processingMode === "demo" ? <DemoBadge label="DEMO MODE" /> : undefined}
          />
          <PipelineStages />
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Dataset" description={image ? undefined : "Nothing loaded yet."} />
            {image ? (
              <div>
                <KeyValue label="File" value={image.name} />
                <KeyValue
                  label="Mode"
                  value={image.georeferenced ? "Absolute DSM (georeferenced)" : "Relative elevation"}
                />
                <KeyValue label="CRS" value={image.geo?.crs ?? "n/a"} />
                <KeyValue
                  label="Ground resolution"
                  value={image.geo?.pixelResolution ? `${image.geo.pixelResolution} m/px` : "n/a"}
                />
                <KeyValue
                  label="Calibration confidence"
                  value={`${Math.round(calibration.confidence * 100)}%`}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Link to="/workspace/upload">
                  <Button size="sm" variant="outline">
                    Upload image <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={loadDemo}>
                  Load demo scene
                </Button>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Next steps"
              description={
                backendConfigured
                  ? "Backend URL configured — real inference runs when the service responds."
                  : "No VITE_API_URL configured, so processing stays in clearly-labelled demo mode."
              }
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Link to="/workspace/elevation">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Layers className="size-3.5" /> Elevation analysis
                </Button>
              </Link>
              <Link to="/workspace/viewer">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Boxes className="size-3.5" /> 3D terrain viewer
                </Button>
              </Link>
              <Link to="/workspace/measurements">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Maximize className="size-3.5" /> Measurements
                </Button>
              </Link>
              <Link to="/workspace/validation">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Validation dashboard
                </Button>
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
