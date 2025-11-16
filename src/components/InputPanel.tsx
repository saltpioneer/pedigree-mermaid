import { useState, useCallback } from 'react';
import { 
  Button, 
  TextArea, 
  Heading, 
  Callout,
  Tooltip,
  Text,
  Flex
} from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import { useFlowStore, type Node } from '../state/useFlowStore';
import { mermaidToReactFlow } from '../lib/mermaidToReactFlow';
import { validateInput, preprocessInput } from '../lib/parseFamilyPrompt';

export function InputPanel() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setGraph, addNode, removeNode, selectedNodeId, nodes } = useFlowStore();

  const handleAddNode = useCallback(() => {
    // Calculate a default position - center of viewport or offset from existing nodes
    let x = 400;
    let y = 300;
    
    if (nodes.length > 0) {
      // Position new node near the center of existing nodes
      const avgX = nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length;
      const avgY = nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length;
      x = avgX + 200;
      y = avgY;
    }
    
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      data: { label: 'New Node' },
      position: { x, y },
      type: 'default',
    };
    addNode(newNode);
  }, [addNode, nodes]);

  const handleRemoveNode = useCallback(() => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
    }
  }, [selectedNodeId, removeNode]);

  const handleConvert = async () => {
    setError(null);
    
    // Validate input
    const validation = validateInput(text);
    if (!validation.valid) {
      setError(validation.error || 'Invalid input');
      return;
    }

    const processedText = preprocessInput(text);
    setLoading(true);

    try {
      // Call API endpoint
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: processedText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { mermaid } = await response.json();

      // Convert Mermaid to React Flow
      const { nodes, edges } = await mermaidToReactFlow(mermaid);
      
      // Update store
      setGraph(nodes, edges);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert text to family tree');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-5">
        <Flex direction="column" gap="4">
          <Heading size="4">Input Family Tree Text</Heading>
          <Flex gap="3">
            <Tooltip content="Add a new node to the graph">
              <Button
                onClick={handleAddNode}
                variant="soft"
                size="2"
                style={{ flex: 1 }}
              >
                Add Node
              </Button>
            </Tooltip>
            <Tooltip content="Remove the selected node">
              <Button
                onClick={handleRemoveNode}
                disabled={!selectedNodeId}
                variant="solid"
                color="red"
                size="2"
                style={{ flex: 1 }}
              >
                Remove Node
              </Button>
            </Tooltip>
          </Flex>
          <Text size="2" color="gray">
            Describe family relationships in natural language
          </Text>
        </Flex>
      </div>

      <div className="p-5 flex-1 overflow-auto border-t border-gray-200">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Example:&#10;John and Mary have a daughter Sarah. Sarah married Tim. They have two sons, Alex and Ben."
          style={{ width: '100%', height: '100%', resize: 'none' }}
          disabled={loading}
          size="3"
          variant="surface"
        />
      </div>

      {error && (
        <>
          <div className="p-5 border-t border-gray-200">
            <Callout.Root color="red" variant="soft">
              <Callout.Text>
                <Text weight="medium">Error: </Text>
                {error}
              </Callout.Text>
            </Callout.Root>
          </div>
        </>
      )}

      <div className="p-5 border-t border-gray-200">
        <Button
          onClick={handleConvert}
          disabled={loading || !text.trim()}
          size="3"
          variant="classic"
          style={{ width: '100%' }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Converting...</span>
            </>
          ) : (
            <span>Convert to Family Tree</span>
          )}
        </Button>
      </div>
    </div>
  );
}

