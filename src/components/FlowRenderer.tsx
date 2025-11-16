import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import type { Node, Edge } from '../state/useFlowStore';
import 'reactflow/dist/style.css';
import { useFlowStore } from '../state/useFlowStore';
import { applyLayout } from '../lib/layout';

interface FlowRendererProps {
  onNodeSelect?: (nodeId: string | null) => void;
}

function LayoutButton() {
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const { updateNodePosition } = useFlowStore();

  const handleLayout = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();
    const layoutedNodes = applyLayout(nodes, edges);

    layoutedNodes.forEach((node) => {
      updateNodePosition(node.id, node.position);
    });

    setNodes(layoutedNodes);
  }, [getNodes, getEdges, setNodes, updateNodePosition]);

  return (
    <button
      onClick={handleLayout}
      className="px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
                 border border-gray-300 dark:border-gray-600 rounded shadow 
                 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      title="Re-layout graph"
    >
      Layout
    </button>
  );
}

function FlowRendererInner({ onNodeSelect }: FlowRendererProps) {
  const { nodes, edges, setSelectedNode, updateNodePosition } = useFlowStore();
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
    // Handle new connections if needed
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [setSelectedNode, onNodeSelect]);

  // Sync store state to React Flow when nodes/edges change from external sources
  useEffect(() => {
    setReactFlowNodes(nodes);
  }, [nodes, setReactFlowNodes]);

  useEffect(() => {
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onPaneClick={onPaneClick}
      fitView
      className="bg-gray-50 dark:bg-gray-900"
    >
      <Background />
      <Controls className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
      <MiniMap 
        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        nodeColor={(node) => {
          return node.selected ? '#3b82f6' : '#94a3b8';
        }}
      />
      <Panel position="top-right" className="flex gap-2">
        <LayoutButton />
      </Panel>
    </ReactFlow>
  );
}

export function FlowRenderer(props: FlowRendererProps) {
  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      <ReactFlowProvider>
        <FlowRendererInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
