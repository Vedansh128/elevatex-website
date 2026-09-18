import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Grid, OrbitControls, PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { colormap, type ColormapName, type HeightField } from "@/lib/terrain";

export type ViewerPick = { u: number; v: number; elevation: number };

type ViewerProps = {
  field: HeightField;
  textureUrl: string | null;
  colormapName?: ColormapName;
  onPick?: (pick: ViewerPick) => void;
  picks?: ViewerPick[];
};

const PLANE = 100;
const VERTICAL_EXAGGERATION = 2.2;

function useTerrainGeometry(field: HeightField, shading: boolean, cmap: ColormapName) {
  return useMemo(() => {
    const g = field.grid;
    const geo = new THREE.PlaneGeometry(PLANE, PLANE, g - 1, g - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes["position"] as THREE.BufferAttribute;
    const span = field.max - field.min || 1;
    const heightScale = (PLANE / ((g - 1) * field.cellSize)) * VERTICAL_EXAGGERATION;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const row = Math.floor(i / g);
      const col = i % g;
      const h = field.data[row * g + col] ?? field.min;
      pos.setY(i, (h - field.min) * heightScale);
      const t = (h - field.min) / span;
      const [r, gr, b] = shading ? colormap(cmap, t) : [255, 255, 255];

      colors[i * 3] = r / 255;
      colors[i * 3 + 1] = gr / 255;
      colors[i * 3 + 2] = b / 255;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [field, shading, cmap]);
}

function Terrain({
  field,
  textureUrl,
  wireframe,
  showTexture,
  shading,
  cmap,
  onPick,
}: {
  field: HeightField;
  textureUrl: string | null;
  wireframe: boolean;
  showTexture: boolean;
  shading: boolean;
  cmap: ColormapName;
  onPick?: (pick: ViewerPick) => void;
}) {
  const geometry = useTerrainGeometry(field, shading, cmap);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!textureUrl) {
      setTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    let disposed = false;
    loader.load(textureUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (disposed) tex.dispose();
      else setTexture(tex);
    });
    return () => {
      disposed = true;
    };
  }, [textureUrl]);

  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        if (!onPick) return;
        e.stopPropagation();
        const u = e.point.x / PLANE + 0.5;
        const v = e.point.z / PLANE + 0.5;
        const g = field.grid;
        const col = Math.min(g - 1, Math.max(0, Math.round(u * (g - 1))));
        const row = Math.min(g - 1, Math.max(0, Math.round(v * (g - 1))));
        onPick({ u, v, elevation: field.data[row * g + col] ?? field.min });
      }}
    >
      <meshStandardMaterial
        map={showTexture && texture ? texture : null}
        vertexColors={shading}
        color={showTexture && texture ? "#ffffff" : shading ? "#ffffff" : "#6f8496"}
        wireframe={wireframe}
        roughness={0.85}
        metalness={0.05}
        flatShading={false}
      />
    </mesh>
  );
}

function PickMarkers({ field, picks }: { field: HeightField; picks: ViewerPick[] }) {
  const heightScale =
    (PLANE / ((field.grid - 1) * field.cellSize)) * VERTICAL_EXAGGERATION;
  return (
    <>
      {picks.map((p, i) => (
        <mesh
          key={`${p.u}-${p.v}-${i}`}
          position={[
            (p.u - 0.5) * PLANE,
            (p.elevation - field.min) * heightScale + 1.2,
            (p.v - 0.5) * PLANE,
          ]}
        >
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color={i === 0 ? "#63e0ff" : "#8ff0c2"} />
        </mesh>
      ))}
    </>
  );
}

function FlyRig({ boostRef }: { boostRef: React.RefObject<boolean> }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") boostRef.current = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") boostRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [boostRef]);

  useFrame((_, delta) => {
    const speed = (boostRef.current ? 70 : 26) * delta;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    if (keys.current["KeyW"]) camera.position.addScaledVector(forward, speed);
    if (keys.current["KeyS"]) camera.position.addScaledVector(forward, -speed);
    if (keys.current["KeyD"]) camera.position.addScaledVector(right, speed);
    if (keys.current["KeyA"]) camera.position.addScaledVector(right, -speed);
    camera.position.y = Math.max(3, camera.position.y);
  });

  return null;
}

function CameraPreset({ preset }: { preset: "default" | "top" | "side" }) {
  const { camera } = useThree();
  useEffect(() => {
    const target: [number, number, number] =
      preset === "top" ? [0, 120, 0.001] : preset === "side" ? [0, 18, 120] : [70, 55, 70];
    camera.position.set(...target);
    camera.lookAt(0, 0, 0);
  }, [preset, camera]);
  return null;
}

export default function TerrainViewer({
  field,
  textureUrl,
  colormapName = "terrain",
  onPick,
  picks = [],
}: ViewerProps) {
  const [mode, setMode] = useState<"orbit" | "fly">("orbit");
  const [preset, setPreset] = useState<"default" | "top" | "side">("default");
  const [presetKey, setPresetKey] = useState(0);
  const [wireframe, setWireframe] = useState(false);
  const [showTexture, setShowTexture] = useState(true);
  const [shading, setShading] = useState(true);
  const boostRef = useRef(false);

  useEffect(() => {
    if (mode !== "fly") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") setMode("orbit");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  const toggles: { label: string; active: boolean; onClick: () => void }[] = [
    { label: "Texture", active: showTexture, onClick: () => setShowTexture((v) => !v) },
    { label: "Wireframe", active: wireframe, onClick: () => setWireframe((v) => !v) },
    { label: "Elevation shading", active: shading, onClick: () => setShading((v) => !v) },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-[oklch(0.15_0.03_258)]">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [70, 55, 70], fov: 55, near: 0.1, far: 2000 }}
      >
        <color attach="background" args={["#0d1320"]} />
        <fog attach="fog" args={["#0d1320", 180, 520]} />
        <hemisphereLight intensity={0.45} groundColor="#16202e" />
        <directionalLight
          position={[80, 110, 50]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Suspense fallback={null}>
          <Terrain
            field={field}
            textureUrl={textureUrl}
            wireframe={wireframe}
            showTexture={showTexture}
            shading={shading}
            cmap={colormapName}
            onPick={onPick}
          />
          <PickMarkers field={field} picks={picks} />
        </Suspense>
        <Grid
          args={[PLANE * 2, PLANE * 2]}
          cellSize={5}
          sectionSize={25}
          cellColor="#2a3a4f"
          sectionColor="#3c6b82"
          position={[0, -0.4, 0]}
          fadeDistance={420}
          infiniteGrid
        />
        <CameraPreset key={presetKey} preset={preset} />
        {mode === "orbit" ? (
          <OrbitControls
            makeDefault
            enableDamping
            maxPolarAngle={Math.PI / 2.05}
            minDistance={12}
            maxDistance={420}
          />
        ) : (
          <>
            <PointerLockControls makeDefault />
            <FlyRig boostRef={boostRef} />
          </>
        )}
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex flex-wrap gap-1.5">
          {(
            [
              { label: "Orbit mode", value: "orbit" as const },
              { label: "Fly mode", value: "fly" as const },
            ]
          ).map((m) => (
            <Button
              key={m.value}
              size="sm"
              variant={mode === m.value ? "default" : "outline"}
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPreset("top");
              setPresetKey((k) => k + 1);
            }}
          >
            Top view
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPreset("side");
              setPresetKey((k) => k + 1);
            }}
          >
            Side view
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPreset("default");
              setPresetKey((k) => k + 1);
            }}
          >
            Reset camera
          </Button>
        </div>
        <div className="pointer-events-auto flex flex-wrap gap-1.5">
          {toggles.map((t) => (
            <Button
              key={t.label}
              size="sm"
              variant={t.active ? "secondary" : "outline"}
              onClick={t.onClick}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
        <span className="rounded-md border border-border bg-background/75 px-2.5 py-1 font-mono text-[0.65rem] text-muted-foreground backdrop-blur">
          {mode === "fly"
            ? "WASD Move • Mouse Look • Shift Boost • ESC Exit"
            : "Drag to orbit • Scroll to zoom • Right-drag to pan"}
        </span>
        <span className="rounded-md border border-border bg-background/75 px-2.5 py-1 font-mono text-[0.65rem] text-muted-foreground backdrop-blur">
          {field.min.toFixed(0)}–{field.max.toFixed(0)} m · {field.grid}² mesh · ×
          {VERTICAL_EXAGGERATION} vertical
        </span>
      </div>
    </div>
  );
}
