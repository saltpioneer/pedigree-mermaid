import { useState, useEffect } from 'react';
import { useFlowStore, type Node, type Edge } from '../state/useFlowStore';

interface NodeEditorSidebarProps {
  selectedNodeId: string | null;
}

export function NodeEditorSidebar({ selectedNodeId }: NodeEditorSidebarProps) {
  const { nodes, edges, selectedNodeId: storeSelectedId, updateNode, removeNode, addNode, addEdge, setSelectedNode } = useFlowStore();
  const [nodeName, setNodeName] = useState('');

  const selectedNode = nodes.find((n) => n.id === (selectedNodeId || storeSelectedId));

  useEffect(() => {
    if (selectedNode) {
      setNodeName(selectedNode.data.label || selectedNode.id);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Select a node to edit
        </p>
      </div>
    );
  }

  const handleUpdateName = () => {
    if (nodeName.trim()) {
      updateNode(selectedNode.id, { label: nodeName.trim() });
    }
  };

  const handleDelete = () => {
    removeNode(selectedNode.id);
    setSelectedNode(null);
  };

  const handleDuplicate = () => {
    const newId = `${selectedNode.id}-copy-${Date.now()}`;
    const newNode: Node = {
      ...selectedNode,
      id: newId,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50,
      },
      data: {
        ...selectedNode.data,
        label: `${selectedNode.data.label} (Copy)`,
      },
      selected: false,
    };
    addNode(newNode);
  };

  const handleAddChild = () => {
    const childId = `child-${Date.now()}`;
    const childNode: Node = {
      id: childId,
      data: { label: 'New Child' },
      position: {
        x: selectedNode.position.x,
        y: selectedNode.position.y + 150,
      },
      type: 'default',
    };
    addNode(childNode);
    
    const newEdge: Edge = {
      id: `${selectedNode.id}-${childId}`,
      source: selectedNode.id,
      target: childId,
      type: 'smoothstep',
    };
    addEdge(newEdge);
    setSelectedNode(childId);
  };

  const handleAddNode = () => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      data: { label: 'New Node' },
      position: {
        x: selectedNode.position.x + 200,
        y: selectedNode.position.y,
      },
      type: 'default',
    };
    addNode(newNode);
    setSelectedNode(newNodeId);
  };

  const connectedEdges = edges.filter(
    (e) => e.source === selectedNode.id || e.target === selectedNode.id
  );

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Edit Node
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Node Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              onBlur={handleUpdateName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateName();
                  e.currentTarget.blur();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Node ID
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {selectedNode.id}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Connections
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {connectedEdges.length} connection{connectedEdges.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={handleAddNode}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Add Node
        </button>
        
        <button
          onClick={handleAddChild}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Add Child
        </button>
        
        <button
          onClick={handleDuplicate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Duplicate Node
        </button>
        
        <button
          onClick={handleDelete}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Remove Node
        </button>
      </div>
    </div>
  );
}

