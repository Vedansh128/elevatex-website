import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Mountain, RotateCcw, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, KeyValue } from "@/components/panel";
import { FieldCanvas, Legend } from "@/components/field-canvas";
import { useProject } from "@/lib/project-store";
import {
  elevationProfile,
  groundDistance,
  sampleHeight,
  slopeField,
  type HeightField,
} from "@/lib/terrain";

type Pt = { u: number; v: number; elevation: number };

function Marker({ point, label }: { point: Pt; label: string }) {
  return (
    <span
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${point.u * 100}%`, top: `${point.v * 100}%` }}
    >
      <span className="flex size-4 items-center justify-center rounded-full border border-background bg-primary text-[0.55rem] font-bold text-primary-foreground">
        {label}
      </span>
    </span>
  );
}

export function AnalysisPanel() {
  const { field } = useProject();
  const [points, setPoints] = useState<Pt[]>([]);
  const [showSlope, setShowSlope] = useState(false);

  const slope = useMemo(() => (field ? slopeField(field) : null), [field]);

  if (!field) return null;

  const a = points[0];
  const b = points[1];
  const metrics = a && b ? deriveMetrics(field, a, b) : null;
  const profile = a && b ? elevationProfile(field, a, b) : [];

  const pick = (u: number, v: number) => {
    const elevation = sampleHeight(field, u, v);
    setPoints((prev) => (prev.length >= 2 ? [{ u, v, elevation }] : [...prev, { u, v, elevation }]));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Panel>
          <PanelHeader
            title={showSlope ? "Slope map" : "Measurement surface"}
            description="Click the raster to place measurement points. Point A then point B gives height difference, distance and slope."
            actions={
              <>
                <Button
                  size="sm"
                  variant={showSlope ? "secondary" : "outline"}
                  onClick={() => setShowSlope((v) => !v)}
                >
                  <Mountain className="size-3.5" /> Toggle slope map
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPoints([])}>
                  <RotateCcw className="size-3.5" /> Clear
                </Button>
              </>
            }
          />
          <FieldCanvas
            className="aspect-square w-full"
            values={showSlope && slope ? slope.data : field.data}
            grid={field.grid}
            range={
              showSlope && slope ? { min: 0, max: slope.max } : { min: field.min, max: field.max }
            }
            options={{ colormap: showSlope ? "slope" : "terrain", contours: !showSlope }}
            onPick={pick}
            overlay={
              <>
                {a ? <Marker point={a} label="A" /> : null}
                {b ? <Marker point={b} label="B" /> : null}
                {a && b ? (
                  <svg className="pointer-events-none absolute inset-0 size-full">
                    <line
                      x1={`${a.u * 100}%`}
                      y1={`${a.v * 100}%`}
                      x2={`${b.u * 100}%`}
                      y2={`${b.v * 100}%`}
                      stroke="oklch(0.79 0.14 196)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                  </svg>
                ) : null}
              </>
            }
          />
          <div className="mt-3">
            {showSlope && slope ? (
              <Legend
                colormap="slope"
                min={0}
                max={slope.max}
                unit="°"
                lowLabel="Flat"
                highLabel="Steep"
              />
            ) : (
              <Legend colormap="terrain" min={field.min} max={field.max} />
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Height & slope measurement"
            description="Values are read from the generated surface model at the picked cells."
            actions={
              <Button size="sm" variant="outline" onClick={() => setPoints([])}>
                <Ruler className="size-3.5" /> Measure height
              </Button>
            }
          />
          {!a ? (
            <p className="text-xs text-muted-foreground">
              Pick a point on the raster (or in the 3D viewer) to read its elevation.
            </p>
          ) : (
            <div>
              <p className="text-3xl font-semibold tracking-tight">
                Elevation: {a.elevation.toFixed(1)} m
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Point A · u {a.u.toFixed(3)}, v {a.v.toFixed(3)}
              </p>
              {metrics ? (
                <div className="mt-4">
                  <KeyValue label="Point A elevation" value={`${a.elevation.toFixed(1)} m`} />
                  <KeyValue label="Point B elevation" value={`${b.elevation.toFixed(1)} m`} />
                  <KeyValue
                    label="Elevation difference"
                    value={`${metrics.diff.toFixed(1)} m`}
                  />
                  <KeyValue
                    label="Horizontal distance"
                    value={`${metrics.distance.toFixed(1)} m`}
                  />
                  <KeyValue label="Slope" value={`${metrics.slope.toFixed(1)}°`} />
                  <KeyValue
                    label="Vertical structure height"
                    value={`${Math.abs(metrics.diff).toFixed(1)} m (A→B delta)`}
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Pick a second point for difference, distance and slope.
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Elevation profile"
          description="Distance versus elevation along the A → B transect drawn on the raster."
        />
        {profile.length ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profile} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="oklch(1 0 0 / 8%)" vertical={false} />
                <XAxis
                  dataKey="distance"
                  tick={{ fontSize: 11, fill: "oklch(0.7 0.022 254)" }}
                  tickFormatter={(v: number) => `${v} m`}
                  stroke="oklch(1 0 0 / 12%)"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.7 0.022 254)" }}
                  tickFormatter={(v: number) => `${v} m`}
                  stroke="oklch(1 0 0 / 12%)"
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.03 258)",
                    border: "1px solid oklch(1 0 0 / 12%)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} m`, "Elevation"]}
                  labelFormatter={(v: number) => `${v} m along transect`}
                />
                <Line
                  type="monotone"
                  dataKey="elevation"
                  stroke="oklch(0.79 0.14 196)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Draw a transect by picking two points to generate the profile graph.
          </p>
        )}
      </Panel>
    </div>
  );
}

function deriveMetrics(field: HeightField, a: Pt, b: Pt) {
  const distance = groundDistance(field, a, b);
  const diff = b.elevation - a.elevation;
  const slope = (Math.atan(Math.abs(diff) / Math.max(distance, 0.001)) * 180) / Math.PI;
  return { distance, diff, slope };
}
