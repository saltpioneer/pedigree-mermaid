import { useState, useEffect } from 'react';
import { Button, Heading, Flex, Separator, Tooltip, Kbd, Text } from '@radix-ui/themes';
import { InputPanel } from '../components/InputPanel';
import { FlowRenderer } from '../components/FlowRenderer';
import { NodeEditorSidebar } from '../components/NodeEditorSidebar';
import { useFlowStore } from '../state/useFlowStore';
import html2canvas from 'html2canvas';
import { applyLayout } from '../lib/layout';

export function Home() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { nodes, edges, setGraph, updateNodePosition } = useFlowStore();

  const handleExportJSON = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-tree-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = async () => {
    const reactFlowElement = document.querySelector('.react-flow');
    if (!reactFlowElement) return;

    try {
      const canvas = await html2canvas(reactFlowElement as HTMLElement, {
        backgroundColor: '#f7f9fb',
      });
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-tree-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export PNG:', error);
      alert('Failed to export PNG. Please try again.');
    }
  };

  const handleRelayout = () => {
    const layoutedNodes = applyLayout(nodes, edges);
    layoutedNodes.forEach((node) => {
      updateNodePosition(node.id, node.position);
    });
    setGraph(layoutedNodes, edges);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key to remove selected node
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          const { removeNode, setSelectedNode } = useFlowStore.getState();
          removeNode(selectedNodeId);
          setSelectedNode(null);
          setSelectedNodeId(null);
        }
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        useFlowStore.getState().setSelectedNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  return (
    <div className="flex flex-col h-screen bg-[#f7f9fb]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="p-5">
          <Flex align="center" justify="between">
            <Flex align="center" gap="4">
              <Heading size="6">Mudra's Personal Pedigree Maker</Heading>
              <Tooltip content="Delete selected node">
                <Text size="1" color="gray">
                  <Kbd>Delete</Kbd> to remove, <Kbd>Esc</Kbd> to deselect
                </Text>
              </Tooltip>
            </Flex>
            
            <Flex gap="3">
              {nodes.length > 0 && (
                <>
                  <Button
                    onClick={handleRelayout}
                    size="3"
                    variant="classic"
                  >
                    Re-layout
                  </Button>
                  
                  <Button
                    onClick={handleExportJSON}
                    size="3"
                    variant="classic"
                  >
                    Export JSON
                  </Button>
                  
                  <Button
                    onClick={handleExportPNG}
                    size="3"
                    variant="classic"
                  >
                    Export PNG
                  </Button>
                </>
              )}
            </Flex>
          </Flex>
        </div>
        <Separator />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input */}
        <div className="w-96 border-r border-gray-200 hidden lg:block">
          <InputPanel />
        </div>

        {/* Center - Flow Renderer */}
        <div className="flex-1 min-w-0 p-4">
          <FlowRenderer onNodeSelect={setSelectedNodeId} />
        </div>

        {/* Right Panel - Node Editor (conditional) */}
        {selectedNodeId && (
          <div className="border-l border-gray-200 hidden xl:block">
            <NodeEditorSidebar selectedNodeId={selectedNodeId} />
          </div>
        )}
      </div>

      {/* Mobile Input Panel Overlay */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-h-64 overflow-auto p-4">
        <InputPanel />
      </div>

      {/* Mobile Node Editor Overlay */}
      {selectedNodeId && (
        <div className="xl:hidden fixed top-20 right-0 w-80 h-[calc(100vh-5rem)] bg-white border-l border-gray-200 shadow-lg z-50 p-4">
          <NodeEditorSidebar selectedNodeId={selectedNodeId} />
        </div>
      )}
    </div>
  );
}

