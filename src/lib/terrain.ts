/**
 * Terrain math utilities: height fields, colormaps, slope, profiles.
 * All of this runs in the browser and is used for the demo/fallback pipeline.
 * When the Python backend is connected, a real DSM replaces the generated field.
 */

export const GRID = 129;

export type HeightField = {
  grid: number;
  /** Elevation values in metres, row-major, length grid*grid. */
  data: Float32Array;
  min: number;
  max: number;
  /** Ground sample distance in metres per cell. */
  cellSize: number;
  /** True when values are metric, false when they are relative (unitless scaled). */
  absolute: boolean;
};

function hash2(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return (a * (1 - xf) + b * xf) * (1 - yf) + (c * (1 - xf) + d * xf) * yf;
}

function fbm(x: number, y: number, seed: number, octaves = 5) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    value += amp * valueNoise(x * freq, y * freq, seed + o * 13);
    freq *= 2.07;
    amp *= 0.5;
  }
  return value;
}

function finalize(
  data: Float32Array,
  grid: number,
  cellSize: number,
  absolute: boolean,
): HeightField {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    const v = data[i]!;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  return { grid, data, min, max, cellSize, absolute };
}

/** Rescale a field into a metric range (used by calibration). */
export function rescale(field: HeightField, minM: number, maxM: number, absolute = true): HeightField {
  const span = field.max - field.min || 1;
  const out = new Float32Array(field.data.length);
  for (let i = 0; i < out.length; i++) {
    out[i] = minM + ((field.data[i]! - field.min) / span) * (maxM - minM);
  }
  return finalize(out, field.grid, field.cellSize, absolute);
}

/** Synthetic sample terrain used in Demo Mode. */
export function demoHeightField(seed = 7, grid = GRID, cellSize = 12.5): HeightField {
  const data = new Float32Array(grid * grid);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const u = x / grid;
      const v = y / grid;
      const ridges = 1 - Math.abs(fbm(u * 3.2, v * 3.2, seed, 5) * 2 - 1);
      const base = fbm(u * 1.4 + 11, v * 1.4 + 5, seed + 3, 5);
      const plateau = Math.exp(-((u - 0.68) ** 2 + (v - 0.33) ** 2) / 0.06) * 0.35;
      const valley = -Math.exp(-((u - 0.28) ** 2 + (v - 0.72) ** 2) / 0.05) * 0.25;
      data[y * grid + x] = ridges * 0.6 + base * 0.5 + plateau + valley;
    }
  }
  return rescale(finalize(data, grid, cellSize, false), 132, 248, true);
}

/**
 * Heuristic depth proxy derived from image luminance + local structure.
 * This is NOT a neural depth prediction — it only exists so the UI is
 * explorable while the Depth Anything V2 backend is not connected.
 */
export function heightFieldFromImage(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  grid = GRID,
  cellSize = 12.5,
): HeightField {
  const raw = new Float32Array(grid * grid);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const sx = Math.min(width - 1, Math.round((x / (grid - 1)) * (width - 1)));
      const sy = Math.min(height - 1, Math.round((y / (grid - 1)) * (height - 1)));
      const i = (sy * width + sx) * 4;
      const lum = (0.2126 * pixels[i]! + 0.7152 * pixels[i + 1]! + 0.0722 * pixels[i + 2]!) / 255;
      raw[y * grid + x] = lum;
    }
  }
  // Two smoothing passes so the surface reads as terrain rather than noise.
  const blurred = new Float32Array(raw);
  for (let pass = 0; pass < 2; pass++) {
    const src = Float32Array.from(blurred);
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= grid || ny >= grid) continue;
            sum += src[ny * grid + nx]!;
            count++;
          }
        }
        blurred[y * grid + x] = sum / count;
      }
    }
  }
  for (let i = 0; i < blurred.length; i++) {
    blurred[i] = blurred[i]! * 0.75 + raw[i]! * 0.25;
  }
  return finalize(blurred, grid, cellSize, false);
}

export function sampleHeight(field: HeightField, u: number, v: number) {
  const g = field.grid;
  const x = Math.min(g - 1, Math.max(0, u * (g - 1)));
  const y = Math.min(g - 1, Math.max(0, v * (g - 1)));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(g - 1, x0 + 1);
  const y1 = Math.min(g - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const a = field.data[y0 * g + x0]!;
  const b = field.data[y0 * g + x1]!;
  const c = field.data[y1 * g + x0]!;
  const d = field.data[y1 * g + x1]!;

  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

export function slopeField(field: HeightField): { data: Float32Array; max: number } {
  const g = field.grid;
  const out = new Float32Array(g * g);
  let max = 0;
  for (let y = 0; y < g; y++) {
    for (let x = 0; x < g; x++) {
      const xl = field.data[y * g + Math.max(0, x - 1)]!;
      const xr = field.data[y * g + Math.min(g - 1, x + 1)]!;
      const yt = field.data[Math.max(0, y - 1) * g + x]!;
      const yb = field.data[Math.min(g - 1, y + 1) * g + x]!;

      const dzdx = (xr - xl) / (2 * field.cellSize);
      const dzdy = (yb - yt) / (2 * field.cellSize);
      const deg = (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI;
      out[y * g + x] = deg;
      if (deg > max) max = deg;
    }
  }
  return { data: out, max };
}

export type ProfilePoint = { distance: number; elevation: number };

export function elevationProfile(
  field: HeightField,
  a: { u: number; v: number },
  b: { u: number; v: number },
  samples = 64,
): ProfilePoint[] {
  const spanM = (field.grid - 1) * field.cellSize;
  const dist = Math.hypot((b.u - a.u) * spanM, (b.v - a.v) * spanM);
  const out: ProfilePoint[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    out.push({
      distance: Math.round(dist * t),
      elevation: Number(sampleHeight(field, a.u + (b.u - a.u) * t, a.v + (b.v - a.v) * t).toFixed(1)),
    });
  }
  return out;
}

export function groundDistance(
  field: HeightField,
  a: { u: number; v: number },
  b: { u: number; v: number },
) {
  const spanM = (field.grid - 1) * field.cellSize;
  return Math.hypot((b.u - a.u) * spanM, (b.v - a.v) * spanM);
}

/* ------------------------------ colormaps ------------------------------ */

export type ColormapName = "viridis" | "terrain" | "magma" | "grayscale" | "slope";

type Stop = [number, number, number];

const RAMPS: Record<ColormapName, Stop[]> = {
  viridis: [
    [68, 1, 84],
    [59, 82, 139],
    [33, 145, 140],
    [94, 201, 98],
    [253, 231, 37],
  ],
  terrain: [
    [22, 61, 92],
    [37, 118, 110],
    [108, 168, 96],
    [206, 190, 122],
    [246, 246, 246],
  ],
  magma: [
    [0, 0, 4],
    [81, 18, 124],
    [183, 55, 121],
    [251, 136, 97],
    [252, 253, 191],
  ],
  grayscale: [
    [12, 14, 18],
    [80, 84, 92],
    [140, 146, 154],
    [200, 205, 212],
    [255, 255, 255],
  ],
  slope: [
    [26, 60, 84],
    [42, 140, 150],
    [220, 200, 120],
    [224, 130, 70],
    [206, 60, 60],
  ],
};

export function colormap(name: ColormapName, t: number): Stop {
  const ramp = RAMPS[name];
  const clamped = Math.min(1, Math.max(0, t));
  const scaled = clamped * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const a = ramp[i]!;
  const b = ramp[i + 1]!;
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];

}

export function colormapCss(name: ColormapName) {
  return `linear-gradient(90deg, ${RAMPS[name]
    .map((c) => `rgb(${c[0]},${c[1]},${c[2]})`)
    .join(", ")})`;
}

export type RasterOptions = {
  colormap?: ColormapName;
  contrast?: number;
  minClip?: number;
  maxClip?: number;
  /** Draw thin contour lines over the ramp. */
  contours?: boolean;
};

/** Paint a height field (or any scalar field) into a canvas. */
export function paintField(
  canvas: HTMLCanvasElement,
  values: Float32Array,
  grid: number,
  range: { min: number; max: number },
  opts: RasterOptions = {},
) {
  const { colormap: cmap = "viridis", contrast = 1, minClip, maxClip, contours } = opts;
  const lo = minClip ?? range.min;
  const hi = maxClip ?? range.max;
  const span = hi - lo || 1;
  canvas.width = grid;
  canvas.height = grid;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(grid, grid);
  for (let i = 0; i < values.length; i++) {
    let t = (values[i]! - lo) / span;
    t = Math.min(1, Math.max(0, (t - 0.5) * contrast + 0.5));
    const [r, g, b] = colormap(cmap, t);
    const bandIndex = Math.floor(t * 12);
    const nearBand = contours && Math.abs(t * 12 - bandIndex - 0.5) > 0.44;
    img.data[i * 4] = nearBand ? Math.round(r * 0.55) : r;
    img.data[i * 4 + 1] = nearBand ? Math.round(g * 0.55) : g;
    img.data[i * 4 + 2] = nearBand ? Math.round(b * 0.55) : b;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** Build a data URL raster for a field, used for exports and textures. */
export function fieldToDataUrl(
  values: Float32Array,
  grid: number,
  range: { min: number; max: number },
  opts: RasterOptions = {},
  size = 512,
) {
  const small = document.createElement("canvas");
  paintField(small, values, grid, range, opts);
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(small, 0, 0, size, size);
  return out.toDataURL("image/png");
}

/** A procedural RGB "satellite" texture for the demo dataset. */
export function demoTextureDataUrl(field: HeightField, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const h = (sampleHeight(field, u, v) - field.min) / (field.max - field.min || 1);
      const grain = valueNoise(u * 180, v * 180, 21) * 0.12;
      const green = 0.45 + (1 - h) * 0.35;
      const r = (0.28 + h * 0.5 + grain) * 255;
      const g = (green * (0.55 + h * 0.5) + grain) * 255;
      const b = (0.24 + h * 0.42 + grain) * 255;
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, r);
      img.data[i + 1] = Math.min(255, g);
      img.data[i + 2] = Math.min(255, b);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}
