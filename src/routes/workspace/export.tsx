import { createFileRoute } from "@tanstack/react-router";
import { ExportPanel } from "@/components/export-panel";
import { Panel, PanelHeader, KeyValue } from "@/components/panel";
import { useProject } from "@/lib/project-store";
import { API_URL, isBackendConfigured } from "@/lib/api";

export const Route = createFileRoute("/workspace/export")({
  component: ExportPage,
});

function ExportPage() {
  const { image, field, calibration, processingMode } = useProject();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Export</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Download derived products or hand them to the Python service for georeferenced writing.
        </p>
      </div>
      <ExportPanel />
      <Panel>
        <PanelHeader title="Run summary" description="Included in the exported report." />
        <KeyValue label="Source" value={image?.name ?? "none"} />
        <KeyValue label="Mode" value={processingMode === "demo" ? "Demo pipeline" : "AI backend"} />
        <KeyValue
          label="Elevation range"
          value={field ? `${field.min.toFixed(1)}–${field.max.toFixed(1)} m` : "n/a"}
        />
        <KeyValue label="Calibration" value={calibration.applied ? calibration.mode : "not applied"} />
        <KeyValue
          label="Backend"
          value={isBackendConfigured() ? API_URL : "VITE_API_URL not configured"}
        />
      </Panel>
    </div>
  );
}
