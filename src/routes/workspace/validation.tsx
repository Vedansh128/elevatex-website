import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/panel";
import { ValidationPanel } from "@/components/validation-panel";
import { useProject } from "@/lib/project-store";

export const Route = createFileRoute("/workspace/validation")({
  component: ValidationPage,
});

function ValidationPage() {
  const { field, loadDemo } = useProject();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Validation</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Accuracy metrics against reference elevation data. All figures are demo values until a real
          reference dataset and backend are connected.
        </p>
      </div>
      {field ? (
        <ValidationPanel />
      ) : (
        <EmptyState
          title="Nothing to validate yet"
          description="A predicted DSM is required before it can be compared with reference elevation data."
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
