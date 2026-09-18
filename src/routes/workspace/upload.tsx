import { createFileRoute } from "@tanstack/react-router";
import { UploadPanel } from "@/components/upload-panel";
import { PipelineStages } from "@/components/pipeline";
import { Panel, PanelHeader } from "@/components/panel";
import { useProject } from "@/lib/project-store";

export const Route = createFileRoute("/workspace/upload")({
  component: UploadPage,
});

function UploadPage() {
  const { status } = useProject();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Image upload & processing</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Georeferenced GeoTIFF gives a calibrated absolute DSM; JPG/PNG gives relative elevation
          unless calibration data is supplied.
        </p>
      </div>
      <UploadPanel />
      {status !== "idle" ? (
        <Panel>
          <PanelHeader title="Pipeline" description="Stage-by-stage progress of the current run." />
          <PipelineStages />
        </Panel>
      ) : null}
    </div>
  );
}
