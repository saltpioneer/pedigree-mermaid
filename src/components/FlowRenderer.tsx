import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import type { Edge } from '../state/useFlowStore';
import 'reactflow/dist/style.css';
import { useFlowStore } from '../state/useFlowStore';

interface FlowRendererProps {
  onNodeSelect?: (nodeId: string | null) => void;
}

function FlowRendererInner({ onNodeSelect }: FlowRendererProps) {
  const { nodes, edges, setSelectedNode, updateNodePosition, addEdge, selectedNodeId } = useFlowStore();
  const { setNodes: setReactFlowNodes, setEdges: setReactFlowEdges } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: any[]) => {
      // Apply changes to Zustand store
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.positionAbsolute) {
          updateNodePosition(change.id, change.positionAbsolute);
        }
        if (change.type === 'select') {
          if (change.selected) {
            setSelectedNode(change.id);
            onNodeSelect?.(change.id);
          } else {
            setSelectedNode(null);
            onNodeSelect?.(null);
          }
        }
      });
    },
    [updateNodePosition, setSelectedNode, onNodeSelect]
  );

  const onEdgesChange = useCallback(() => {
    // Handle edge changes if needed
  }, []);

  const onConnect = useCallback((params: any) => {
    // Create a new edge when user connects two nodes
    const newEdge: Edge = {
      id: `${params.source}-${params.target}-${Date.now()}`,
      source: params.source,
      target: params.target,
      type: 'smoothstep',
    };
    addEdge(newEdge);
  }, [addEdge]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [setSelectedNode, onNodeSelect]);

  // Compute highlighted nodes and edges for spotlight effect
  const highlightedNodeIds = new Set<string>();
  const highlightedEdgeIds = new Set<string>();

  if (selectedNodeId) {
    // Recursively find all ancestors (parents, grandparents, etc.)
    const findAllAncestors = (nodeId: string, visited: Set<string>) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      edges.forEach((edge) => {
        if (edge.target === nodeId) {
          highlightedNodeIds.add(edge.source);
          highlightedEdgeIds.add(edge.id);
          findAllAncestors(edge.source, visited);
        }
      });
    };

    // Recursively find all descendants (children, grandchildren, etc.)
    const findAllDescendants = (nodeId: string, visited: Set<string>) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      edges.forEach((edge) => {
        if (edge.source === nodeId) {
          highlightedNodeIds.add(edge.target);
          highlightedEdgeIds.add(edge.id);
          findAllDescendants(edge.target, visited);
        }
      });
    };

    // Start with the selected node
    highlightedNodeIds.add(selectedNodeId);
    
    // Find all ancestors and descendants
    findAllAncestors(selectedNodeId, new Set());
    findAllDescendants(selectedNodeId, new Set());
  }

  // Apply spotlight styling to nodes
  const styledNodes = nodes.map((node) => {
    const isHighlighted = highlightedNodeIds.has(node.id);
    // If no node is selected, show all nodes at full opacity
    const opacity = selectedNodeId ? (isHighlighted ? 1 : 0.3) : 1;
    return {
      ...node,
      style: {
        ...node.style,
        opacity,
        transition: 'opacity 0.2s ease-in-out',
      },
    };
  });

  // Apply spotlight styling to edges
  const styledEdges = edges.map((edge) => {
    const isHighlighted = highlightedEdgeIds.has(edge.id);
    // If no node is selected, show all edges at full opacity
    const opacity = selectedNodeId ? (isHighlighted ? 1 : 0.2) : 1;
    const strokeWidth = selectedNodeId ? (isHighlighted ? 2 : 1) : 1;
    return {
      ...edge,
      style: {
        ...edge.style,
        opacity,
        strokeWidth,
        transition: 'opacity 0.2s ease-in-out',
      },
    };
  });

  // Sync store state to React Flow when nodes/edges change from external sources
  useEffect(() => {
    setReactFlowNodes(styledNodes);
  }, [styledNodes, setReactFlowNodes]);

  useEffect(() => {
    setReactFlowEdges(styledEdges);
  }, [styledEdges, setReactFlowEdges]);

  return (
    <ReactFlow
      nodes={styledNodes}
      edges={styledEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onPaneClick={onPaneClick}
      fitView
      className="bg-[#f7f9fb]"
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls className="bg-white border-gray-300" />
      <MiniMap 
        className="bg-white border-gray-300"
        nodeColor={(node) => {
          return node.selected ? '#05a2c2' : '#94a3b8';
        }}
      />
    </ReactFlow>
  );
}

export function FlowRenderer(props: FlowRendererProps) {
  return (
    <div className="w-full h-full bg-[#f7f9fb] rounded-lg overflow-hidden">
      <ReactFlowProvider>
        <FlowRendererInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
