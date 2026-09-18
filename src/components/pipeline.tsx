import { Check, Circle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES, useProject } from "@/lib/project-store";

export function PipelineStages({ compact }: { compact?: boolean }) {
  const { stages, status, processingMode, backendConfigured } = useProject();
  const done = STAGES.filter((s) => stages[s.key] === "done").length;
  const progress = Math.round((done / STAGES.length) * 100);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="mono-label">Pipeline progress</span>
          <span className="font-mono text-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="bg-gradient-brand h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[0.68rem] text-muted-foreground">
          {backendConfigured
            ? processingMode === "backend"
              ? "Real mode — stages executed by the connected FastAPI service."
              : "Backend configured but unreachable — demo fallback in use."
            : "Demo mode — stages simulated in the browser. No AI inference is performed."}
        </p>
      </div>

      <ol className={cn("space-y-1", compact && "space-y-0.5")}>
        {STAGES.map((stage, i) => {
          const s = stages[stage.key];
          return (
            <li
              key={stage.key}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-colors",
                s === "running" && "border-primary/30 bg-primary/8",
                s === "done" && "bg-surface/40",
              )}
            >
              <span className="mono-label w-5 shrink-0 text-right">{i + 1}</span>
              <span className="flex size-5 shrink-0 items-center justify-center">
                {s === "done" ? (
                  <Check className="size-4 text-success" />
                ) : s === "running" ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : s === "failed" ? (
                  <X className="size-4 text-destructive" />
                ) : (
                  <Circle className="size-3 text-muted-foreground/60" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{stage.label}</span>
                {!compact ? (
                  <span className="block truncate text-[0.68rem] text-muted-foreground">
                    {stage.detail}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>

      {status === "complete" ? (
        <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
          Elevation model generated successfully.
        </p>
      ) : null}
    </div>
  );
}

export function PipelineFlow({ className }: { className?: string }) {
  const steps = ["RGB Image", "AI Depth", "Scale Calibration", "DSM", "3D Terrain"];
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <span className="rounded-md border border-border bg-surface/70 px-2.5 py-1 font-mono text-[0.68rem] text-foreground/85">
            {step}
          </span>
          {i < steps.length - 1 ? <span className="text-primary/70">→</span> : null}
        </div>
      ))}
    </div>
  );
}
