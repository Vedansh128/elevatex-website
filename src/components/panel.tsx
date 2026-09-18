import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  bleed,
}: {
  children: ReactNode;
  className?: string | undefined;
  bleed?: boolean | undefined;

}) {
  return <div className={cn("panel", bleed ? "" : "p-5", className)}>{children}</div>;
}

export function PanelHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  badge?: ReactNode | undefined;

}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {badge}
        </div>
        {description ? (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  accent?: boolean | undefined;

}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="mono-label">{label}</span>
        {icon ? <span className="text-primary/80">{icon}</span> : null}
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tracking-tight",
          accent && "text-gradient-brand",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode | undefined;

}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid-backdrop absolute inset-0 -z-10 opacity-40" aria-hidden />
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
