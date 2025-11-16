import { parse } from '@mermaid-js/parser';
import type { Node, Edge } from '../state/useFlowStore';
import { applyLayout } from './layout';

interface MermaidNode {
  id: string;
  label?: string;
  type?: string;
}

interface MermaidEdge {
  start: string;
  end: string;
  label?: string;
}

function parseMermaidText(mermaidCode: string): { nodes: MermaidNode[]; edges: MermaidEdge[] } {
  const mermaidNodes: MermaidNode[] = [];
  const mermaidEdges: MermaidEdge[] = [];
  const nodeSet = new Set<string>();
  const nodeMap = new Map<string, MermaidNode>();

  // Remove flowchart declaration and comments
  const lines = mermaidCode
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('%%'));

  lines.forEach((line) => {
    // Extract node IDs and labels from edges and node definitions
    // Pattern: A --> B or A[Label1] --> B[Label2]
    const edgeMatch = line.match(/(\w+)(?:\[([^\]]+)\])?\s*-->\s*(\w+)(?:\[([^\]]+)\])?/);
    if (edgeMatch) {
      const [, sourceId, sourceLabel, targetId, targetLabel] = edgeMatch;

      // Add source node if not exists
      if (!nodeSet.has(sourceId)) {
        const node: MermaidNode = {
          id: sourceId,
          label: sourceLabel || sourceId,
        };
        mermaidNodes.push(node);
        nodeSet.add(sourceId);
        nodeMap.set(sourceId, node);
      } else if (sourceLabel && nodeMap.has(sourceId)) {
        // Update label if provided and node exists
        nodeMap.get(sourceId)!.label = sourceLabel;
      }

      // Add target node if not exists
      if (!nodeSet.has(targetId)) {
        const node: MermaidNode = {
          id: targetId,
          label: targetLabel || targetId,
        };
        mermaidNodes.push(node);
        nodeSet.add(targetId);
        nodeMap.set(targetId, node);
      } else if (targetLabel && nodeMap.has(targetId)) {
        // Update label if provided and node exists
        nodeMap.get(targetId)!.label = targetLabel;
      }

      // Add edge
      mermaidEdges.push({
        start: sourceId,
        end: targetId,
        label: undefined,
      });
    } else {
      // Try to match standalone node definitions: A[Label]
      const nodeMatch = line.match(/^(\w+)(?:\[([^\]]+)\])/);
      if (nodeMatch) {
        const [, nodeId, label] = nodeMatch;
        if (!nodeSet.has(nodeId)) {
          const node: MermaidNode = {
            id: nodeId,
            label: label || nodeId,
          };
          mermaidNodes.push(node);
          nodeSet.add(nodeId);
          nodeMap.set(nodeId, node);
        } else if (label && nodeMap.has(nodeId)) {
          nodeMap.get(nodeId)!.label = label;
        }
      }
    }
  });

  return { nodes: mermaidNodes, edges: mermaidEdges };
}

export async function mermaidToReactFlow(mermaidCode: string): Promise<{ nodes: Node[]; edges: Edge[] }> {
  try {
    let mermaidNodes: MermaidNode[] = [];
    let mermaidEdges: MermaidEdge[] = [];

    // Try to parse with @mermaid-js/parser first
    try {
      const diagram = await parse('flowchart', mermaidCode);
      
      // Attempt to extract from AST
      const traverse = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return;
        
        // Look for node/edge definitions in various AST structures
        if (obj.id && typeof obj.id === 'string') {
          const existingNode = mermaidNodes.find(n => n.id === obj.id);
          if (!existingNode) {
            mermaidNodes.push({
              id: obj.id,
              label: obj.label || obj.text || obj.id,
              type: obj.type,
            });
          }
        }
        
        if (obj.start && obj.end) {
          mermaidEdges.push({
            start: obj.start,
            end: obj.end,
            label: obj.label || obj.text,
          });
        }
        
        if (obj.stmt) {
          traverse(obj.stmt);
        }
        
        if (obj.children) {
          if (Array.isArray(obj.children)) {
            obj.children.forEach(traverse);
          } else {
            traverse(obj.children);
          }
        }
        
        if (Array.isArray(obj)) {
          obj.forEach(traverse);
        } else if (typeof obj === 'object') {
          Object.values(obj).forEach(traverse);
        }
      };
      
      traverse(diagram);
    } catch (parseError) {
      console.warn('Parser AST extraction failed, using text parsing:', parseError);
    }

    // Fallback to text parsing if parser didn't yield results or as supplement
    if (mermaidNodes.length === 0 || mermaidEdges.length === 0) {
      const textParseResult = parseMermaidText(mermaidCode);
      if (textParseResult.nodes.length > 0) {
        mermaidNodes = textParseResult.nodes;
      }
      if (textParseResult.edges.length > 0) {
        mermaidEdges = textParseResult.edges;
      }
    }

    // Ensure we have at least one node
    if (mermaidNodes.length === 0) {
      throw new Error('No nodes found in Mermaid code');
    }

    // Convert to React Flow format
    const rfNodes: Node[] = mermaidNodes.map((node) => ({
      id: node.id,
      data: { 
        label: node.label || node.id,
      },
      position: { x: 0, y: 0 }, // Will be set by layout
      type: 'default',
    }));

    // Remove duplicate edges
    const edgeSet = new Set<string>();
    const rfEdges: Edge[] = [];
    
    mermaidEdges.forEach((edge, index) => {
      const edgeKey = `${edge.start}-${edge.end}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        rfEdges.push({
          id: `${edge.start}-${edge.end}-${index}`,
          source: edge.start,
          target: edge.end,
          label: edge.label,
          type: 'smoothstep',
        });
      }
    });

    // Apply layout
    const laidOutNodes = applyLayout(rfNodes, rfEdges);

    return {
      nodes: laidOutNodes,
      edges: rfEdges,
    };
  } catch (error) {
    console.error('Error parsing Mermaid code:', error);
    throw new Error(`Failed to parse Mermaid code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
