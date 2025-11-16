import { create } from 'zustand';

// Define Node and Edge types compatible with React Flow
export interface Node {
  id: string;
  type?: string;
  data: any;
  position: { x: number; y: number };
  selected?: boolean;
  [key: string]: any;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  [key: string]: any;
}

interface FlowStore {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  setGraph: (nodes: Node[], edges: Edge[]) => void;
  updateNode: (id: string, data: Partial<Node['data']>) => void;
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  reset: () => void;
}

const initialState = {
  nodes: [] as Node[],
  edges: [] as Edge[],
  selectedNodeId: null as string | null,
};

export const useFlowStore = create<FlowStore>((set) => ({
  ...initialState,

  setGraph: (nodes, edges) => set({ nodes, edges, selectedNodeId: null }),

  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    })),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),

  removeEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  updateNodePosition: (id, position) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, position } : node
      ),
    })),

  reset: () => set(initialState),
}));

