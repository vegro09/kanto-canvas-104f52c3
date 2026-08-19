export type NodeKind = "core" | "category" | "idea";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  title: string;
  body: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export const graphNodes: GraphNode[] = [
  {
    id: "core",
    kind: "core",
    title: "Kanto Memory",
    body: "Your living memory graph. Speak an idea and it finds its place.",
  },
  {
    id: "cat-product",
    kind: "category",
    title: "Product",
    body: "Ideas about what to build and why it matters.",
  },
  {
    id: "cat-research",
    kind: "category",
    title: "Research",
    body: "Questions worth chasing and sources worth keeping.",
  },
  {
    id: "cat-personal",
    kind: "category",
    title: "Personal",
    body: "Notes to self, habits, and quiet observations.",
  },
  {
    id: "idea-1",
    kind: "idea",
    title: "Voice-first capture",
    body: "Recording should feel like thinking out loud — no forms, no fields, just a single press.",
  },
  {
    id: "idea-2",
    kind: "idea",
    title: "Spatial recall",
    body: "Memory is spatial. Placing ideas in space makes them easier to find again later.",
  },
  {
    id: "idea-3",
    kind: "idea",
    title: "Silence as signal",
    body: "A pause of two seconds is a sentence boundary. Use it to segment thoughts.",
  },
  {
    id: "idea-4",
    kind: "idea",
    title: "Citation trails",
    body: "Every claim keeps a thread back to where it came from.",
  },
  {
    id: "idea-5",
    kind: "idea",
    title: "Morning pages",
    body: "Three unedited minutes before anything else. The graph keeps the rest.",
  },
  {
    id: "idea-6",
    kind: "idea",
    title: "Fewer surfaces",
    body: "One canvas, one button. Everything else earns its place or leaves.",
  },
];

export const graphLinks: GraphLink[] = [
  { source: "core", target: "cat-product" },
  { source: "core", target: "cat-research" },
  { source: "core", target: "cat-personal" },
  { source: "cat-product", target: "idea-1" },
  { source: "cat-product", target: "idea-6" },
  { source: "cat-research", target: "idea-3" },
  { source: "cat-research", target: "idea-4" },
  { source: "cat-personal", target: "idea-5" },
  { source: "cat-personal", target: "idea-2" },
];

export const nodeStyle: Record<
  NodeKind,
  { size: number; color: string; opacity: number }
> = {
  core: { size: 1.6, color: "#FFFFFF", opacity: 1 },
  category: { size: 1.0, color: "#F5F5DC", opacity: 0.8 },
  idea: { size: 0.55, color: "#FFFFFF", opacity: 0.4 },
};
