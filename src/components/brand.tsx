import { cn } from "@/lib/utils";

export function Logo({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        role="img"
        aria-label="ElevateX logo"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="ex-grad" x1="0" y1="40" x2="40" y2="0">
            <stop offset="0%" stopColor="oklch(0.66 0.14 232)" />
            <stop offset="55%" stopColor="oklch(0.79 0.14 196)" />
            <stop offset="100%" stopColor="oklch(0.74 0.15 165)" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="38" height="38" rx="11" fill="oklch(0.22 0.03 258)" />
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          fill="none"
          stroke="url(#ex-grad)"
          strokeOpacity="0.5"
        />
        <path
          d="M7 29c4-1.5 6.5-6 9.5-9.5S23 13 26.5 11"
          fill="none"
          stroke="url(#ex-grad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10 33c4-1.5 7-7 10.5-11S28 16 32 14"
          fill="none"
          stroke="url(#ex-grad)"
          strokeWidth="1.4"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />
        <path
          d="M25 10h8v8"
          fill="none"
          stroke="url(#ex-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-tight">
          Elevate<span className="text-gradient-brand">X</span>
        </span>
        <span className="mono-label mt-1 text-[0.6rem]">Geospatial AI</span>
      </span>
    </span>
  );
}

export function SihBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-raised/70 px-3 py-1 text-[0.68rem] font-medium tracking-wide text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-primary" />
      SIH 26175 • Geospatial AI
    </span>
  );
}

export function DemoBadge({ className, label = "DEMO DATA" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/12 px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.12em] text-warning",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-warning" />
      {label}
    </span>
  );
}

export function StatusPill({
  status,
}: {
  status: "idle" | "processing" | "complete" | "failed";
}) {
  const map = {
    idle: { label: "Ready", color: "bg-muted-foreground" },
    processing: { label: "Processing", color: "bg-primary animate-pulse" },
    complete: { label: "Complete", color: "bg-success" },
    failed: { label: "Failed", color: "bg-destructive" },
  } as const;
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs text-foreground/90">
      <span className={cn("size-1.5 rounded-full", s.color)} />
      {s.label}
    </span>
  );
}
