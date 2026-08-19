import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force-3d";
import {
  nodeStyle,
  type GraphNode,
  type GraphLink,
} from "@/lib/graph-data";

export type PositionedNode = GraphNode & {
  x: number;
  y: number;
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
};

export interface PositionedLink {
  source: PositionedNode;
  target: PositionedNode;
}

interface MemoryGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedId: string | null;
  onSelect: (node: GraphNode | null) => void;
  onDoubleClickNode?: (node: GraphNode) => void;
  onDoubleClickCanvas?: () => void;
  onLongPressNode?: (node: GraphNode) => void;
}

/**
 * Creates high-resolution radial sun glow texture for the Core Node.
 */
function createSunGlowTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(256, 256, 10, 256, 256, 256);
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.75)");
  gradient.addColorStop(0.4, "rgba(245, 245, 220, 0.45)");
  gradient.addColorStop(0.65, "rgba(245, 245, 220, 0.18)");
  gradient.addColorStop(0.85, "rgba(245, 245, 220, 0.05)");
  gradient.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * 2D Force Physics Simulation:
 * Calculates organic planar positions in 2D (X, Y with Z=0) without node overlapping.
 */
function useDynamic2DLayout(nodes: GraphNode[], links: GraphLink[]) {
  const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  return useMemo(() => {
    const totalCategories = nodes.filter((n) => n.kind === "category").length || 1;
    let catIndex = 0;

    // 1. Prepare 2D simulation nodes
    const simNodes: (GraphNode & {
      x: number;
      y: number;
      z: number;
      radius: number;
    })[] = nodes.map((node) => {
      const prev = prevPositionsRef.current.get(node.id);
      const style = nodeStyle[node.kind];

      if (prev) {
        return {
          ...node,
          x: prev.x + (Math.random() - 0.5) * 0.1,
          y: prev.y + (Math.random() - 0.5) * 0.1,
          z: 0,
          radius: style.size * 1.35,
        };
      }

      // Core at center [0, 0]
      if (node.kind === "core") {
        return { ...node, x: 0, y: 0, z: 0, radius: style.size * 1.6 };
      }

      // Categories distributed in planar circle
      if (node.kind === "category") {
        const angle = (catIndex / totalCategories) * Math.PI * 2;
        catIndex++;
        const r = 9.5;
        return {
          ...node,
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          z: 0,
          radius: style.size * 1.35,
        };
      }

      // Ideas seeded near parent node in 2D
      if (node.parentId) {
        const parentPos = prevPositionsRef.current.get(node.parentId);
        if (parentPos) {
          const randAngle = Math.random() * Math.PI * 2;
          const randDist = 2.6 + Math.random() * 2.0;
          return {
            ...node,
            x: parentPos.x + Math.cos(randAngle) * randDist,
            y: parentPos.y + Math.sin(randAngle) * randDist,
            z: 0,
            radius: style.size * 1.35,
          };
        }
      }

      const angle = Math.random() * Math.PI * 2;
      const r = 12.0;
      return {
        ...node,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        z: 0,
        radius: style.size * 1.35,
      };
    });

    // 2. Prepare links
    const simLinks = links.map((l) => {
      const srcId = typeof l.source === "object" ? (l.source as any).id : l.source;
      const tgtId = typeof l.target === "object" ? (l.target as any).id : l.target;
      return { source: srcId, target: tgtId };
    });

    // 3. 2D Force Simulation (numDimensions = 2)
    const sim = forceSimulation(simNodes, 2)
      .force(
        "link",
        forceLink(simLinks)
          .id((d: any) => d.id)
          .distance((l: any) => {
            const targetNode = l.target as GraphNode;
            return targetNode.kind === "category" ? 10.0 : 5.2;
          })
          .strength((l: any) => {
            const targetNode = l.target as GraphNode;
            return targetNode.kind === "category" ? 1.0 : 0.85;
          }),
      )
      .force(
        "charge",
        forceManyBody().strength((d: any) => {
          if (d.kind === "core") return -190;
          if (d.kind === "category") return -105;
          return -50;
        }),
      )
      .force("center", forceCenter(0, 0))
      .force(
        "collide",
        forceCollide((d: any) => d.radius * 1.4).strength(0.9),
      )
      .stop();

    // 4. Tick simulation in 2D
    sim.tick(400);

    const positioned = simNodes as unknown as PositionedNode[];

    // 5. Fit comfortably in 2D view
    const maxR = Math.max(
      ...positioned.map((n) => Math.hypot(n.x, n.y)),
      0.001,
    );
    const targetScale = Math.min(12.0 / maxR, 1.15);
    for (const n of positioned) {
      n.x *= targetScale;
      n.y *= targetScale;
      n.z = 0;
    }

    // Save 2D positions for smooth continuity
    const newPosMap = new Map<string, { x: number; y: number }>();
    for (const n of positioned) {
      newPosMap.set(n.id, { x: n.x, y: n.y });
    }
    prevPositionsRef.current = newPosMap;

    const links3d = simLinks as unknown as PositionedLink[];
    return { positioned, links3d };
  }, [nodes, links]);
}

/**
 * 2D Synapses (Links):
 * Renders flat 2D lines with category/parent color and 40% opacity, terminating at the Core edge.
 */
function Links2D({ links }: { links: PositionedLink[] }) {
  const geometry = useMemo(() => {
    const points: number[] = [];
    const colors: number[] = [];
    const tempColor = new THREE.Color();
    const coreRadius = nodeStyle.core.size / 2;

    for (const l of links) {
      if (l.source && l.target && typeof l.source.x === "number") {
        let sx = l.source.x;
        let sy = l.source.y;

        const tx = l.target.x;
        const ty = l.target.y;

        // Terminate at Core edge so lines do not enter Core disk
        if (l.source.kind === "core") {
          const dx = tx - sx;
          const dy = ty - sy;
          const dist = Math.hypot(dx, dy) || 1;
          sx = sx + (dx / dist) * coreRadius;
          sy = sy + (dy / dist) * coreRadius;
        }

        points.push(sx, sy, 0);
        points.push(tx, ty, 0);

        const hex = l.target.color || l.source.color || "#F5F5DC";
        tempColor.set(hex);

        colors.push(tempColor.r, tempColor.g, tempColor.b);
        colors.push(tempColor.r, tempColor.g, tempColor.b);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, [links]);

  return (
    <lineSegments geometry={geometry} renderOrder={0}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/**
 * Sun Glow Halo for KANTO EMPIRE in 2D
 */
function CoreSunGlow2D({ size }: { size: number }) {
  const glowTexture = useMemo(() => createSunGlowTexture(), []);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const t = clock.getElapsedTime();
      const s = 1.0 + Math.sin(t * 1.8) * 0.05;
      glowRef.current.scale.set(s, s, 1);
    }
  });

  if (!glowTexture) return null;

  return (
    <mesh ref={glowRef} position={[0, 0, -0.01]} renderOrder={200}>
      <planeGeometry args={[size * 3.4, size * 3.4]} />
      <meshBasicMaterial
        map={glowTexture}
        transparent
        opacity={0.88}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function NodeSprite2D({
  node,
  selected,
  onSelect,
  onDoubleClick,
  onLongPress,
}: {
  node: PositionedNode;
  selected: boolean;
  onSelect: (n: GraphNode) => void;
  onDoubleClick?: (n: GraphNode) => void;
  onLongPress?: (n: GraphNode) => void;
}) {
  const style = nodeStyle[node.kind];
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const longPressTimerRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isCore = node.kind === "core";
  const nodeColor = node.color || style.defaultColor;

  useFrame(({ clock }) => {
    if (ringRef.current && selected) {
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 3.5) * 0.08;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };

    // Start long-press timer (> 500ms) for mobile editing
    if (node.kind !== "core" && onLongPress) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(50);
        }
        onLongPress(node);
      }, 500);
    }
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const dist = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y,
    );

    // If tap without significant dragging (< 10px)
    if (dist < 10) {
      const now = Date.now();
      const timeSinceLast = now - lastTapRef.current;

      if (timeSinceLast > 0 && timeSinceLast < 360) {
        // Double-Tap detected!
        lastTapRef.current = 0;
        onDoubleClick?.(node);
      } else {
        lastTapRef.current = now;
        onSelect(node);
      }
    }
  };

  const handlePointerCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <group
      position={[node.x, node.y, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(node);
      }}
    >
      {/* 1. Sun Glow Halo exclusively for KANTO EMPIRE Core */}
      {isCore && <CoreSunGlow2D size={style.size} />}

      {/* 2. Flat 2D Node Disk */}
      <mesh
        renderOrder={isCore ? 999 : 10}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          if (typeof document !== "undefined") {
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          if (typeof document !== "undefined") {
            document.body.style.cursor = "auto";
          }
        }}
      >
        <circleGeometry args={[style.size / 2, 64]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent={!isCore}
          opacity={isCore ? 1.0 : selected || hovered ? 1.0 : style.opacity}
          depthTest={true}
          depthWrite={isCore}
        />
      </mesh>

      {/* 3. Selected or Hovered Outer Ring */}
      {(selected || hovered) && (
        <mesh ref={ringRef} renderOrder={isCore ? 1000 : 20}>
          <ringGeometry
            args={[
              style.size / 2 + 0.14,
              style.size / 2 + 0.22,
              64,
            ]}
          />
          <meshBasicMaterial
            color={nodeColor}
            transparent
            opacity={selected ? 0.95 : 0.55}
          />
        </mesh>
      )}

      {/* 4. Crystal-Clear Node Labels */}
      {node.kind === "core" && (
        <Text
          position={[0, -style.size / 2 - 0.55, 0.02]}
          fontSize={0.54}
          color="#FFFFFF"
          anchorX="center"
          anchorY="top"
          letterSpacing={0.12}
          outlineWidth={0.03}
          outlineColor="#000000"
          renderOrder={1001}
        >
          KANTO EMPIRE
        </Text>
      )}

      {node.kind === "category" && (
        <Text
          position={[0, -style.size / 2 - 0.45, 0.02]}
          fontSize={0.42}
          color="#F5F5DC"
          anchorX="center"
          anchorY="top"
          maxWidth={8.0}
          textAlign="center"
          letterSpacing={0.08}
          outlineWidth={0.03}
          outlineColor="#000000"
          renderOrder={1001}
        >
          {node.title.toUpperCase()}
        </Text>
      )}

      {node.kind === "idea" && (
        <Text
          position={[0, -style.size / 2 - 0.38, 0.02]}
          fontSize={selected || hovered ? 0.36 : 0.32}
          color={selected ? "#F5F5DC" : "#FFFFFF"}
          fillOpacity={selected || hovered ? 1.0 : 0.92}
          anchorX="center"
          anchorY="top"
          maxWidth={7.0}
          textAlign="center"
          outlineWidth={0.025}
          outlineColor="#000000"
          renderOrder={1001}
        >
          {node.title}
        </Text>
      )}
    </group>
  );
}

export default function MemoryGraph({
  nodes,
  links,
  selectedId,
  onSelect,
  onDoubleClickNode,
  onDoubleClickCanvas,
  onLongPressNode,
}: MemoryGraphProps) {
  const { positioned, links3d } = useDynamic2DLayout(nodes, links);
  const canvasLastTapRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.cursor = "auto";
      }
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#000000] touch-none select-none">
      <Canvas
        camera={{ position: [0, 0, 32], fov: 46 }}
        onPointerMissed={() => onSelect(null)}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#000000"]} />

        {/* Background Clickable Plane for Raycast double-click & double-tap on empty canvas */}
        <mesh
          position={[0, 0, -0.2]}
          onPointerUp={(e) => {
            e.stopPropagation();
            const now = Date.now();
            const timeSinceLast = now - canvasLastTapRef.current;
            if (timeSinceLast > 0 && timeSinceLast < 360) {
              canvasLastTapRef.current = 0;
              onDoubleClickCanvas?.();
            } else {
              canvasLastTapRef.current = now;
              onSelect(null);
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDoubleClickCanvas?.();
          }}
        >
          <planeGeometry args={[500, 500]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        <group>
          <Links2D links={links3d} />
          {positioned.map((n) => (
            <NodeSprite2D
              key={n.id}
              node={n}
              selected={selectedId === n.id}
              onSelect={onSelect}
              onDoubleClick={onDoubleClickNode}
              onLongPress={onLongPressNode}
            />
          ))}
        </group>

        {/* 2D Planar Controls: One-finger Drag to Pan, Two-finger Pinch to Zoom */}
        <OrbitControls
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          screenSpacePanning={true}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.PAN,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          minDistance={6}
          maxDistance={80}
          zoomSpeed={0.8}
          panSpeed={1.0}
        />
      </Canvas>
    </div>
  );
}
