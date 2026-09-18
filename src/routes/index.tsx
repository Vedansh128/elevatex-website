import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, Layers, Mountain, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, SihBadge } from "@/components/brand";
import { PipelineFlow } from "@/components/pipeline";
import { Panel } from "@/components/panel";
import { LazyTerrainViewer } from "@/components/terrain-viewer-lazy";
import { useProject } from "@/lib/project-store";
import { demoHeightField, demoTextureDataUrl } from "@/lib/terrain";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ElevateX — From One Image to a 3D World" },
      {
        name: "description",
        content:
          "Monocular depth estimation and geospatial calibration that turn single-view aerial imagery into interactive elevation models.",
      },
      { property: "og:title", content: "ElevateX — From One Image to a 3D World" },
      {
        property: "og:description",
        content:
          "Single-view height estimation, metric DSM generation and 3D terrain flythrough for SIH 26175.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Layers,
    title: "Single-view depth estimation",
    detail: "Monocular depth inference on one RGB aerial or satellite frame — no stereo pair needed.",
  },
  {
    icon: Mountain,
    title: "Metric elevation mapping",
    detail: "DEM, ground control point or scene-based calibration turns relative depth into metres.",
  },
  {
    icon: Boxes,
    title: "Interactive 3D flythrough",
    detail: "Terrain mesh with RGB texture projection, orbit navigation and first-person fly mode.",
  },
  {
    icon: Ruler,
    title: "Height & slope analysis",
    detail: "Point elevations, height differences, slope angles and elevation profiles.",
  },
];

function Landing() {
  const { loadDemo } = useProject();
  const heroField = useMemo(() => demoHeightField(13), []);
  const heroTexture = useMemo(
    () => (typeof document === "undefined" ? null : demoTextureDataUrl(heroField, 256)),
    [heroField],
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
        aria-hidden
      />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/technology">
            <Button variant="ghost" size="sm">
              Technology
            </Button>
          </Link>
          <Link to="/workspace">
            <Button size="sm">Launch workspace</Button>
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-8 pb-16 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:px-8">
        <div className="space-y-6">
          <SihBadge />
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            From One Image to a <span className="text-gradient-brand">3D World.</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            ElevateX uses monocular depth estimation and geospatial calibration to transform
            single-view aerial imagery into interactive elevation models.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/workspace">
              <Button size="lg" className="gap-2">
                Launch workspace <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/technology">
              <Button size="lg" variant="outline">
                Explore technology
              </Button>
            </Link>
          </div>
          <div className="space-y-2 pt-2">
            <span className="mono-label">Pipeline</span>
            <PipelineFlow />
          </div>
          <button
            type="button"
            onClick={loadDemo}
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Or load the demo scene and skip straight to the 3D terrain →
          </button>
        </div>

        <Panel bleed className="h-[24rem] overflow-hidden p-0 sm:h-[30rem]">
          <LazyTerrainViewer field={heroField} textureUrl={heroTexture} colormapName="terrain" />
        </Panel>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((f) => (
            <Panel key={f.title} className="transition-colors hover:border-primary/40">
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.detail}</p>
            </Panel>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          ElevateX · Turning Images into 3D Intelligence · AI-powered single-view elevation estimation
        </p>
      </section>
    </div>
  );
}
