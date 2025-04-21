import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { fetchGraphData, fetchNodeDetail, fetchRecommendation, confirmNode } from '../../api';
import { MarkdownNode } from '../MarkdownNode';
import { NodeDetails } from './NodeDetails';
import { UploadBox } from './UploadBox';
import { useNodeManagement } from '../../hooks/useNodeManagement';

const nodeTypes = {
  markdown: MarkdownNode,
};

export const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hasPendingRecommendations, setHasPendingRecommendations] = useState(false);
  const [recommendationNodes, setRecommendationNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchGraphData();
      if (data) {
        const initialNodes = data.nodes.map(node => ({
          id: node.uuid,
          type: 'markdown',
          position: { x: Math.random() * 500, y: Math.random() * 300 },
          data: {
            label: node.title,
            content: node.title,
            isRecommendation: false
          }
        }));

        const initialEdges = data.edges.map(edge => ({
          id: `edge-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          style: { stroke: '#000' }
        }));

        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);
  
  const { handleRecommendation, handleConfirmRecommendation } = useNodeManagement({
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedNode,
    setSelectedNode,
    hasPendingRecommendations,
    setHasPendingRecommendations,
    recommendationNodes,
    setRecommendationNodes,
    fetchData,
    setIsLoading
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onNodeClick = useCallback(async (event, node) => {
    // If the node is a recommendation node, it already has detail data
    if (node.data.isRecommendation) {
      setSelectedNode(node);
      return;
    }

    // For regular nodes, fetch details
    try {
      const detail = await fetchNodeDetail(node.id);
      setSelectedNode({
        ...node,
        detail,
      });
    } catch (error) {
      console.error('Error fetching node detail:', error);
    }
  }, []);

  // Add node drag stop handler
  const onNodeDragStop = useCallback((event, node) => {
    // Update node position
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            position: node.position,
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#3498db',
              borderRadius: '50%',
              animation: 'bounce 0.5s ease-in-out infinite alternate',
              animationDelay: '0s'
            }} />
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#3498db',
              borderRadius: '50%',
              animation: 'bounce 0.5s ease-in-out infinite alternate',
              animationDelay: '0.2s'
            }} />
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#3498db',
              borderRadius: '50%',
              animation: 'bounce 0.5s ease-in-out infinite alternate',
              animationDelay: '0.4s'
            }} />
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes bounce {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-20px);
            }
          }
        `}
      </style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <NodeDetails
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
        onRecommend={handleRecommendation}
        onConfirm={handleConfirmRecommendation}
        hasRecommendations={selectedNode?.data?.isRecommendation}
        hasPendingRecommendations={hasPendingRecommendations}
        isLoading={isLoading}
      />

      <UploadBox onUploadSuccess={fetchData} isLoading={isLoading} setIsLoading={setIsLoading} />
    </div>
  );
}; 