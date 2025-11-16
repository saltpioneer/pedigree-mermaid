import { useState, useEffect } from 'react';
import { InputPanel } from '../components/InputPanel';
import { FlowRenderer } from '../components/FlowRenderer';
import { NodeEditorSidebar } from '../components/NodeEditorSidebar';
import { useFlowStore } from '../state/useFlowStore';
import html2canvas from 'html2canvas';
import { applyLayout } from '../lib/layout';

export function Home() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const { nodes, edges, setGraph, updateNodePosition } = useFlowStore();

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
        backgroundColor: darkMode ? '#111827' : '#f9fafb',
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
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Pedigree Chart AI Editor
        </h1>
        
        <div className="flex items-center gap-3">
          {nodes.length > 0 && (
            <>
              <button
                onClick={handleRelayout}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                           rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Re-layout
              </button>
              
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Export JSON
              </button>
              
              <button
                onClick={handleExportPNG}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Export PNG
              </button>
            </>
          )}
          
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input */}
        <div className="w-96 border-r border-gray-200 dark:border-gray-700 hidden lg:block">
          <InputPanel />
        </div>

        {/* Center - Flow Renderer */}
        <div className="flex-1 min-w-0">
          <FlowRenderer onNodeSelect={setSelectedNodeId} />
        </div>

        {/* Right Panel - Node Editor (conditional) */}
        {selectedNodeId && (
          <div className="border-l border-gray-200 dark:border-gray-700 hidden xl:block">
            <NodeEditorSidebar selectedNodeId={selectedNodeId} />
          </div>
        )}
      </div>

      {/* Mobile Input Panel Overlay */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 max-h-64 overflow-auto">
        <InputPanel />
      </div>

      {/* Mobile Node Editor Overlay */}
      {selectedNodeId && (
        <div className="xl:hidden fixed top-20 right-0 w-80 h-[calc(100vh-5rem)] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <NodeEditorSidebar selectedNodeId={selectedNodeId} />
        </div>
      )}
    </div>
  );
}

