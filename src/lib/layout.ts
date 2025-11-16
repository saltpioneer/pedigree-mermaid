import { Position } from 'reactflow';
import { layoutFromMap } from 'entitree-flex';
import type { Node, Edge } from '../state/useFlowStore';

const nodeWidth = 150;
const nodeHeight = 36;

const Orientation = {
  Vertical: 'vertical' as const,
  Horizontal: 'horizontal' as const,
};

export function applyLayout(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'TB'): Node[] {
  if (nodes.length === 0) {
    return nodes;
  }

  // Build relationship maps from edges
  const childrenMap = new Map<string, string[]>();
  const parentsMap = new Map<string, string[]>();

  // Initialize maps
  nodes.forEach((node) => {
    childrenMap.set(node.id, []);
    parentsMap.set(node.id, []);
  });

  // Build parent-child relationships directly from edges
  // No marriage nodes - edges directly connect parents to children
  edges.forEach((edge) => {
    // Direct parent-child relationship: parent --> child
    const currentChildren = childrenMap.get(edge.source) || [];
    if (!currentChildren.includes(edge.target)) {
      childrenMap.set(edge.source, [...currentChildren, edge.target]);
    }
    const currentParents = parentsMap.get(edge.target) || [];
    if (!currentParents.includes(edge.source)) {
      parentsMap.set(edge.target, [...currentParents, edge.source]);
    }
  });

  // Convert to entitree-flex format (flat map)
  // All nodes are individuals - no marriage nodes to filter
  const flatTree: Record<string, any> = {};
  
  nodes.forEach((node) => {
    const children = childrenMap.get(node.id) || [];
    const parents = parentsMap.get(node.id) || [];
    
    flatTree[node.id] = {
      name: node.data?.label || node.id,
      width: nodeWidth,
      height: nodeHeight,
      children: children.length > 0 ? children : undefined,
      parents: parents.length > 0 ? parents : undefined,
    };
  });

  // Find root node (node with no parents)
  let rootId: string | null = null;
  for (const node of nodes) {
    const parents = parentsMap.get(node.id) || [];
    if (parents.length === 0) {
      rootId = node.id;
      break;
    }
  }
  
  // Fallback to first node if all have parents (in case of circular references)
  if (!rootId) {
    rootId = nodes[0]?.id || null;
  }
  
  if (!rootId) {
    return nodes;
  }

  // Apply entitree-flex layout with settings from layout-element.txt
  const orientationValue: 'vertical' | 'horizontal' = direction === 'TB' ? Orientation.Vertical : Orientation.Horizontal;
  const entitreeSettings = {
    clone: true,
    enableFlex: true,
    firstDegreeSpacing: 100,
    nextAfterAccessor: 'spouses',
    nextAfterSpacing: 100,
    nextBeforeAccessor: 'siblings',
    nextBeforeSpacing: 100,
    nodeHeight,
    nodeWidth,
    orientation: orientationValue,
    rootX: 0,
    rootY: 0,
    secondDegreeSpacing: 100,
    sourcesAccessor: 'parents',
    sourceTargetSpacing: 100,
    targetsAccessor: 'children',
  };

  try {
    const result = layoutFromMap(rootId, flatTree, entitreeSettings);
    
    // Convert entitree-flex output back to React Flow format
    const layoutedNodes = nodes.map((node) => {
      const entitreeNode = result.map[node.id];
      if (entitreeNode && entitreeNode.x !== undefined && entitreeNode.y !== undefined) {
        const newNode: Node = {
          ...node,
          position: {
            x: entitreeNode.x - nodeWidth / 2,
            y: entitreeNode.y - nodeHeight / 2,
          },
        };

        // Set source/target positions based on node type (from layout-element.txt)
        const isSpouse = !!entitreeNode?.isSpouse;
        const isSibling = !!entitreeNode?.isSibling;
        const isTreeHorizontal = direction === 'LR';
        const { Top, Bottom, Left, Right } = Position;

        if (isSpouse) {
          newNode.sourcePosition = isTreeHorizontal ? Bottom : Right;
          newNode.targetPosition = isTreeHorizontal ? Top : Left;
        } else if (isSibling) {
          newNode.sourcePosition = isTreeHorizontal ? Top : Left;
          newNode.targetPosition = isTreeHorizontal ? Bottom : Right;
        } else {
          newNode.sourcePosition = isTreeHorizontal ? Right : Bottom;
          newNode.targetPosition = isTreeHorizontal ? Left : Top;
        }

        return newNode;
      }
      // Fallback to original position if not found
      return node;
    });
    
    return layoutedNodes;
  } catch (error) {
    console.error('Error applying entitree-flex layout:', error);
    // Fallback to simple layout if entitree-flex fails
    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 5) * 200,
        y: Math.floor(index / 5) * 150,
      },
    }));
  }
}

