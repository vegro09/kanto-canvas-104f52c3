import { X } from "lucide-react";
import type { GraphNode } from "@/lib/graph-data";

const kindLabel: Record<GraphNode["kind"], string> = {
  core: "Core",
  category: "Category",
  idea: "Idea",
};

export default function DetailsPanel({
  node,
  onClose,
}: {
  node: GraphNode | null;
  onClose: () => void;
}) {
  const open = Boolean(node);

  return (
    <aside
      aria-hidden={!open}
      className={`fixed right-0 top-0 z-30 h-screen w-[min(88vw,360px)] border-l border-panel bg-background transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col p-7">
        <div className="flex items-start justify-between">
          <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            {node ? kindLabel[node.kind] : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg border border-panel p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <h2 className="mt-8 font-serif text-2xl italic text-brand">
          {node?.title}
        </h2>

        <div className="mt-5 h-px w-full bg-panel" />

        <p className="mt-5 font-sans text-sm leading-relaxed text-foreground/80">
          {node?.body}
        </p>

        <div className="mt-auto rounded-lg border border-panel p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Node id
          </p>
          <p className="mt-2 font-sans text-xs text-foreground/70">{node?.id}</p>
        </div>
      </div>
    </aside>
  );
}
