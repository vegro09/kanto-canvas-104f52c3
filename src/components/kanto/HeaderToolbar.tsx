import { useState } from "react";
import { RotateCcw, Download, Info, HelpCircle } from "lucide-react";
import type { GraphData } from "@/lib/graph-data";

interface HeaderToolbarProps {
  graph: GraphData;
  onResetGraph: () => void;
}

export default function HeaderToolbar({
  graph,
  onResetGraph,
}: HeaderToolbarProps) {
  const [showHelp, setShowHelp] = useState(false);

  const ideaCount = graph.nodes.filter((n) => n.kind === "idea").length;
  const catCount = graph.nodes.filter((n) => n.kind === "category").length;

  const handleExport = () => {
    const jsonStr = JSON.stringify(graph, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanto-memory-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="pointer-events-none fixed left-8 top-7 z-20 flex flex-col gap-1">
        <h1 className="font-serif text-2xl italic tracking-tight text-[#F5F5DC]">
          Kanto Memory
        </h1>
        <div className="flex items-center gap-2">
          <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#FFFFFF]/50">
            Spatial Neural Brain
          </p>
          <span className="text-[10px] text-[#333333]">•</span>
          <span className="font-sans text-[10px] text-[#F5F5DC]/70">
            {ideaCount} Ideas · {catCount} Categories
          </span>
        </div>
      </header>

      {/* Top Right Quick Controls */}
      <div className="pointer-events-auto fixed right-8 top-7 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowHelp((s) => !s)}
          title="About Kanto Zero-Interference Brain"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#333333] bg-[#000000]/80 text-[#FFFFFF]/60 backdrop-blur-md transition-all hover:border-[#F5F5DC]/60 hover:text-[#FFFFFF]"
        >
          <HelpCircle size={14} />
        </button>

        <button
          type="button"
          onClick={handleExport}
          title="Export Memory Graph JSON"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#333333] bg-[#000000]/80 text-[#FFFFFF]/60 backdrop-blur-md transition-all hover:border-[#F5F5DC]/60 hover:text-[#FFFFFF]"
        >
          <Download size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Reset memory graph to default baseline constellation?",
              )
            ) {
              onResetGraph();
            }
          }}
          title="Reset Graph"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#333333] bg-[#000000]/80 text-[#FFFFFF]/60 backdrop-blur-md transition-all hover:border-[#F5F5DC]/60 hover:text-[#FFFFFF]"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-[#000000]/75 backdrop-blur-sm p-4">
          <div className="w-[min(90vw,480px)] rounded-2xl border border-[#333333] bg-[#000000] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg italic text-[#F5F5DC]">
                Kanto Memory Architecture
              </span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="font-sans text-xs text-[#FFFFFF]/50 hover:text-[#FFFFFF]"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 font-sans text-xs leading-relaxed text-[#FFFFFF]/80">
              <p>
                <strong className="text-[#F5F5DC]">1. Voice Capture:</strong>{" "}
                Click the microphone button to think out loud. Toggle between{" "}
                <strong className="text-[#FFFFFF]">English</strong> and{" "}
                <strong className="text-[#FFFFFF]">العربية</strong> as needed.
              </p>
              <p>
                <strong className="text-[#F5F5DC]">2. Zero-Interference AI:</strong>{" "}
                The AI Brain strips filler words without altering the core idea,
                categorizes the thought, and links it into the neural graph.
              </p>
              <p>
                <strong className="text-[#F5F5DC]">3. 3D Physics:</strong>{" "}
                Nodes dynamically self-organize in real-time 3D space. Drag to
                rotate, scroll to zoom, click any node to inspect.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-lg border border-[#F5F5DC] bg-[#F5F5DC] px-4 py-1.5 font-sans text-[10px] font-medium uppercase tracking-wider text-[#000000]"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
