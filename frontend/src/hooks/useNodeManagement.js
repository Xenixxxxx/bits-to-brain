import { useState, useCallback } from 'react';
import { fetchGraphData, fetchNodeDetail, fetchRecommendation, confirmNode } from '../api';

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

        const newNodes = recommendations.map((rec, index) => ({
          id: `rec-${selectedNode.id}-${index}`,
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
            summary: rec.summary
          },
        }));

        const newEdges = recommendations.map((_, index) => ({
          id: `edge-${selectedNode.id}-${index}`,
          source: selectedNode.id,
          target: `rec-${selectedNode.id}-${index}`,
          animated: true,
          style: { stroke: '#888', strokeDasharray: '5,5' },
        }));

        setNodes((nds) => [...nds, ...newNodes]);
        setEdges((eds) => [...eds, ...newEdges]);
        setRecommendationNodes(newNodes);
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
      const confirmedNode = nodes.find(n => n.id === nodeId);
      if (!confirmedNode) return;

      // Call confirmNode API with the correct parameters
      await confirmNode(
        confirmedNode.data.title,
        confirmedNode.data.summary,
        confirmedNode.data.sourceNodeId
      );

      // Use the fetchData function to update the graph
      await fetchData();

      // Reset states
      setSelectedNode(null);
      setHasPendingRecommendations(false);
      setRecommendationNodes([]);
    } catch (error) {
      console.error('Error confirming recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, fetchData, setSelectedNode, setHasPendingRecommendations, setRecommendationNodes, setIsLoading]);

  return {
    handleRecommendation,
    handleConfirmRecommendation
  };
}; 