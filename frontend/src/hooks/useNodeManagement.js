import { useCallback } from 'react';
import { fetchGraphData, fetchRecommendation, confirmNode } from '../api';
import { v4 as uuid } from 'uuid';

export const useNodeManagement = ({
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
}) => {
  const handleRecommendation = useCallback(async () => {
    if (!selectedNode || hasPendingRecommendations) return;

    try {
      setIsLoading(true);
      const recommendations = await fetchRecommendation(selectedNode.id);
      if (recommendations && recommendations.length > 0) {
        setHasPendingRecommendations(true);
        
        // Clear old recommendation nodes and edges
        setNodes((nds) => nds.filter((node) => !node.data.isRecommendation));
        setEdges((eds) => eds.filter((edge) => !edge.id.startsWith(`edge-${selectedNode.id}-`)));

        recommendations.forEach((rec) => {
          rec.id = uuid();
        });
        const newNodes = recommendations.map((rec, index) => {
          return {
            id: rec.id,
            type: 'markdown',
            position: {
              x: selectedNode.position.x + (index - 1) * 200,
              y: selectedNode.position.y + 200,
            },
            data: {
              label: rec.title,
              content: rec.summary,
              isRecommendation: true,
              sourceNodeId: selectedNode.id,
              title: rec.title,
              summary: rec.summary,
              size: 80,
              isSelected: false
            },
          };
        });

        const newEdges = recommendations.map((_, index) => ({
          id: `edge-${selectedNode.id}-${index}`,
          source: selectedNode.id,
          target: _.id,
          animated: true,
          style: { stroke: '#888', strokeDasharray: '5,5' },
        }));

        console.log("newNodes in recommendation:", newNodes);

        // 使用 requestAnimationFrame 确保平滑更新
        requestAnimationFrame(() => {
          setNodes((nds) => [...nds, ...newNodes]);
          setEdges((eds) => [...eds, ...newEdges]);
          setRecommendationNodes(newNodes);
        });
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNode, setNodes, setEdges, hasPendingRecommendations, setHasPendingRecommendations, setRecommendationNodes, setIsLoading]);

  const handleConfirmRecommendation = useCallback(async (nodeId) => {
    try {
      setIsLoading(true);
      console.log("nodes before confirm:", nodes);
      const confirmedNode = nodes.find(n => n.id === nodeId);

      console.log("confirmedNode:", confirmedNode);
      if (!confirmedNode) return;

      const nodePositions = new Map();

      nodes.forEach(node => {
        nodePositions.set(node.id, node.position);
      });

      // Call confirmNode API with the correct parameters
      await confirmNode(
        confirmedNode.data.title,
        confirmedNode.data.summary,
        confirmedNode.data.sourceNodeId,
        confirmedNode.id
      );

      // 使用 fetchData 函数更新图，但保持推荐节点的位置
      const data = await fetchGraphData();
      if (data) {
        // 更新节点和边
        const updatedNodes = data.nodes.map(node => {
          return {
            id: node.uuid,
            type: 'markdown',
            position: nodePositions.get(node.uuid) || {
              x: Math.random() * 500,
              y: Math.random() * 300
            },
            data: {
              label: node.title,
              content: node.title,
              isRecommendation: false,
              isSelected: false,
              size: 80
            }
          };
        });

        const updatedEdges = data.edges.map(edge => ({
          id: `edge-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          style: { stroke: '#000' }
        }));

        console.log("updatedNodes:", updatedNodes);

        // 使用 requestAnimationFrame 确保平滑更新
        requestAnimationFrame(() => {
          setNodes(updatedNodes);
          setEdges(updatedEdges);
        });
      }

      // Reset states
      setSelectedNode(null);
      setHasPendingRecommendations(false);
      setRecommendationNodes([]);
    } catch (error) {
      console.error('Error confirming recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, setNodes, setEdges, setSelectedNode, setHasPendingRecommendations, setRecommendationNodes, setIsLoading]);

  return {
    handleRecommendation,
    handleConfirmRecommendation
  };
}; 