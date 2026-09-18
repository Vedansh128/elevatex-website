import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel, PanelHeader } from "@/components/panel";
import { FieldCanvas, Legend } from "@/components/field-canvas";
import { DemoBadge } from "@/components/brand";
import { useProject } from "@/lib/project-store";
import type { ColormapName } from "@/lib/terrain";

const COLORMAPS: ColormapName[] = ["terrain", "viridis", "magma", "grayscale"];

const DEFAULTS = { opacity: 100, contrast: 1, colormap: "terrain" as ColormapName };

export function ElevationAnalysis() {
  const { field, relativeField, image, calibration } = useProject();
  const [opacity, setOpacity] = useState(DEFAULTS.opacity);
  const [contrast, setContrast] = useState(DEFAULTS.contrast);
  const [cmap, setCmap] = useState<ColormapName>(DEFAULTS.colormap);
  const [minClip, setMinClip] = useState<number | null>(null);
  const [maxClip, setMaxClip] = useState<number | null>(null);

  if (!field || !relativeField) return null;

  const lo = minClip ?? Math.round(field.min);
  const hi = maxClip ?? Math.round(field.max);

  const reset = () => {
    setOpacity(DEFAULTS.opacity);
    setContrast(DEFAULTS.contrast);
    setCmap(DEFAULTS.colormap);
    setMinClip(null);
    setMaxClip(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel>
          <PanelHeader
            title="Original RGB"
            badge={image?.isDemo ? <DemoBadge /> : undefined}
            description={image?.name}
          />
          <div className="aspect-square overflow-hidden rounded-lg border border-border bg-surface">
            {image?.url ? (
              <img src={image.url} alt="Source imagery" className="size-full object-cover" />
            ) : (
              <div className="grid-backdrop flex size-full items-center justify-center text-xs text-muted-foreground">
                GeoTIFF preview renders on the backend
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Relative depth" description="Scale-agnostic depth, normalized 0–1." />
          <FieldCanvas
            className="aspect-square w-full"
            values={relativeField.data}
            grid={relativeField.grid}
            range={{ min: relativeField.min, max: relativeField.max }}
            options={{ colormap: "viridis", contrast }}
          />
          <div className="mt-3">
            <Legend
              colormap="viridis"
              min={0}
              max={1}
              unit=""
              lowLabel="Near / low"
              highLabel="Far / high"
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Elevation / DSM"
            description={
              calibration.applied
                ? `Calibrated metric surface (${lo}–${hi} m)`
                : "Uncalibrated — apply scale calibration for metric values"
            }
          />
          <div style={{ opacity: opacity / 100 }}>
            <FieldCanvas
              className="aspect-square w-full"
              values={field.data}
              grid={field.grid}
              range={{ min: field.min, max: field.max }}
              options={{ colormap: cmap, contrast, minClip: lo, maxClip: hi, contours: true }}
            />
          </div>
          <div className="mt-3">
            <Legend colormap={cmap} min={lo} max={hi} />
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Layer controls"
          actions={
            <Button size="sm" variant="ghost" onClick={reset}>
              <RotateCcw className="size-3.5" /> Reset view
            </Button>
          }
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="mono-label">Opacity · {opacity}%</span>
            <Slider
              value={[opacity]}
              min={20}
              max={100}
              step={1}
              onValueChange={(v) => setOpacity(v[0])}
            />
          </label>
          <label className="space-y-2">
            <span className="mono-label">Contrast · {contrast.toFixed(2)}×</span>
            <Slider
              value={[contrast]}
              min={0.5}
              max={2.5}
              step={0.05}
              onValueChange={(v) => setContrast(v[0])}
            />
          </label>
          <label className="space-y-2">
            <span className="mono-label">Min elevation · {lo} m</span>
            <Slider
              value={[lo]}
              min={Math.floor(field.min)}
              max={Math.ceil(field.max)}
              step={1}
              onValueChange={(v) => setMinClip(Math.min(v[0], hi - 1))}
            />
          </label>
          <label className="space-y-2">
            <span className="mono-label">Max elevation · {hi} m</span>
            <Slider
              value={[hi]}
              min={Math.floor(field.min)}
              max={Math.ceil(field.max)}
              step={1}
              onValueChange={(v) => setMaxClip(Math.max(v[0], lo + 1))}
            />
          </label>
          <label className="space-y-2">
            <span className="mono-label">Colormap</span>
            <Select value={cmap} onValueChange={(v) => setCmap(v as ColormapName)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORMAPS.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </Panel>
    </div>
  );
}
