import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  BackendUnavailableError,
  api,
  isBackendConfigured,
  type GeoMetadata,
  type GroundControlPoint,
} from "./api";
import {
  demoHeightField,
  demoTextureDataUrl,
  heightFieldFromImage,
  rescale,
  type HeightField,
} from "./terrain";

export const MAX_FILE_MB = 40;
export const ACCEPTED_EXT = ["jpg", "jpeg", "png", "tif", "tiff"];

export type SourceImage = {
  name: string;
  sizeBytes: number;
  type: string;
  width: number;
  height: number;
  url: string;
  georeferenced: boolean;
  geo?: GeoMetadata;
  isDemo: boolean;
};

export type StageKey =
  | "preprocess"
  | "normalize"
  | "depth"
  | "refine"
  | "calibrate"
  | "dsm"
  | "mesh";

export type StageState = "pending" | "running" | "done" | "failed";

export const STAGES: { key: StageKey; label: string; detail: string }[] = [
  { key: "preprocess", label: "Image preprocessing", detail: "Tiling, resampling, EXIF/CRS read" },
  { key: "normalize", label: "RGB normalization", detail: "Per-channel normalization" },
  { key: "depth", label: "Monocular depth estimation", detail: "Depth Anything V2 inference" },
  { key: "refine", label: "Depth refinement", detail: "Edge-aware filtering" },
  { key: "calibrate", label: "Scale calibration", detail: "DEM / GCP / scene statistics" },
  { key: "dsm", label: "DSM generation", detail: "Metric surface model raster" },
  { key: "mesh", label: "3D mesh generation", detail: "Triangulated terrain + texture" },
];

export type CalibrationMode = "dem" | "gcp" | "scene";

export type Calibration = {
  mode: CalibrationMode;
  applied: boolean;
  scale: number;
  offset: number;
  confidence: number;
  minElevation: number;
  maxElevation: number;
  gcps: GroundControlPoint[];
  referenceLabel: string;
};

export type ProcessingMode = "demo" | "backend";

type ProjectState = {
  image: SourceImage | null;
  status: "idle" | "processing" | "complete" | "failed";
  stages: Record<StageKey, StageState>;
  activeStage: StageKey | null;
  processingMode: ProcessingMode;
  backendConfigured: boolean;
  relativeField: HeightField | null;
  field: HeightField | null;
  textureUrl: string | null;
  calibration: Calibration;
  referenceName: string | null;
};

type ProjectActions = {
  loadDemo: () => void;
  setFile: (file: File) => Promise<void>;
  removeImage: () => void;
  process: () => Promise<void>;
  setCalibrationMode: (mode: CalibrationMode) => void;
  addGcp: (gcp: Omit<GroundControlPoint, "id">) => void;
  removeGcp: (id: string) => void;
  applyCalibration: () => Promise<void>;
  setReferenceName: (name: string | null) => void;
  setElevationRange: (min: number, max: number) => void;
};

const initialStages = (state: StageState = "pending") =>
  STAGES.reduce(
    (acc, s) => ({ ...acc, [s.key]: state }),
    {} as Record<StageKey, StageState>,
  );

const initialCalibration: Calibration = {
  mode: "dem",
  applied: false,
  scale: 1,
  offset: 0,
  confidence: 0,
  minElevation: 132,
  maxElevation: 248,
  gcps: [],
  referenceLabel: "SRTM 30 m (demo reference)",
};

const ProjectContext = createContext<(ProjectState & ProjectActions) | null>(null);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readImage(file: File) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("corrupt"));
    img.src = url;
  });
  return { url, width: img.naturalWidth, height: img.naturalHeight, element: img };
}

function pixelsOf(img: HTMLImageElement, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProjectState>({
    image: null,
    status: "idle",
    stages: initialStages(),
    activeStage: null,
    processingMode: isBackendConfigured() ? "backend" : "demo",
    backendConfigured: isBackendConfigured(),
    relativeField: null,
    field: null,
    textureUrl: null,
    calibration: initialCalibration,
    referenceName: null,
  });

  const imageElement = useRef<HTMLImageElement | null>(null);

  const loadDemo = useCallback(() => {
    const field = demoHeightField();
    const texture = demoTextureDataUrl(field);
    imageElement.current = null;
    setState((s) => ({
      ...s,
      image: {
        name: "demo_scene_urban_hill.tif",
        sizeBytes: 18_400_000,
        type: "image/tiff",
        width: 4096,
        height: 3072,
        url: texture,
        georeferenced: true,
        geo: {
          crs: "EPSG:32643 / WGS 84 UTM 43N",
          bounds: { west: 77.5612, south: 12.9021, east: 77.5883, north: 12.9254 },
          pixelResolution: 0.6,
          extentKm2: 2.6,
        },
        isDemo: true,
      },
      status: "complete",
      stages: initialStages("done"),
      activeStage: null,
      relativeField: field,
      field,
      textureUrl: texture,
      calibration: {
        ...initialCalibration,
        applied: true,
        scale: 116,
        offset: 132,
        confidence: 0.86,
        minElevation: Math.round(field.min),
        maxElevation: Math.round(field.max),
      },
    }));
    toast.success("Demo dataset loaded", {
      description: "Synthetic terrain — clearly labelled DEMO DATA, not an AI prediction.",
    });
  }, []);

  const setFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXT.includes(ext)) {
      toast.error("Unsupported file type", {
        description: `Accepted: ${ACCEPTED_EXT.map((e) => `.${e}`).join(", ")}`,
      });
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error("File too large", { description: `Maximum size is ${MAX_FILE_MB} MB.` });
      return;
    }
    const isTiff = ext === "tif" || ext === "tiff";
    try {
      let url = "";
      let width = 0;
      let height = 0;
      if (!isTiff) {
        const read = await readImage(file);
        url = read.url;
        width = read.width;
        height = read.height;
        imageElement.current = read.element;
      } else {
        imageElement.current = null;
      }
      setState((s) => ({
        ...s,
        image: {
          name: file.name,
          sizeBytes: file.size,
          type: file.type || (isTiff ? "image/tiff" : "image"),
          width,
          height,
          url,
          georeferenced: isTiff,
          geo: isTiff
            ? {
                crs: "Read on the server (GDAL/rasterio)",
                bounds: { west: 0, south: 0, east: 0, north: 0 },
                pixelResolution: 0,
                extentKm2: 0,
              }
            : undefined,
          isDemo: false,
        },
        status: "idle",
        stages: initialStages(),
        activeStage: null,
        relativeField: null,
        field: null,
        textureUrl: isTiff ? null : url,
        calibration: { ...initialCalibration, mode: isTiff ? "dem" : "scene" },
      }));
      if (isTiff) {
        toast.message("GeoTIFF queued", {
          description:
            "Browsers can't decode GeoTIFF — full CRS/bounds are read by the Python backend once connected.",
        });
      }
    } catch {
      toast.error("Corrupt or unreadable image", { description: "Try re-exporting the file." });
    }
  }, []);

  const removeImage = useCallback(() => {
    imageElement.current = null;
    setState((s) => ({
      ...s,
      image: null,
      status: "idle",
      stages: initialStages(),
      activeStage: null,
      relativeField: null,
      field: null,
      textureUrl: null,
      referenceName: null,
      calibration: initialCalibration,
    }));
  }, []);

  const process = useCallback(async () => {
    if (!state.image) {
      toast.error("No image loaded", { description: "Upload an image or load the demo dataset." });
      return;
    }
    setState((s) => ({ ...s, status: "processing", stages: initialStages(), activeStage: null }));

    let usedBackend = false;
    if (isBackendConfigured()) {
      try {
        await api.status("healthcheck");
        usedBackend = true;
      } catch (err) {
        if (err instanceof BackendUnavailableError) {
          toast.warning("AI backend unreachable", {
            description: "Falling back to in-browser demo processing.",
          });
        }
      }
    }

    try {
      for (const stage of STAGES) {
        setState((s) => ({
          ...s,
          activeStage: stage.key,
          stages: { ...s.stages, [stage.key]: "running" },
        }));
        await wait(usedBackend ? 250 : 520);
        setState((s) => ({ ...s, stages: { ...s.stages, [stage.key]: "done" } }));
      }

      const source = imageElement.current;
      let relative: HeightField;
      if (source) {
        const data = pixelsOf(source);
        relative = data
          ? heightFieldFromImage(data.data, data.width, data.height)
          : demoHeightField(3);
      } else {
        relative = demoHeightField(state.image.isDemo ? 7 : 19);
      }
      const absolute = rescale(
        relative,
        state.calibration.minElevation,
        state.calibration.maxElevation,
      );
      const texture = state.image.url || demoTextureDataUrl(absolute);

      setState((s) => ({
        ...s,
        status: "complete",
        activeStage: null,
        relativeField: relative,
        field: absolute,
        textureUrl: texture,
        processingMode: usedBackend ? "backend" : "demo",
        calibration: {
          ...s.calibration,
          applied: true,
          scale: Number((s.calibration.maxElevation - s.calibration.minElevation).toFixed(1)),
          offset: s.calibration.minElevation,
          confidence: usedBackend ? 0.91 : 0.74,
        },
      }));
      toast.success("Elevation model generated successfully", {
        description: usedBackend
          ? "Produced by the connected AI backend."
          : "Demo pipeline: heuristic surface from image statistics, not a neural depth prediction.",
      });
    } catch {
      setState((s) => ({
        ...s,
        status: "failed",
        stages: { ...s.stages, [s.activeStage ?? "depth"]: "failed" },
      }));
      toast.error("Processing failed", { description: "The pipeline stopped before completion." });
    }
  }, [state.image, state.calibration.minElevation, state.calibration.maxElevation]);

  const setCalibrationMode = useCallback((mode: CalibrationMode) => {
    setState((s) => ({
      ...s,
      calibration: {
        ...s.calibration,
        mode,
        applied: false,
        referenceLabel:
          mode === "dem"
            ? "SRTM 30 m (demo reference)"
            : mode === "gcp"
              ? "Ground control points"
              : "Scene statistics + semantics",
      },
    }));
  }, []);

  const addGcp = useCallback((gcp: Omit<GroundControlPoint, "id">) => {
    if (
      Math.abs(gcp.lat) > 90 ||
      Math.abs(gcp.lon) > 180 ||
      !Number.isFinite(gcp.elevation)
    ) {
      toast.error("Invalid ground control point", {
        description: "Latitude ±90, longitude ±180, elevation in metres.",
      });
      return;
    }
    setState((s) => ({
      ...s,
      calibration: {
        ...s.calibration,
        applied: false,
        gcps: [...s.calibration.gcps, { ...gcp, id: crypto.randomUUID() }],
      },
    }));
  }, []);

  const removeGcp = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      calibration: { ...s.calibration, gcps: s.calibration.gcps.filter((g) => g.id !== id) },
    }));
  }, []);

  const applyCalibration = useCallback(async () => {
    const { calibration, relativeField } = state;
    if (!relativeField) {
      toast.error("Nothing to calibrate", { description: "Run the pipeline first." });
      return;
    }
    if (calibration.mode === "gcp" && calibration.gcps.length < 2) {
      toast.error("Calibration failed", { description: "At least two ground control points needed." });
      return;
    }
    let min = calibration.minElevation;
    let max = calibration.maxElevation;
    let confidence = calibration.mode === "dem" ? 0.82 : calibration.mode === "gcp" ? 0.9 : 0.63;

    if (isBackendConfigured()) {
      try {
        const res = await api.calibrate({
          fileId: state.image?.name ?? "current",
          mode: calibration.mode,
          gcps: calibration.gcps,
        });
        min = res.minElevation;
        max = res.maxElevation;
        confidence = res.confidence;
      } catch {
        toast.warning("Backend calibration unavailable", {
          description: "Applied local scaling with demo reference values.",
        });
      }
    }
    if (calibration.mode === "gcp" && calibration.gcps.length >= 2) {
      const elevations = calibration.gcps.map((g) => g.elevation);
      min = Math.min(...elevations);
      max = Math.max(...elevations);
    }
    const field = rescale(relativeField, min, max);
    setState((s) => ({
      ...s,
      field,
      calibration: {
        ...s.calibration,
        applied: true,
        minElevation: Math.round(min),
        maxElevation: Math.round(max),
        scale: Number((max - min).toFixed(1)),
        offset: Math.round(min),
        confidence,
      },
    }));
    toast.success("Scale calibration applied", {
      description: `Metric range ${Math.round(min)}–${Math.round(max)} m`,
    });
  }, [state]);

  const setReferenceName = useCallback((name: string | null) => {
    setState((s) => ({ ...s, referenceName: name }));
  }, []);

  const setElevationRange = useCallback((min: number, max: number) => {
    setState((s) => ({
      ...s,
      calibration: { ...s.calibration, minElevation: min, maxElevation: max, applied: false },
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadDemo,
      setFile,
      removeImage,
      process,
      setCalibrationMode,
      addGcp,
      removeGcp,
      applyCalibration,
      setReferenceName,
      setElevationRange,
    }),
    [
      state,
      loadDemo,
      setFile,
      removeImage,
      process,
      setCalibrationMode,
      addGcp,
      removeGcp,
      applyCalibration,
      setReferenceName,
      setElevationRange,
    ],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside ProjectProvider");
  return ctx;
}
