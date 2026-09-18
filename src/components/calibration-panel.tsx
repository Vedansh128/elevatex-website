import { useState } from "react";
import { MapPin, Ruler, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader, KeyValue } from "@/components/panel";
import { useProject, type CalibrationMode } from "@/lib/project-store";
import { cn } from "@/lib/utils";

const MODES: { key: CalibrationMode; label: string; detail: string }[] = [
  { key: "dem", label: "DEM calibration", detail: "SRTM 30 m or another low-resolution DEM" },
  { key: "gcp", label: "Ground control points", detail: "Known lat/lon/elevation references" },
  { key: "scene", label: "Scene-based", detail: "Scene statistics + semantic priors" },
];

export function CalibrationPanel() {
  const {
    calibration,
    setCalibrationMode,
    addGcp,
    removeGcp,
    applyCalibration,
    setElevationRange,
    relativeField,
  } = useProject();
  const [draft, setDraft] = useState({ lat: "", lon: "", elevation: "" });

  return (
    <Panel>
      <PanelHeader
        title="Scale calibration"
        description="Convert scale-agnostic relative depth into metric elevation using available geographic reference information."
        actions={
          <Button size="sm" onClick={() => void applyCalibration()} disabled={!relativeField}>
            <Wand2 className="size-3.5" /> Apply calibration
          </Button>
        }
      />

      <div className="grid gap-2 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setCalibrationMode(m.key)}
            className={cn(
              "rounded-lg border border-border bg-surface/60 p-3 text-left transition-colors hover:border-primary/40",
              calibration.mode === m.key && "border-primary/60 bg-primary/10",
            )}
          >
            <span className="block text-xs font-semibold">{m.label}</span>
            <span className="mt-1 block text-[0.68rem] leading-relaxed text-muted-foreground">
              {m.detail}
            </span>
          </button>
        ))}
      </div>

      {calibration.mode === "gcp" ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            {(["lat", "lon", "elevation"] as const).map((k) => (
              <Input
                key={k}
                inputMode="decimal"
                placeholder={
                  k === "lat" ? "Latitude" : k === "lon" ? "Longitude" : "Elevation (m)"
                }
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
              />
            ))}
            <Button
              variant="outline"
              onClick={() => {
                addGcp({
                  lat: Number(draft.lat),
                  lon: Number(draft.lon),
                  elevation: Number(draft.elevation),
                });
                setDraft({ lat: "", lon: "", elevation: "" });
              }}
            >
              <MapPin className="size-3.5" /> Add GCP
            </Button>
          </div>
          {calibration.gcps.length ? (
            <ul className="space-y-1">
              {calibration.gcps.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-md border border-border bg-surface/50 px-3 py-1.5 font-mono text-[0.7rem]"
                >
                  <span>
                    {g.lat.toFixed(5)}, {g.lon.toFixed(5)} · {g.elevation} m
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGcp(g.id)}
                    aria-label="Remove point"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.7rem] text-muted-foreground">
              Add at least two points to solve scale and vertical offset.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="mono-label">Min elevation (m)</span>
            <Input
              inputMode="numeric"
              value={calibration.minElevation}
              onChange={(e) =>
                setElevationRange(Number(e.target.value) || 0, calibration.maxElevation)
              }
            />
          </label>
          <label className="space-y-1.5">
            <span className="mono-label">Max elevation (m)</span>
            <Input
              inputMode="numeric"
              value={calibration.maxElevation}
              onChange={(e) =>
                setElevationRange(calibration.minElevation, Number(e.target.value) || 0)
              }
            />
          </label>
        </div>
      )}

      <div className="mt-5 rounded-lg border border-border bg-surface/50 p-3">
        <span className="mono-label flex items-center gap-2">
          <Ruler className="size-3.5" /> Calibration status
        </span>
        <div className="mt-2">
          <KeyValue
            label="Status"
            value={calibration.applied ? "Applied" : "Not applied"}
          />
          <KeyValue label="Reference" value={calibration.referenceLabel} />
          <KeyValue
            label="Reference points"
            value={calibration.mode === "gcp" ? calibration.gcps.length : "n/a"}
          />
          <KeyValue label="Estimated scale" value={`${calibration.scale} m / unit depth`} />
          <KeyValue label="Vertical offset" value={`${calibration.offset} m`} />
          <KeyValue
            label="Confidence"
            value={`${Math.round(calibration.confidence * 100)}%`}
          />
        </div>
        <p className="mt-2 text-[0.68rem] leading-relaxed text-muted-foreground">
          Values shown are demo estimates until a real DEM tile, GCP survey or backend calibration
          response is supplied.
        </p>
      </div>
    </Panel>
  );
}
