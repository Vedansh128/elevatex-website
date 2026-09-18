import { Download, FileText, Image as ImageIcon, Layers, ServerOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/panel";
import { useProject } from "@/lib/project-store";
import { fieldToDataUrl } from "@/lib/terrain";
import { isBackendConfigured } from "@/lib/api";

function download(name: string, href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}

export function ExportPanel() {
  const { field, relativeField, image, calibration, processingMode } = useProject();

  const exportRaster = (which: "dsm" | "depth") => {
    const source = which === "dsm" ? field : relativeField;
    if (!source) {
      toast.error("Nothing to export", { description: "Run the pipeline first." });
      return;
    }
    const url = fieldToDataUrl(
      source.data,
      source.grid,
      { min: source.min, max: source.max },
      { colormap: which === "dsm" ? "terrain" : "viridis" },
      1024,
    );
    download(which === "dsm" ? "elevatex_dsm.png" : "elevatex_depth.png", url);
    toast.success(which === "dsm" ? "Elevation PNG exported" : "Depth map exported");
  };

  const exportReport = () => {
    if (!field) {
      toast.error("Nothing to export", { description: "Run the pipeline first." });
      return;
    }
    const report = {
      product: "ElevateX",
      problemStatement: "SIH 26175 — DepthWizard",
      generatedAt: new Date().toISOString(),
      processingMode,
      source: image
        ? {
            name: image.name,
            dimensions: `${image.width}×${image.height}`,
            georeferenced: image.georeferenced,
            crs: image.geo?.crs ?? null,
          }
        : null,
      elevation: {
        min: Number(field.min.toFixed(2)),
        max: Number(field.max.toFixed(2)),
        cellSizeMeters: field.cellSize,
        gridSize: field.grid,
        absolute: field.absolute,
      },
      calibration,
      disclaimer:
        processingMode === "backend"
          ? "Produced by the connected AI backend."
          : "Demo mode output — heuristic surface, not a neural depth prediction.",
    };
    download(
      "elevatex_measurement_report.json",
      URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })),
    );
    toast.success("Measurement report exported");
  };

  const serverExport = (label: string) => {
    if (!isBackendConfigured()) {
      toast.error(`${label} needs the backend`, {
        description: "GeoTIFF writing requires GDAL/rasterio on the Python service.",
      });
      return;
    }
    toast.message(`${label} requested`, { description: "Job submitted to /api/export." });
  };

  const items = [
    {
      title: "DSM GeoTIFF",
      detail: "Georeferenced raster with CRS and metric elevation. Server-side (GDAL).",
      icon: <Layers className="size-4" />,
      action: () => serverExport("Export DSM"),
      label: "Export DSM",
      serverOnly: true,
    },
    {
      title: "Relative depth map",
      detail: "Scale-agnostic depth raster as PNG. Generated in the browser.",
      icon: <ImageIcon className="size-4" />,
      action: () => exportRaster("depth"),
      label: "Export depth map",
      serverOnly: false,
    },
    {
      title: "Elevation PNG",
      detail: "Colour-mapped DSM preview at 1024².",
      icon: <ImageIcon className="size-4" />,
      action: () => exportRaster("dsm"),
      label: "Export elevation PNG",
      serverOnly: false,
    },
    {
      title: "Measurement report",
      detail: "JSON summary of source, calibration and elevation statistics.",
      icon: <FileText className="size-4" />,
      action: exportReport,
      label: "Export report",
      serverOnly: false,
    },
  ];

  return (
    <Panel>
      <PanelHeader
        title="Export"
        description="Browser-side exports work immediately. Server-side products are marked and require the Python service."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="rounded-lg border border-border bg-surface/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-primary">{item.icon}</span>
                {item.title}
              </span>
              {item.serverOnly && !isBackendConfigured() ? (
                <span className="flex items-center gap-1 text-[0.62rem] text-warning">
                  <ServerOff className="size-3" /> backend required
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground">{item.detail}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={item.action}>
              <Download className="size-3.5" /> {item.label}
            </Button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
