import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo, SihBadge } from "@/components/brand";
import { Panel, PanelHeader } from "@/components/panel";
import { isBackendConfigured, API_URL } from "@/lib/api";

export const Route = createFileRoute("/technology")({
  head: () => ({
    meta: [
      { title: "ElevateX Technology — Depth to DSM Architecture" },
      {
        name: "description",
        content:
          "How ElevateX chains monocular depth estimation, DEM/GCP calibration, DSM generation and Three.js rendering.",
      },
      { property: "og:title", content: "ElevateX Technology" },
      {
        property: "og:description",
        content: "Architecture, service boundaries and the FastAPI endpoints behind ElevateX.",
      },
    ],
  }),
  component: TechnologyPage,
});

const ARCHITECTURE = `RGB Satellite Image
        ↓
Image Preprocessing
        ↓
Depth Anything V2
        ↓
Relative Depth Map
        ↓
DEM / GCP Calibration
        ↓
Absolute DSM
        ↓
3D Mesh Generation
        ↓
Three.js Renderer
        ↓
Interactive Flythrough`;

const STACK = [
  { title: "AI", items: ["PyTorch", "Depth Anything V2"] },
  { title: "Computer vision", items: ["OpenCV", "NumPy", "SciPy"] },
  { title: "Geospatial", items: ["GDAL", "Rasterio", "SRTM / DEM"] },
  { title: "Backend", items: ["Python", "FastAPI"] },
  { title: "Frontend", items: ["React", "TypeScript", "Tailwind CSS"] },
  { title: "3D", items: ["Three.js", "React Three Fiber"] },
];

const SERVICES = [
  { name: "depth_service", detail: "Monocular depth inference and tiling" },
  { name: "calibration_service", detail: "DEM, GCP and scene-statistics scaling" },
  { name: "dsm_service", detail: "Metric surface model raster writing" },
  { name: "mesh_service", detail: "Mesh decimation and texture projection" },
  { name: "validation_service", detail: "MAE / RMSE / correlation against reference" },
];

const ENDPOINTS = [
  "POST /api/upload",
  "POST /api/process",
  "POST /api/depth",
  "POST /api/calibrate",
  "POST /api/generate-dsm",
  "POST /api/generate-mesh",
  "POST /api/validate",
  "GET  /api/status/:jobId",
  "GET  /api/result/:jobId",
  "POST /api/export",
];

function TechnologyPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <Link to="/workspace">
          <Button size="sm">Launch workspace</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-5 pb-20 lg:px-8">
        <div className="space-y-3">
          <SihBadge />
          <h1 className="text-3xl font-semibold tracking-tight">System architecture</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            ElevateX splits the problem into a thin, typed frontend and a Python inference backend.
            The frontend owns visualization, measurement and export UX; the backend owns depth
            inference, geospatial calibration and raster writing.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel>
            <PanelHeader title="Pipeline" description="End-to-end data flow." />
            <pre className="contour-backdrop overflow-x-auto rounded-lg border border-border bg-surface/60 p-4 font-mono text-[0.72rem] leading-6 text-foreground/90">
              {ARCHITECTURE}
            </pre>
          </Panel>

          <div className="space-y-5">
            <Panel>
              <PanelHeader title="Technology stack" />
              <div className="grid gap-3 sm:grid-cols-2">
                {STACK.map((s) => (
                  <div key={s.title} className="rounded-lg border border-border bg-surface/50 p-3">
                    <p className="text-xs font-semibold">{s.title}</p>
                    <ul className="mt-1.5 space-y-0.5 font-mono text-[0.7rem] text-muted-foreground">
                      {s.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Backend service boundaries"
                description="Each concern is its own module so AI logic never collapses into one file."
              />
              <ul className="space-y-1.5">
                {SERVICES.map((s) => (
                  <li key={s.name} className="flex flex-wrap items-baseline gap-2 text-xs">
                    <span className="font-mono text-primary">{s.name}</span>
                    <span className="text-muted-foreground">— {s.detail}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        <Panel>
          <PanelHeader
            title="API contract"
            description={
              isBackendConfigured()
                ? `Frontend targets ${API_URL} via VITE_API_URL.`
                : "Set VITE_API_URL to point the frontend at the FastAPI service. Until then the app runs a clearly-labelled demo pipeline."
            }
          />
          <div className="grid gap-1.5 font-mono text-[0.72rem] text-muted-foreground sm:grid-cols-2">
            {ENDPOINTS.map((e) => (
              <span key={e} className="rounded-md border border-border bg-surface/50 px-2.5 py-1.5">
                {e}
              </span>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Honest-by-default behaviour"
            description="What the prototype claims, and what it does not."
          />
          <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li>
              • Demo mode builds a surface from image statistics and synthetic terrain. It is never
              presented as a neural depth prediction.
            </li>
            <li>• Validation metrics and landscape benchmarks are marked DEMO DATA.</li>
            <li>
              • GeoTIFF CRS, bounds and GeoTIFF export require GDAL/rasterio on the server; the UI
              says so instead of inventing values.
            </li>
            <li>
              • When VITE_API_URL is set and the service responds, the same UI shows real backend
              results and switches the mode badge.
            </li>
          </ul>
        </Panel>
      </main>
    </div>
  );
}
