import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/panel";
import { AnalysisPanel } from "@/components/analysis-panel";
import { useProject } from "@/lib/project-store";

export const Route = createFileRoute("/workspace/measurements")({
  component: MeasurementsPage,
});

function MeasurementsPage() {
  const { field, loadDemo } = useProject();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Measurements & slope analysis</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Height readout, elevation difference, horizontal distance, slope angle and elevation
          profile.
        </p>
      </div>
      {field ? (
        <AnalysisPanel />
      ) : (
        <EmptyState
          title="No surface model to measure"
          description="Run the pipeline on an image, or load the demo scene to try the measurement tools."
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
