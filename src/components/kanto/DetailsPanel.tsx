import { useState } from "react";
import { X, Trash2, Edit3, Copy, Check, ArrowUpRight, FolderTree, Lightbulb } from "lucide-react";
import type { GraphNode, GraphData } from "@/lib/graph-data";

const kindLabel: Record<GraphNode["kind"], string> = {
  core: "Living Core Sun",
  category: "Neural Category",
  idea: "Captured Idea Node",
};

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

interface DetailsPanelProps {
  node: GraphNode | null;
  graph: GraphData;
  onClose: () => void;
  onSelectNode: (node: GraphNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onEditNode?: (node: GraphNode) => void;
}

export default function DetailsPanel({
  node,
  graph,
  onClose,
  onSelectNode,
  onDeleteNode,
  onEditNode,
}: DetailsPanelProps) {
  const [copied, setCopied] = useState(false);
  const open = Boolean(node);

  if (!node) {
    return (
      <aside
        aria-hidden="true"
        className="fixed right-0 top-0 z-30 h-screen w-[min(90vw,380px)] border-l border-[#333333] bg-[#000000] translate-x-full transition-transform duration-300 ease-out"
      />
    );
  }

  const isCore = node.kind === "core";
  const isCategory = node.kind === "category";
  const isIdea = node.kind === "idea";

  // Find parent node if exists
  const parentNode = node.parentId
    ? graph.nodes.find((n) => n.id === node.parentId)
    : null;

  // Find all child nodes directly attached to this node
  const childNodes = graph.nodes.filter((n) => n.parentId === node.id);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && node.body) {
      navigator.clipboard.writeText(node.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = node.createdAt
    ? new Date(node.createdAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Origin Baseline";

  const nodeColor = node.color || "#FFFFFF";
  const isTitleArabic = containsArabic(node.title);
  const isBodyArabic = containsArabic(node.body);

  return (
    <aside
      aria-hidden={!open}
      className={`fixed right-0 top-0 z-30 h-screen w-[min(92vw,420px)] border-l border-[#333333] bg-[#000000] transition-transform duration-300 ease-out flex flex-col shadow-2xl ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col p-7 overflow-y-auto">
        {/* Header & Close */}
        <div className="flex items-center justify-between border-b border-[#222222] pb-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: nodeColor }}
            />
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#F5F5DC]/80">
              {kindLabel[node.kind]}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg border border-[#333333] p-1.5 text-[#FFFFFF]/60 transition-colors hover:border-[#F5F5DC] hover:text-[#FFFFFF]"
          >
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Title */}
        <h2
          dir={isTitleArabic ? "rtl" : "ltr"}
          className={`mt-6 font-serif text-2xl font-normal tracking-tight text-[#F5F5DC] ${
            isTitleArabic ? "text-right font-sans font-semibold text-xl leading-relaxed" : "italic"
          }`}
        >
          {node.title}
        </h2>

        {/* Parent Connection Tag (Clickable jump to parent) */}
        {parentNode && (
          <button
            type="button"
            onClick={() => onSelectNode(parentNode)}
            className="mt-3.5 flex items-center gap-2 self-start rounded-full border border-[#333333] bg-[#0c0c0c] px-3.5 py-1.5 text-left transition-colors hover:border-[#F5F5DC]/60"
          >
            {parentNode.kind === "category" ? (
              <FolderTree size={12} style={{ color: parentNode.color || "#F5F5DC" }} />
            ) : parentNode.kind === "core" ? (
              <span className="text-[11px] text-[#FFFFFF]">★</span>
            ) : (
              <Lightbulb size={12} style={{ color: parentNode.color || "#F5F5DC" }} />
            )}
            <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#F5F5DC]/80">
              Parent: {parentNode.title}
            </span>
          </button>
        )}

        <div className="my-5 h-px w-full bg-[#222222]" />

        {/* Description / Content */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[9px] uppercase tracking-[0.24em] text-[#FFFFFF]/40">
              {isIdea ? "Idea Details & Thoughts" : "Category Overview"}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider text-[#F5F5DC]/70 hover:text-[#FFFFFF]"
            >
              {copied ? (
                <>
                  <Check size={11} className="text-[#F5F5DC]" /> Copied
                </>
              ) : (
                <>
                  <Copy size={11} /> Copy
                </>
              )}
            </button>
          </div>
          <div className="rounded-xl border border-[#333333] bg-[#0a0a0a] p-5 shadow-inner">
            <p
              dir={isBodyArabic ? "rtl" : "ltr"}
              className={`font-sans text-sm leading-relaxed text-[#FFFFFF] select-text whitespace-pre-wrap ${
                isBodyArabic ? "text-right text-base font-normal leading-loose" : "text-sm"
              }`}
            >
              {node.body || "No description provided."}
            </p>
          </div>
        </div>

        {/* Interactive Reference Link */}
        {node.url && (
          <div className="mt-5 space-y-2">
            <span className="font-sans text-[9px] uppercase tracking-[0.24em] text-[#FFFFFF]/40">
              Reference Resource
            </span>
            <a
              href={node.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-[#F5F5DC]/40 bg-[#0a0a0a] px-4 py-3 text-xs font-sans text-[#F5F5DC] transition-all hover:bg-[#F5F5DC]/10 hover:border-[#F5F5DC] hover:underline"
            >
              <span className="truncate pr-2 font-mono text-[11px] text-[#F5F5DC]">
                {node.url}
              </span>
              <span className="flex items-center gap-1 shrink-0 uppercase tracking-wider text-[10px] text-[#F5F5DC]">
                [ Visit Link <ArrowUpRight size={12} /> ]
              </span>
            </a>
          </div>
        )}

        {/* Connected Child Nodes */}
        {childNodes.length > 0 && (
          <div className="mt-6 space-y-3">
            <span className="font-sans text-[9px] uppercase tracking-[0.24em] text-[#FFFFFF]/40">
              Evolved / Child Nodes ({childNodes.length})
            </span>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {childNodes.map((child) => {
                const isChildArabic = containsArabic(child.title);
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => onSelectNode(child)}
                    className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] p-3 text-left transition-all hover:border-[#F5F5DC]/60 flex items-start gap-2.5"
                  >
                    <span
                      className="mt-1 inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: child.color || nodeColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        dir={isChildArabic ? "rtl" : "ltr"}
                        className={`text-xs text-[#F5F5DC] truncate font-medium ${
                          isChildArabic ? "text-right" : "font-serif italic"
                        }`}
                      >
                        {child.title}
                      </p>
                      <p
                        dir={containsArabic(child.body) ? "rtl" : "ltr"}
                        className="mt-1 font-sans text-[11px] text-[#FFFFFF]/60 line-clamp-2"
                      >
                        {child.body}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Metadata & Actions Footer */}
        <div className="mt-auto pt-6 space-y-3">
          <div className="rounded-lg border border-[#222222] bg-[#080808] p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#FFFFFF]/40">
                Created
              </span>
              <span className="font-sans text-[10px] text-[#FFFFFF]/70">
                {formattedDate}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#FFFFFF]/40">
                Node ID
              </span>
              <span className="font-mono text-[10px] text-[#FFFFFF]/50 truncate max-w-[180px]">
                {node.id}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {!isCore && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onEditNode?.(node);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#F5F5DC] bg-[#0a0a0a] py-2.5 font-sans text-[10px] uppercase tracking-[0.16em] text-[#F5F5DC] transition-colors hover:bg-[#F5F5DC] hover:text-[#000000]"
              >
                <Edit3 size={13} strokeWidth={1.6} />
                Edit Node
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to delete "${node.title}"?${
                        childNodes.length > 0
                          ? ` This will also remove ${childNodes.length} connected sub-nodes.`
                          : ""
                      }`,
                    )
                  ) {
                    onDeleteNode(node.id);
                    onClose();
                  }
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#333333] py-2.5 font-sans text-[10px] uppercase tracking-[0.16em] text-[#FFFFFF]/50 transition-colors hover:border-[#FFFFFF] hover:text-[#FFFFFF]"
              >
                <Trash2 size={13} strokeWidth={1.5} />
                Delete Node
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
