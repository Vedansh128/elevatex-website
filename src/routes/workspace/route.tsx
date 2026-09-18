import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Boxes,
  Download,
  Gauge,
  LayoutDashboard,
  Layers,
  Ruler,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { DemoBadge, Logo, StatusPill } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthMenu } from "@/components/auth-menu";
import { useProject } from "@/lib/project-store";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "ElevateX Workspace — Elevation Pipeline Console" },
      {
        name: "description",
        content:
          "Upload imagery, run the depth-to-DSM pipeline, inspect elevation rasters and fly through 3D terrain.",
      },
      { property: "og:title", content: "ElevateX Workspace" },
      {
        property: "og:description",
        content: "Depth estimation, calibration, DSM generation and 3D terrain in one console.",
      },
    ],
  }),
  component: WorkspaceLayout,
});

const NAV = [
  { to: "/workspace", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/workspace/upload", label: "Upload image", icon: Upload },
  { to: "/workspace/elevation", label: "Elevation map", icon: Layers },
  { to: "/workspace/viewer", label: "3D viewer", icon: Boxes },
  { to: "/workspace/measurements", label: "Measurements", icon: Ruler },
  { to: "/workspace/validation", label: "Validation", icon: ShieldCheck },
  { to: "/workspace/export", label: "Export", icon: Download },
  { to: "/technology", label: "Technology", icon: Gauge },
] as const;

function WorkspaceLayout() {
  const { status, image, processingMode } = useProject();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo size={30} />
            </Link>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <div className="hidden sm:block">
              <p className="text-xs font-medium">
                {image ? image.name : "No project image loaded"}
              </p>
              <p className="mono-label mt-0.5">Project · DepthWizard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {processingMode === "demo" ? <DemoBadge label="DEMO MODE" /> : null}
            <StatusPill status={status} />
            <ThemeToggle />
            <AuthMenu compact />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <nav className="border-b border-border bg-sidebar/70 lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
          <ul className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
            {NAV.map((item) => (
              <li key={item.to} className="shrink-0">
                <Link
                  to={item.to}
                  activeOptions={{ exact: "exact" in item ? item.exact : false }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground data-[status=active]:bg-primary/12 data-[status=active]:text-foreground"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
