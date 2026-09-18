import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/panel";
import { ElevationAnalysis } from "@/components/elevation-analysis";
import { CalibrationPanel } from "@/components/calibration-panel";
import { useProject } from "@/lib/project-store";

export const Route = createFileRoute("/workspace/elevation")({
  component: ElevationPage,
});

function ElevationPage() {
  const { field, loadDemo } = useProject();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Elevation analysis</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Synchronized RGB, relative depth and DSM views with scale calibration.
        </p>
      </div>
      {field ? (
        <>
          <ElevationAnalysis />
          <CalibrationPanel />
        </>
      ) : (
        <EmptyState
          title="No elevation model yet"
          description="Upload an image and run the pipeline, or load the demo scene to explore the analysis views."
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
      )}
    </div>
  );
}
