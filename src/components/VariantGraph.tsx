'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Position,
  ConnectionLineType,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { useGameStore, MoveNode } from '@/store/useGameStore';
import ContextMenu from './ContextMenu';
import styles from './VariantGraph.module.css';

const nodeWidth = 80;
const nodeHeight = 36;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  try {
    if (nodes.length === 0) return { nodes, edges };

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'TB' });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.targetPosition = Position.Top;
      node.sourcePosition = Position.Bottom;

      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };

      return node;
    });

    return { nodes: layoutedNodes, edges };
  } catch (error) {
    console.error('Dagre layout error:', error);
    return { nodes, edges };
  }
};

function VariantGraphInner() {
  const { nodes: gameNodes, activeNodeId, navigateToNode, deleteNode, rootId } = useGameStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const { fitView } = useReactFlow();

  // Convert game store nodes to React Flow elements
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    Object.values(gameNodes).forEach((node) => {
      const isRoot = node.id === rootId;
      const isActive = node.id === activeNodeId;

      flowNodes.push({
        id: node.id,
        data: { label: isRoot ? 'Start' : node.move?.san },
        position: { x: 0, y: 0 },
        style: {
          background: isActive ? '#4f46e5' : '#fff',
          color: isActive ? '#fff' : '#000',
          border: isActive ? '2px solid #312e81' : '1px solid #777',
          width: nodeWidth,
          fontSize: '12px',
          fontWeight: isRoot ? 'bold' : 'normal',
          cursor: 'pointer',
        },
      });

      if (node.parentId) {
        flowEdges.push({
          id: `${node.parentId}-${node.id}`,
          source: node.parentId,
          target: node.id,
          type: ConnectionLineType.SmoothStep,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    });

    return getLayoutedElements(flowNodes, flowEdges);
  }, [gameNodes, activeNodeId, rootId]);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Center on active node whenever it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ 
        nodes: [{ id: activeNodeId }],
        duration: 300,
        padding: 0.3,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [activeNodeId, fitView, nodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    navigateToNode(node.id);
  }, [navigateToNode]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    deleteNode(nodeId);
  }, [deleteNode]);

  return (
    <div className={styles.graphContainer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        fitView
        attributionPosition="bottom-right"
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onDelete={handleDeleteNode}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export default function VariantGraph() {
  return (
    <ReactFlowProvider>
      <VariantGraphInner />
    </ReactFlowProvider>
  );
}
