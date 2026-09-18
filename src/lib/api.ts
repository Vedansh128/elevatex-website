/**
 * API service layer for the ElevateX Python/FastAPI backend.
 *
 * Every call goes through `request()`, which throws `BackendUnavailableError`
 * when VITE_API_URL is not configured or the server can't be reached. Callers
 * catch that and fall back to clearly-labelled demo processing in the browser.
 */

export const API_URL: string = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";

export function isBackendConfigured() {
  return API_URL.trim().length > 0;
}

export class BackendUnavailableError extends Error {
  constructor(message = "AI backend is not connected") {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isBackendConfigured()) throw new BackendUnavailableError();
  let res: Response;
  try {
    res = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, {
      ...init,
      headers:
        init?.body instanceof FormData
          ? init?.headers
          : { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new BackendUnavailableError("Could not reach the AI backend");
  }
  if (!res.ok) throw new Error(`Backend error ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export type JobRef = { jobId: string };

export type GeoMetadata = {
  crs: string;
  bounds: { west: number; south: number; east: number; north: number };
  pixelResolution: number;
  extentKm2: number;
};

export type UploadResponse = {
  fileId: string;
  width: number;
  height: number;
  georeferenced: boolean;
  geo?: GeoMetadata;
};

export type DepthResponse = { grid: number; depth: number[] };

export type CalibrationResponse = {
  scale: number;
  offset: number;
  confidence: number;
  minElevation: number;
  maxElevation: number;
};

export type ValidationResponse = {
  mae: number;
  rmse: number;
  correlation: number;
  grid: number;
  error: number[];
};

export type GroundControlPoint = {
  id: string;
  lat: number;
  lon: number;
  elevation: number;
};

export const api = {
  upload: (file: File) => {
    const body = new FormData();
    body.append("image", file);
    return request<UploadResponse>("/api/upload", { method: "POST", body });
  },
  process: (fileId: string) =>
    request<JobRef>("/api/process", { method: "POST", body: JSON.stringify({ fileId }) }),
  depth: (fileId: string) =>
    request<DepthResponse>("/api/depth", { method: "POST", body: JSON.stringify({ fileId }) }),
  calibrate: (payload: { fileId: string; mode: string; gcps?: GroundControlPoint[] }) =>
    request<CalibrationResponse>("/api/calibrate", { method: "POST", body: JSON.stringify(payload) }),
  generateDsm: (fileId: string) =>
    request<JobRef>("/api/generate-dsm", { method: "POST", body: JSON.stringify({ fileId }) }),
  generateMesh: (fileId: string) =>
    request<JobRef>("/api/generate-mesh", { method: "POST", body: JSON.stringify({ fileId }) }),
  validate: (payload: { fileId: string; referenceId: string }) =>
    request<ValidationResponse>("/api/validate", { method: "POST", body: JSON.stringify(payload) }),
  status: (jobId: string) => request<{ stage: string; progress: number }>(`/api/status/${jobId}`),
  result: <T>(jobId: string) => request<T>(`/api/result/${jobId}`),
  export: (payload: { fileId: string; format: "geotiff" | "depth-png" | "report" }) =>
    request<{ url: string }>("/api/export", { method: "POST", body: JSON.stringify(payload) }),
};
