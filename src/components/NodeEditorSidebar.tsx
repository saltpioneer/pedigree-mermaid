import { useState, useEffect } from 'react';
import type React from 'react';
import { 
  Button, 
  TextField, 
  Dialog, 
  Text, 
  Flex, 
  Heading,
  Badge,
  AlertDialog,
  Card,
  DataList
} from '@radix-ui/themes';
import { useFlowStore, type Node, type Edge } from '../state/useFlowStore';

interface ConnectionsPopupProps {
  selectedNode: Node;
  edges: Edge[];
  nodes: Node[];
  onClose: () => void;
}

function ConnectionsPopup({ selectedNode, edges, nodes, onClose }: ConnectionsPopupProps) {
  const connectedNodes: Array<{ node: Node; relationship: string }> = [];

  edges.forEach((edge) => {
    if (edge.source === selectedNode.id) {
      const childNode = nodes.find((n) => n.id === edge.target);
      if (childNode) {
        connectedNodes.push({ node: childNode, relationship: 'Child' });
      }
    } else if (edge.target === selectedNode.id) {
      const parentNode = nodes.find((n) => n.id === edge.source);
      if (parentNode) {
        connectedNodes.push({ node: parentNode, relationship: 'Parent' });
      }
    }
  });

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content maxWidth="450px">
        <div className="p-5 pb-3">
          <Dialog.Title>Connections</Dialog.Title>
        </div>
        <div className="px-5 pb-5">
          {connectedNodes.length === 0 ? (
            <Text size="2" color="gray">No connections</Text>
          ) : (
            <DataList.Root>
              {connectedNodes.map(({ node, relationship }) => (
                <DataList.Item key={node.id}>
                  <DataList.Label>
                    <Text weight="medium">{relationship}</Text>
                  </DataList.Label>
                  <DataList.Value>
                    {node.data?.label || node.id}
                  </DataList.Value>
                </DataList.Item>
              ))}
            </DataList.Root>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

interface NodeEditorSidebarProps {
  selectedNodeId: string | null;
}

export function NodeEditorSidebar({ selectedNodeId }: NodeEditorSidebarProps) {
  const { nodes, edges, selectedNodeId: storeSelectedId, updateNode, removeNode, addNode, addEdge, setSelectedNode } = useFlowStore();
  const [nodeName, setNodeName] = useState('');
  const [showConnectionsPopup, setShowConnectionsPopup] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const selectedNode = nodes.find((n) => n.id === (selectedNodeId || storeSelectedId));

  useEffect(() => {
    if (selectedNode) {
      setNodeName(selectedNode.data.label || selectedNode.id);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="p-5">
          <Text size="2" color="gray">
            Select a node to edit
          </Text>
        </div>
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
    setShowDeleteDialog(false);
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

  const connectedEdges = edges.filter(
    (e) => e.source === selectedNode.id || e.target === selectedNode.id
  );

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-5">
        <Heading size="4">Edit Node</Heading>
      </div>

      <div className="p-5 flex-1 overflow-auto border-t border-gray-200">
        <Flex direction="column" gap="5">
          <Card>
            <div className="p-5">
              <Flex direction="column" gap="3">
                <Text size="2" weight="medium">
                  Node Name
                </Text>
                <TextField.Root
                  type="text"
                  value={nodeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNodeName(e.target.value)}
                  onBlur={handleUpdateName}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      handleUpdateName();
                      e.currentTarget.blur();
                    }
                  }}
                  size="3"
                  variant="soft"
                />
              </Flex>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <Flex direction="column" gap="3">
                <Text size="2" weight="medium">
                  Node ID
                </Text>
                <Text size="2" className="font-mono" style={{ backgroundColor: 'var(--gray-3)', padding: '0.5rem 0.75rem', borderRadius: '4px', display: 'block' }}>
                  {selectedNode.id}
                </Text>
              </Flex>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <Flex direction="column" gap="3">
                <Text size="2" weight="medium">
                  Connections
                </Text>
                <Button
                  variant="ghost"
                  onClick={() => setShowConnectionsPopup(true)}
                  size="2"
                >
                  <Badge color="cyan" variant="soft">
                    {connectedEdges.length}
                  </Badge>
                  <Text size="2"> connection{connectedEdges.length !== 1 ? 's' : ''} (click to view)</Text>
                </Button>
              </Flex>
            </div>
          </Card>
        </Flex>
      </div>

      {showConnectionsPopup && (
        <ConnectionsPopup
          selectedNode={selectedNode}
          edges={edges}
          nodes={nodes}
          onClose={() => setShowConnectionsPopup(false)}
        />
      )}

      <div className="p-5 border-t border-gray-200">
        <Flex direction="column" gap="3">
          <Button
            onClick={handleAddChild}
            variant="soft"
            size="3"
            style={{ width: '100%' }}
          >
            Add Child
          </Button>
          
          <Button
            onClick={handleDuplicate}
            variant="surface"
            size="3"
            style={{ width: '100%' }}
          >
            Duplicate Node
          </Button>
          
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="solid"
            color="red"
            size="3"
            style={{ width: '100%' }}
          >
            Remove Node
          </Button>
        </Flex>
      </div>

      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content maxWidth="450px">
          <div className="p-5">
            <AlertDialog.Title>Delete Node</AlertDialog.Title>
            <AlertDialog.Description size="2" mt="4">
              Are you sure you want to delete "{selectedNode.data?.label || selectedNode.id}"? This action cannot be undone.
            </AlertDialog.Description>
          </div>

          <div className="px-5 pb-5">
            <Flex gap="3" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button variant="solid" color="red" onClick={handleDelete}>
                  Delete
                </Button>
              </AlertDialog.Action>
            </Flex>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  );
}

