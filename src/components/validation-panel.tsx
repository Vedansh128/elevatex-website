import { useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend as ChartLegend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, StatCard } from "@/components/panel";
import { FieldCanvas, Legend } from "@/components/field-canvas";
import { DemoBadge } from "@/components/brand";
import { useProject } from "@/lib/project-store";
import { demoHeightField, rescale } from "@/lib/terrain";
import { toast } from "sonner";

const LANDSCAPES = [
  { name: "Urban", mae: 3.8, rmse: 5.6, corr: 0.86, samples: 24 },
  { name: "Hilly", mae: 6.4, rmse: 9.1, corr: 0.91, samples: 18 },
  { name: "Forest", mae: 7.9, rmse: 11.4, corr: 0.78, samples: 15 },
  { name: "Rural / sparse", mae: 2.9, rmse: 4.4, corr: 0.88, samples: 21 },
];

export function ValidationPanel() {
  const { field, referenceName, setReferenceName } = useProject();
  const inputRef = useRef<HTMLInputElement>(null);
  const [seed, setSeed] = useState(31);

  const result = useMemo(() => {
    if (!field) return null;
    const reference = rescale(demoHeightField(seed, field.grid, field.cellSize), field.min, field.max);
    const error = new Float32Array(field.data.length);
    let sumAbs = 0;
    let sumSq = 0;
    let maxAbs = 0;
    const scatter: { predicted: number; reference: number }[] = [];
    for (let i = 0; i < field.data.length; i++) {
      const p = field.data[i] ?? 0;
      const r = reference.data[i] ?? 0;
      const d = p - r;
      error[i] = d;
      sumAbs += Math.abs(d);
      sumSq += d * d;
      maxAbs = Math.max(maxAbs, Math.abs(d));
      if (i % 37 === 0) {
        scatter.push({
          predicted: Number(p.toFixed(1)),
          reference: Number(r.toFixed(1)),
        });
      }
    }

    const n = field.data.length;
    const meanP = field.data.reduce((a, b) => a + b, 0) / n;
    const meanR = reference.data.reduce((a, b) => a + b, 0) / n;
    let cov = 0;
    let varP = 0;
    let varR = 0;
    for (let i = 0; i < n; i++) {
      const dp = (field.data[i] ?? 0) - meanP;
      const dr = (reference.data[i] ?? 0) - meanR;

      cov += dp * dr;
      varP += dp * dp;
      varR += dr * dr;
    }
    return {
      mae: sumAbs / n,
      rmse: Math.sqrt(sumSq / n),
      correlation: cov / Math.sqrt(varP * varR || 1),
      error,
      maxAbs,
      scatter,
    };
  }, [field, seed]);

  if (!field || !result) return null;

  return (
    <div className="space-y-5">
      <Panel>
        <PanelHeader
          title="Reference elevation data"
          description="Compare the predicted DSM against reference DSM / DEM / LiDAR-derived elevation. Metrics below are reference-dependent."
          badge={<DemoBadge label={referenceName ? "REFERENCE LOADED" : "DEMO REFERENCE"} />}
          actions={
            <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              <Upload className="size-3.5" /> Upload reference
            </Button>
          }
        />
        <input
          ref={inputRef}
          type="file"
          accept=".tif,.tiff,.asc,.xyz,.las,.laz"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setReferenceName(file.name);
            setSeed((s) => s + 7);
            toast.message("Reference registered", {
              description:
                "Raster/LiDAR decoding happens on the Python backend; comparison below uses a demo reference surface until it is connected.",
            });
            e.target.value = "";
          }}
        />
        <p className="text-xs text-muted-foreground">
          {referenceName
            ? `Selected: ${referenceName} — awaiting server-side decoding.`
            : "No reference dataset supplied. A synthetic reference surface is used so the dashboard stays explorable."}
        </p>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="MAE" value={`${result.mae.toFixed(2)} m`} hint="Mean absolute error" accent />
        <StatCard label="RMSE" value={`${result.rmse.toFixed(2)} m`} hint="Root mean square error" />
        <StatCard
          label="Correlation"
          value={result.correlation.toFixed(3)}
          hint="Elevation correlation"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Error map"
            description="Spatial difference between predicted and reference elevation."
          />
          <FieldCanvas
            className="aspect-square w-full"
            values={result.error}
            grid={field.grid}
            range={{ min: -result.maxAbs, max: result.maxAbs }}
            options={{ colormap: "magma" }}
          />
          <div className="mt-3">
            <Legend
              colormap="magma"
              min={-result.maxAbs}
              max={result.maxAbs}
              lowLabel="Under-predicted"
              highLabel="Over-predicted"
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Predicted vs reference" description="Per-cell elevation agreement." />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="oklch(1 0 0 / 8%)" />
                <XAxis
                  type="number"
                  dataKey="reference"
                  name="Reference"
                  tick={{ fontSize: 11, fill: "oklch(0.7 0.022 254)" }}
                  stroke="oklch(1 0 0 / 12%)"
                  domain={["dataMin", "dataMax"]}
                />
                <YAxis
                  type="number"
                  dataKey="predicted"
                  name="Predicted"
                  tick={{ fontSize: 11, fill: "oklch(0.7 0.022 254)" }}
                  stroke="oklch(1 0 0 / 12%)"
                  domain={["dataMin", "dataMax"]}
                />
                <ZAxis range={[18, 18]} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.03 258)",
                    border: "1px solid oklch(1 0 0 / 12%)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v} m`}
                />
                <ChartLegend wrapperStyle={{ fontSize: 11 }} />
                <Scatter
                  name="Cells"
                  data={result.scatter}
                  fill="oklch(0.79 0.14 196 / 65%)"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Landscape testing"
          description="Per-category evaluation. Demo figures — replace with real benchmark runs before making accuracy claims."
          badge={<DemoBadge />}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-md text-left text-xs">
            <thead className="mono-label">
              <tr className="border-b border-border">
                <th className="py-2">Landscape</th>
                <th className="py-2">MAE</th>
                <th className="py-2">RMSE</th>
                <th className="py-2">Correlation</th>
                <th className="py-2">Samples</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {LANDSCAPES.map((l) => (
                <tr key={l.name} className="border-b border-border/60 last:border-0">
                  <td className="py-2 font-sans">{l.name}</td>
                  <td className="py-2">{l.mae.toFixed(1)} m</td>
                  <td className="py-2">{l.rmse.toFixed(1)} m</td>
                  <td className="py-2">{l.corr.toFixed(2)}</td>
                  <td className="py-2">{l.samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
