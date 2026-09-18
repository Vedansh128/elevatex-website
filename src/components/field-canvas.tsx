import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { colormapCss, paintField, type ColormapName, type RasterOptions } from "@/lib/terrain";

export function FieldCanvas({
  values,
  grid,
  range,
  options,
  className,
  onPick,
  overlay,
}: {
  values: Float32Array;
  grid: number;
  range: { min: number; max: number };
  options?: RasterOptions;
  className?: string;
  onPick?: (u: number, v: number) => void;
  overlay?: React.ReactNode;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) paintField(ref.current, values, grid, range, options);
  }, [values, grid, range, options]);

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border", className)}>
      <canvas
        ref={ref}
        onClick={
          onPick
            ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onPick(
                  (e.clientX - rect.left) / rect.width,
                  (e.clientY - rect.top) / rect.height,
                );
              }
            : undefined
        }
        className={cn(
          "block h-full w-full [image-rendering:auto]",
          onPick && "cursor-crosshair",
        )}
      />
      {overlay}
    </div>
  );
}

export function Legend({
  colormap,
  min,
  max,
  unit = "m",
  lowLabel = "Low elevation",
  highLabel = "High elevation",
}: {
  colormap: ColormapName;
  min: number;
  max: number;
  unit?: string;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className="h-2 w-full rounded-full border border-border"
        style={{ background: colormapCss(colormap) }}
      />
      <div className="flex justify-between text-[0.65rem] text-muted-foreground">
        <span>
          {lowLabel} · {min.toFixed(0)} {unit}
        </span>
        <span>
          {highLabel} · {max.toFixed(0)} {unit}
        </span>
      </div>
    </div>
  );
}
