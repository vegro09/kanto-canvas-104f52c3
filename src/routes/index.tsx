import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import DetailsPanel from "@/components/kanto/DetailsPanel";
import RecordButton from "@/components/kanto/RecordButton";
import type { GraphNode } from "@/lib/graph-data";

const MemoryGraph = lazy(() => import("@/components/kanto/MemoryGraph"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kanto Memory — Speak an idea, see it find its place" },
      {
        name: "description",
        content:
          "Kanto Memory is a spatial memory graph: capture ideas by voice and explore them as a flat node constellation in 3D space.",
      },
      { property: "og:title", content: "Kanto Memory — Spatial memory graph" },
      {
        property: "og:description",
        content:
          "Capture ideas by voice and explore them as a flat node constellation floating in 3D space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [recording, setRecording] = useState(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <ClientOnly
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Loading graph
              </span>
            </div>
          }
        >
          <Suspense fallback={null}>
            <MemoryGraph
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          </Suspense>
        </ClientOnly>
      </div>

      <header className="pointer-events-none absolute left-8 top-7 z-20">
        <h1 className="font-serif text-2xl italic tracking-tight text-brand">
          Kanto Memory
        </h1>
        <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          Spatial memory graph
        </p>
      </header>

      <RecordButton
        active={recording}
        onToggle={() => setRecording((r) => !r)}
      />

      <DetailsPanel node={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
