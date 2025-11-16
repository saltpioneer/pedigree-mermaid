import { useState } from 'react';
import { useFlowStore } from '../state/useFlowStore';
import { mermaidToReactFlow } from '../lib/mermaidToReactFlow';
import { validateInput, preprocessInput } from '../lib/parseFamilyPrompt';

export function InputPanel() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setGraph } = useFlowStore();

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
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Input Family Tree Text</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Describe family relationships in natural language
        </p>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Example:&#10;John and Mary have a daughter Sarah. Sarah married Tim. They have two sons, Alex and Ben."
          className="w-full h-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="px-4 pb-2">
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleConvert}
          disabled={loading || !text.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed 
                     text-white font-semibold py-3 px-4 rounded-lg 
                     transition-colors duration-200
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Converting...</span>
            </>
          ) : (
            <span>Convert to Family Tree</span>
          )}
        </button>
      </div>
    </div>
  );
}

