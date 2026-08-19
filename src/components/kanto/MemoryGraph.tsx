import { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Billboard, Bounds, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
} from "d3-force-3d";
import {
  graphLinks,
  graphNodes,
  nodeStyle,
  type GraphNode,
} from "@/lib/graph-data";

type Positioned = GraphNode & { x: number; y: number; z: number };

function useLayout() {
  return useMemo(() => {
    const nodes = graphNodes.map((n) => ({ ...n }));
    const links = graphLinks.map((l) => ({ ...l }));

    const sim = forceSimulation(nodes, 3)
      .force(
        "link",
        forceLink(links)
          .id((d: GraphNode) => d.id)
          .distance((l: { target: GraphNode }) =>
            (l.target as GraphNode).kind === "category" ? 9 : 5.5,
          )
          .strength(1),
      )
      .force("charge", forceManyBody().strength(-70))
      .force("center", forceCenter(0, 0, 0))
      .stop();

    sim.tick(500);

    const positioned = nodes as unknown as Positioned[];

    // Normalize the layout so it always fits the framing.
    const maxR = Math.max(
      ...positioned.map((n) => Math.hypot(n.x, n.y, n.z)),
      0.001,
    );
    const scale = 8.5 / maxR;
    for (const n of positioned) {
      n.x *= scale;
      n.y *= scale;
      n.z *= scale;
    }

    const links3d = links as unknown as { source: Positioned; target: Positioned }[];
    return { positioned, links3d };
  }, []);
}


function Links({
  links,
}: {
  links: { source: Positioned; target: Positioned }[];
}) {
  const geometry = useMemo(() => {
    const points: number[] = [];
    for (const l of links) {
      points.push(l.source.x, l.source.y, l.source.z);
      points.push(l.target.x, l.target.y, l.target.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return g;
  }, [links]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#F5F5DC" transparent opacity={0.22} />
    </lineSegments>
  );
}

function NodeSprite({
  node,
  selected,
  onSelect,
}: {
  node: Positioned;
  selected: boolean;
  onSelect: (n: GraphNode) => void;
}) {
  const style = nodeStyle[node.kind];
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);

  return (
    <Billboard position={[node.x, node.y, node.z]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <circleGeometry args={[style.size / 2, 48]} />
        <meshBasicMaterial
          color={style.color}
          transparent
          opacity={
            selected || hovered ? Math.min(1, style.opacity + 0.4) : style.opacity
          }
          side={THREE.DoubleSide}
        />
      </mesh>

      {(selected || hovered) && (
        <mesh ref={ringRef}>
          <ringGeometry args={[style.size / 2 + 0.18, style.size / 2 + 0.22, 64]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={selected ? 0.9 : 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {node.kind !== "idea" && (
        <Text
          position={[0, -style.size / 2 - 0.55, 0]}
          fontSize={node.kind === "core" ? 0.52 : 0.36}
          color={node.kind === "core" ? "#FFFFFF" : "#F5F5DC"}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          {node.title.toUpperCase()}
        </Text>
      )}

      {node.kind === "idea" && (hovered || selected) && (
        <Text
          position={[0, -style.size / 2 - 0.42, 0]}
          fontSize={0.26}
          color="#FFFFFF"
          fillOpacity={0.8}
          anchorX="center"
          anchorY="middle"
        >
          {node.title}
        </Text>
      )}
    </Billboard>
  );
}

export default function MemoryGraph({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (n: GraphNode | null) => void;
}) {
  const { positioned, links3d } = useLayout();

  return (
    <Canvas
      camera={{ position: [7, 5, 30], fov: 42 }}
      onPointerMissed={() => onSelect(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#000000"]} />
      <Bounds fit clip observe margin={1.35}>
        <group>
          <Links links={links3d} />
          {positioned.map((n) => (
            <NodeSprite
              key={n.id}
              node={n}
              selected={selectedId === n.id}
              onSelect={onSelect}
            />
          ))}
        </group>
      </Bounds>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={6}
        maxDistance={70}
        rotateSpeed={0.7}
        zoomSpeed={0.7}
      />
    </Canvas>
  );
}
