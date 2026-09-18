/**
 * Shared constants and types for the ElevateX project state.
 *
 * These deliberately live outside project-store.tsx: mixing non-component
 * exports with a React provider in one module breaks Fast Refresh, which can
 * unmount the provider mid-session and crash consumers with
 * "useProject must be used inside ProjectProvider".
 */

import type { GeoMetadata, GroundControlPoint } from "./api";

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
  geo?: GeoMetadata | undefined;
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
