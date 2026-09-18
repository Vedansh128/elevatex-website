import { useRef, useState } from "react";
import { FileImage, Globe2, Play, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, KeyValue } from "@/components/panel";
import { DemoBadge } from "@/components/brand";
import { ACCEPTED_EXT, MAX_FILE_MB, useProject } from "@/lib/project-store";
import { cn } from "@/lib/utils";

function formatSize(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function UploadPanel() {
  const { image, status, setFile, removeImage, process, loadDemo } = useProject();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
      <Panel>
        <PanelHeader
          title="Image upload"
          description="Supported imagery: RGB aerial and satellite images (JPG, JPEG, PNG, TIFF, GeoTIFF)."
          actions={
            <Button variant="outline" size="sm" onClick={loadDemo}>
              <Sparkles className="size-3.5" /> Load demo scene
            </Button>
          }
        />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void setFile(file);
          }}
          className={cn(
            "grid-backdrop relative flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong px-6 py-12 text-center transition-colors",
            dragging && "border-primary/70 bg-primary/8",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-surface-raised">
            <Upload className="size-5 text-primary" />
          </span>
          <p className="text-sm font-medium">Drag & drop an aerial or satellite image</p>
          <p className="text-xs text-muted-foreground">
            {ACCEPTED_EXT.map((e) => `.${e}`).join(" · ")} — up to {MAX_FILE_MB} MB
          </p>
          <Button size="sm" onClick={() => inputRef.current?.click()}>
            Browse files
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.tif,.tiff"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void setFile(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => void process()}
            disabled={!image || status === "processing"}
            className="gap-2"
          >
            <Play className="size-3.5" />
            {status === "processing" ? "Processing…" : "Process image"}
          </Button>
          <Button variant="ghost" onClick={removeImage} disabled={!image}>
            <Trash2 className="size-3.5" /> Remove
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Source metadata"
          badge={image?.isDemo ? <DemoBadge /> : undefined}
          description={
            image
              ? undefined
              : "Upload an image or load the demo scene to inspect file and geospatial metadata."
          }
        />
        {image ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                {image.url ? (
                  <img src={image.url} alt={image.name} className="size-full object-cover" />
                ) : (
                  <FileImage className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium">{image.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(image.sizeBytes)} · {image.type || "unknown type"}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {image.width && image.height
                    ? `${image.width} × ${image.height} px`
                    : "Resolution read on the server"}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "rounded-lg border px-3 py-2.5 text-xs",
                image.georeferenced
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/30 bg-warning/10 text-warning",
              )}
            >
              <span className="flex items-center gap-2 font-semibold">
                <Globe2 className="size-3.5" />
                {image.georeferenced ? "Georeferenced image detected" : "Non-georeferenced image"}
              </span>
              <p className="mt-1 leading-relaxed opacity-90">
                {image.georeferenced
                  ? "Absolute DSM mode: elevation is calibrated to metres using the embedded CRS and a DEM reference."
                  : "Relative elevation mode will be used unless calibration data is provided."}
              </p>
            </div>

            {image.geo ? (
              <div>
                <KeyValue label="CRS" value={image.geo.crs} />
                <KeyValue
                  label="Coordinate bounds"
                  value={
                    image.geo.pixelResolution
                      ? `${image.geo.bounds.west.toFixed(4)}, ${image.geo.bounds.south.toFixed(4)} → ${image.geo.bounds.east.toFixed(4)}, ${image.geo.bounds.north.toFixed(4)}`
                      : "pending backend read"
                  }
                />
                <KeyValue
                  label="Pixel resolution"
                  value={
                    image.geo.pixelResolution ? `${image.geo.pixelResolution} m/px` : "pending"
                  }
                />
                <KeyValue
                  label="Geographic extent"
                  value={image.geo.extentKm2 ? `${image.geo.extentKm2} km²` : "pending"}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
