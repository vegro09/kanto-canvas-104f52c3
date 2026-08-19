import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState, useCallback } from "react";
import DetailsPanel from "@/components/kanto/DetailsPanel";
import AddNodeButton from "@/components/kanto/AddNodeButton";
import NodeForgeModal from "@/components/kanto/NodeForgeModal";
import HeaderToolbar from "@/components/kanto/HeaderToolbar";
import {
  loadGraphFromStorage,
  resetGraphToDefault,
  addManualNodeToGraph,
  updateNodeInGraph,
  deleteNodeFromGraph,
  type GraphNode,
  type GraphData,
  type ManualNodePayload,
} from "@/lib/graph-data";

const MemoryGraph = lazy(() => import("@/components/kanto/MemoryGraph"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kanto Memory — Neural Graph Architecture" },
      {
        name: "description",
        content:
          "Kanto Memory: Manually forge and connect living idea constellations in flat 2D space.",
      },
      {
        property: "og:title",
        content: "Kanto Memory — Neural Graph Architecture",
      },
      {
        property: "og:description",
        content:
          "Manually forge and connect living idea constellations in flat 2D space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [graph, setGraph] = useState<GraphData>(() => loadGraphFromStorage());
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialKind, setModalInitialKind] = useState<"category" | "idea">("idea");
  const [modalParentId, setModalParentId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  }, []);

  // Handle manual node creation from the Node Forge
  const handleForgeNode = useCallback(
    (payload: ManualNodePayload) => {
      setGraph((prevGraph) => {
        const { newGraph, createdNode } = addManualNodeToGraph(prevGraph, payload);
        setSelected(createdNode);
        showToast(
          createdNode.kind === "category"
            ? `Forged Category: "${createdNode.title}"`
            : `Forged Idea Node: "${createdNode.title}"`,
        );
        return newGraph;
      });
    },
    [showToast],
  );

  // Handle manual node editing
  const handleEditNode = useCallback(
    (nodeId: string, payload: ManualNodePayload) => {
      setGraph((prevGraph) => {
        const newGraph = updateNodeInGraph(prevGraph, nodeId, payload);
        const updated = newGraph.nodes.find((n) => n.id === nodeId) || null;
        setSelected(updated);
        showToast(`Saved changes for "${payload.title}"`);
        return newGraph;
      });
    },
    [showToast],
  );

  // Double-click on canvas empty space -> Quick Add Category linked to Core
  const handleDoubleClickCanvas = useCallback(() => {
    setEditingNode(null);
    setModalInitialKind("category");
    setModalParentId("core");
    setIsModalOpen(true);
  }, []);

  // Double-click / Double-tap on existing node -> Quick Add Idea linked to that node
  const handleDoubleClickNode = useCallback((node: GraphNode) => {
    setEditingNode(null);
    setModalInitialKind("idea");
    setModalParentId(node.id);
    setIsModalOpen(true);
  }, []);

  // Long-press on mobile phone -> Edit Idea or Category
  const handleLongPressNode = useCallback((node: GraphNode) => {
    if (node.kind === "core") return;
    setEditingNode(node);
    setIsModalOpen(true);
    showToast(`Editing "${node.title}"`);
  }, [showToast]);

  // Edit from details panel
  const handleStartEditFromPanel = useCallback((node: GraphNode) => {
    setEditingNode(node);
    setIsModalOpen(true);
  }, []);

  // Bottom button click -> Opens forge
  const handleAddButtonClick = useCallback(() => {
    setEditingNode(null);
    setModalInitialKind(selected ? "idea" : "category");
    setModalParentId(selected ? selected.id : "core");
    setIsModalOpen(true);
  }, [selected]);

  const handleResetGraph = useCallback(() => {
    const fresh = resetGraphToDefault();
    setGraph(fresh);
    setSelected(null);
    showToast("Graph reset to KANTO EMPIRE core");
  }, [showToast]);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setGraph((prev) => deleteNodeFromGraph(prev, nodeId));
      setSelected(null);
      showToast("Node deleted from memory");
    },
    [showToast],
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#000000] text-[#FFFFFF] select-none touch-none">
      {/* 2D Planar Neural Constellation Graph */}
      <div className="absolute inset-0">
        <ClientOnly
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-[#000000]">
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#F5F5DC]/60 animate-pulse">
                Initializing Neural Brain...
              </span>
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-[#000000]">
                <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#F5F5DC]/60 animate-pulse">
                  Rendering Constellation...
                </span>
              </div>
            }
          >
            <MemoryGraph
              nodes={graph.nodes}
              links={graph.links}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onDoubleClickCanvas={handleDoubleClickCanvas}
              onDoubleClickNode={handleDoubleClickNode}
              onLongPressNode={handleLongPressNode}
            />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Header Toolbar */}
      <HeaderToolbar graph={graph} onResetGraph={handleResetGraph} />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="pointer-events-none fixed top-7 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-full border border-[#F5F5DC]/30 bg-[#000000]/90 px-4 py-1.5 backdrop-blur-md shadow-xl">
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#F5F5DC]">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* Manual [ + ADD NODE ] Button */}
      <AddNodeButton onClick={handleAddButtonClick} />

      {/* The Node Forge Creation & Edit Modal */}
      <NodeForgeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNode(null);
        }}
        existingNodes={graph.nodes}
        selectedParentId={modalParentId}
        initialKind={modalInitialKind}
        editingNode={editingNode}
        onSubmit={handleForgeNode}
        onSubmitEdit={handleEditNode}
      />

      {/* Inspection & Details Panel */}
      <DetailsPanel
        node={selected}
        graph={graph}
        onClose={() => setSelected(null)}
        onSelectNode={setSelected}
        onDeleteNode={handleDeleteNode}
        onEditNode={handleStartEditFromPanel}
      />
    </main>
  );
}
