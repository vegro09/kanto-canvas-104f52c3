export type NodeKind = "core" | "category" | "idea";

export const KANTO_COLORS = [
  "#C5A059", // Muted Gold
  "#4A6B82", // Dusty Slate Blue
  "#5A7258", // Sage Green
  "#A75D4D", // Terracotta
  "#705D7A", // Muted Amethyst
  "#8C7A6B", // Warm Taupe
];

export interface GraphNode {
  id: string;
  kind: NodeKind;
  title: string;
  body: string;
  url?: string;
  parentId?: string;
  categoryId?: string;
  createdAt?: number;
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * BLANK SLATE AXIOM:
 * Initial state ONLY contains the central Sun Core ("KANTO EMPIRE").
 */
export const initialGraphNodes: GraphNode[] = [
  {
    id: "core",
    kind: "core",
    title: "KANTO EMPIRE",
    body: "The living neural empire. Manually forge nodes, categories, and connected thoughts.",
    createdAt: 1700000000000,
    color: "#FFFFFF",
  },
];

export const initialGraphLinks: GraphLink[] = [];

export const nodeStyle: Record<
  NodeKind,
  { size: number; defaultColor: string; opacity: number }
> = {
  core: { size: 2.4, defaultColor: "#FFFFFF", opacity: 1.0 },
  category: { size: 1.35, defaultColor: "#F5F5DC", opacity: 0.95 },
  idea: { size: 0.85, defaultColor: "#FFFFFF", opacity: 0.88 },
};

const STORAGE_KEY = "kanto_manual_graph_v1";

/**
 * Loads graph data from localStorage, strictly ensuring Blank Slate.
 */
export function loadGraphFromStorage(): GraphData {
  if (typeof window === "undefined") {
    return { nodes: initialGraphNodes, links: initialGraphLinks };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        Array.isArray(parsed.nodes) &&
        parsed.nodes.length > 0 &&
        Array.isArray(parsed.links)
      ) {
        // Ensure Core node is always named KANTO EMPIRE
        const coreNode = parsed.nodes.find((n: GraphNode) => n.id === "core");
        if (coreNode) {
          coreNode.title = "KANTO EMPIRE";
          coreNode.color = "#FFFFFF";
        } else {
          parsed.nodes.unshift(initialGraphNodes[0]);
        }

        return parsed as GraphData;
      }
    }
  } catch (err) {
    console.error("Error reading graph from localStorage:", err);
  }

  return { nodes: initialGraphNodes, links: initialGraphLinks };
}

/**
 * Saves graph data to localStorage.
 */
export function saveGraphToStorage(data: GraphData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Error saving graph to localStorage:", err);
  }
}

/**
 * Resets graph data to Blank Slate (only KANTO EMPIRE core).
 */
export function resetGraphToDefault(): GraphData {
  const data: GraphData = {
    nodes: [...initialGraphNodes],
    links: [...initialGraphLinks],
  };
  saveGraphToStorage(data);
  return data;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
}

export interface ManualNodePayload {
  kind: "category" | "idea";
  title: string;
  description: string;
  url?: string;
  parentId: string;
}

export interface AddManualNodeResult {
  newGraph: GraphData;
  createdNode: GraphNode;
}

/**
 * Manually forges a new Node in the Graph with custom cross-linking and reference link.
 */
export function addManualNodeToGraph(
  currentGraph: GraphData,
  payload: ManualNodePayload,
): AddManualNodeResult {
  const newNodes = [...currentGraph.nodes];
  const newLinks = [...currentGraph.links];

  const title = payload.title.trim();
  const description = (payload.description || title).trim();
  const cleanUrl = (payload.url || "").trim();
  const parentId = payload.parentId || "core";

  // Find parent node
  const parentNode = newNodes.find((n) => n.id === parentId) || newNodes[0];

  let nodeColor: string;
  let nodeId: string;

  if (payload.kind === "category") {
    const existingCatsCount = newNodes.filter((n) => n.kind === "category").length;
    nodeColor = KANTO_COLORS[existingCatsCount % KANTO_COLORS.length];
    const slug = slugify(title) || "cat";
    nodeId = `cat-${slug}-${Date.now().toString(36)}`;
  } else {
    nodeColor =
      parentNode.color && parentNode.color !== "#FFFFFF"
        ? parentNode.color
        : KANTO_COLORS[newNodes.length % KANTO_COLORS.length];
    const slug = slugify(title) || "idea";
    nodeId = `idea-${slug}-${Date.now().toString(36)}`;
  }

  const createdNode: GraphNode = {
    id: nodeId,
    kind: payload.kind,
    title,
    body: description,
    url: cleanUrl || undefined,
    parentId: parentNode.id,
    categoryId: parentNode.kind === "category" ? parentNode.id : parentNode.categoryId,
    color: nodeColor,
    createdAt: Date.now(),
  };

  newNodes.push(createdNode);
  newLinks.push({ source: parentNode.id, target: nodeId });

  const newGraph: GraphData = {
    nodes: newNodes,
    links: newLinks,
  };

  saveGraphToStorage(newGraph);

  return {
    newGraph,
    createdNode,
  };
}

/**
 * Updates an existing node in-place (Edit Node).
 */
export function updateNodeInGraph(
  currentGraph: GraphData,
  nodeId: string,
  payload: Partial<ManualNodePayload>,
): GraphData {
  if (nodeId === "core") return currentGraph;

  const newNodes = currentGraph.nodes.map((node) => {
    if (node.id !== nodeId) return node;

    const updatedTitle = payload.title !== undefined ? payload.title.trim() : node.title;
    const updatedDesc = payload.description !== undefined ? payload.description.trim() : node.body;
    const updatedUrl = payload.url !== undefined ? (payload.url.trim() || undefined) : node.url;
    const updatedKind = payload.kind !== undefined ? payload.kind : node.kind;
    const updatedParentId = payload.parentId !== undefined ? payload.parentId : node.parentId;

    return {
      ...node,
      title: updatedTitle,
      body: updatedDesc,
      url: updatedUrl,
      kind: updatedKind,
      parentId: updatedParentId,
    };
  });

  // If parent changed, update the links
  let newLinks = [...currentGraph.links];
  if (payload.parentId !== undefined) {
    // Remove old parent link
    newLinks = newLinks.filter((l) => {
      const tgt = typeof l.target === "object" ? (l.target as any).id : l.target;
      return tgt !== nodeId;
    });
    // Add new parent link
    newLinks.push({ source: payload.parentId, target: nodeId });
  }

  const newGraph: GraphData = {
    nodes: newNodes,
    links: newLinks,
  };

  saveGraphToStorage(newGraph);
  return newGraph;
}

/**
 * Deletes a node and all connected links (and children).
 */
export function deleteNodeFromGraph(
  currentGraph: GraphData,
  nodeId: string,
): GraphData {
  if (nodeId === "core") return currentGraph;

  const targetNode = currentGraph.nodes.find((n) => n.id === nodeId);
  if (!targetNode) return currentGraph;

  const nodesToDelete = new Set<string>([nodeId]);

  let changed = true;
  while (changed) {
    changed = false;
    for (const node of currentGraph.nodes) {
      if (!nodesToDelete.has(node.id) && node.parentId && nodesToDelete.has(node.parentId)) {
        nodesToDelete.add(node.id);
        changed = true;
      }
    }
  }

  const updatedNodes = currentGraph.nodes.filter(
    (n) => !nodesToDelete.has(n.id),
  );

  const updatedLinks = currentGraph.links.filter((l) => {
    const src = typeof l.source === "object" ? (l.source as any).id : l.source;
    const tgt = typeof l.target === "object" ? (l.target as any).id : l.target;
    return !nodesToDelete.has(src) && !nodesToDelete.has(tgt);
  });

  const newGraph: GraphData = {
    nodes: updatedNodes,
    links: updatedLinks,
  };

  saveGraphToStorage(newGraph);
  return newGraph;
}
