import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
  Background
} from 'reactflow';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import 'reactflow/dist/style.css';
import { fetchGraphData, fetchNodeDetail, fetchRecommendation, confirmNode, mergeNodes as mergeNodesApi } from '../../api';
import { MarkdownNode } from '../MarkdownNode';
import { NodeDetails } from './NodeDetails';
import { UploadBox } from './UploadBox';
import { useNodeManagement } from '../../hooks/useNodeManagement';
import { Toast } from '../Toast';

const nodeTypes = {
  markdown: MarkdownNode,
};

const nodePositions = new Map();

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const getForceLayoutedElements = (nodes, edges) => {
  const nodesCopy = nodes.map(node => ({ ...node }));
  const edgesCopy = edges.map(edge => ({ ...edge }));

  const simulation = forceSimulation(nodesCopy)
    .force('link', forceLink(edgesCopy)
      .id(d => d.id)
      .distance(200)
      .strength(0.5)
    )
    .force('charge', forceManyBody()
      .strength(-500)
    )
    .force('center', forceCenter(0, 0)) 
    .force('collision', forceCollide()
      .radius(100)  
      .strength(1)  
    );


  simulation.tick(300);  

  const layoutedNodes = nodesCopy.map(node => ({
    ...node,
    position: {
      x: node.x,
      y: node.y
    }
  }));

  const layoutedEdges = edges.map(edge => ({
    ...edge,
    source: edge.source,
    target: edge.target
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

const FlowInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isPanMode, setIsPanMode] = useState(true);  
  const [hasPendingRecommendations, setHasPendingRecommendations] = useState(false);
  const [recommendationNodes, setRecommendationNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const previousDataRef = useRef(null);
  const reactFlowInstance = useReactFlow();

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await fetchGraphData();
      
      const dataString = JSON.stringify(data);
      if (dataString === JSON.stringify(previousDataRef.current)) {
        setIsRefreshing(false);
        return;
      }
      
      previousDataRef.current = data;

      if (data) {
        const initialNodes = data.nodes.map(node => ({
          id: node.uuid,
          type: 'markdown',
          data: {
            label: node.title,
            content: node.title,
            isRecommendation: false,
            size: 80,
            isSelected: false
          }
        }));

        const initialEdges = data.edges.map(edge => ({
          id: `edge-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'straight',
          animated: false,
          style: { 
            stroke: 'rgb(132, 132, 140)',
            strokeWidth: 2,
            zIndex: 1
          }
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getForceLayoutedElements(
          initialNodes,
          initialEdges
        );

        requestAnimationFrame(() => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
        });
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [setNodes, setEdges]);

  const debouncedRefresh = useCallback(
    debounce(() => {
      fetchData();
    }, 300),
    [fetchData]
  );
  
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
    fetchData: debouncedRefresh,
    setIsLoading
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log('Edges updated:', edges);
  }, [edges]);

  const convertToVideoUrl = (videoId) => {
    const baseurl = "https://www.videoindexer.ai/embed/player/914a5e40-8e73-4e7a-8d13-ff0193a05e75/videoId/?&locale=en&location=trial";
    return baseurl.replace('videoId', videoId);
  }

  const onNodeClick = useCallback(async (event, node) => {
    if (!isPanMode) {
      event.preventDefault();
      event.stopPropagation();
      
      // 如果节点已经被选中，则取消选中
      if (selectedNodes.includes(node.id)) {
        const newSelectedNodes = selectedNodes.filter(id => id !== node.id);
        setSelectedNodes(newSelectedNodes);
        setNodes(nds =>
          nds.map(n => ({
            ...n,
            data: {
              ...n.data,
              isSelected: newSelectedNodes.includes(n.id)
            }
          }))
        );
      } else {
        // 如果节点未被选中，且选中数量小于3，则选中该节点
        if (selectedNodes.length < 3) {
          const newSelectedNodes = [...selectedNodes, node.id];
          setSelectedNodes(newSelectedNodes);
          setNodes(nds =>
            nds.map(n => ({
              ...n,
              data: {
                ...n.data,
                isSelected: newSelectedNodes.includes(n.id)
              }
            }))
          );
        } else {
          setToastMessage('Maximum 3 nodes can be selected for demo');
        }
      }
      return;
    }

    if (node.data.isRecommendation) {
      setSelectedNode(node);
      return;
    }

    try {
      let detail = await fetchNodeDetail(node.id);
      const extra_formed = {
        ...detail.extra,
        video_urls: [
          ...(detail.extra.video_ids ? detail.extra.video_ids.map(item => convertToVideoUrl(item)) : []),
          ...(detail.extra.youtube_urls || [])
        ],
      }
      detail = {
        ...detail,
        extra: extra_formed
      }
      setSelectedNode({
        ...node,
        detail,
      });
    } catch (error) {
      console.error('Error fetching node detail:', error);
    }
  }, [isPanMode, selectedNodes, setNodes]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    if (!isPanMode) {
      const selectedIds = selectedNodes.map(node => node.id);
      setSelectedNodes(selectedIds);
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          data: {
            ...n.data,
            isSelected: selectedIds.includes(n.id)
          }
        }))
      );
    }
  }, [isPanMode, setNodes]);

  const onNodeDrag = useCallback((event, node) => {
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

  const onNodeDragStop = useCallback((event, node) => {
    const newPosition = node.position;
    nodePositions.set(node.id, newPosition);
    
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            position: newPosition,
          };
        }
        return n;
      })
    );

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === node.id || edge.target === node.id) {
          return {
            ...edge,
            id: `${edge.id}-${Date.now()}`,
          };
        }
        return edge;
      })
    );
  }, [setNodes, setEdges]);

  const handleModeChange = useCallback((isPan) => {
    setIsPanMode(isPan);
    setSelectedNode(null);
    setSelectedNodes([]);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSelected: false
        }
      }))
    );
  }, [setNodes]);

  const mergeNodes = useCallback(async () => {
    try {
      setIsMerging(true);
      const selectedNodes = nodes.filter(node => node.data.isSelected);
      
      if (selectedNodes.length < 2) {
        setToastMessage('Please select at least 2 nodes to merge');
        return;
      }

      if (selectedNodes.length > 3) {
        setToastMessage('Too many nodes to merge. Max allowed: 3');
        return;
      }

      const nodeIds = selectedNodes.map(node => node.id);
      const result = await mergeNodesApi(nodeIds);
      
      await fetchData();
      
      setSelectedNodes([]);
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          data: {
            ...n.data,
            isSelected: false
          }
        }))
      );

      setToastMessage('Nodes merged successfully');
    } catch (error) {
      console.error('Error merging nodes:', error);
      setToastMessage(error.message || 'Failed to merge nodes');
    } finally {
      setIsMerging(false);
    }
  }, [nodes, fetchData]);

  window.refreshFlow = debouncedRefresh;
  window.getSelectedNode = () => selectedNode;
  window.setSelectedNode = (node) => {
    if (isPanMode && node) {
      setSelectedNode(node);
    }
  };
  window.clearRecommendations = () => {
    setNodes(nds => nds.filter(n => !n.data.isRecommendation));
    setRecommendationNodes([]);
    setHasPendingRecommendations(false);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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

          @keyframes pulse {
            0% {
              transform: scale(0.95);
              opacity: 0.5;
            }
            50% {
              transform: scale(1);
              opacity: 0.8;
            }
            100% {
              transform: scale(0.95);
              opacity: 0.5;
            }
          }

          .react-flow__node {
            transition: none;
          }

          .react-flow__edge {
            transition: none;
          }

          .react-flow__node.selected {
            box-shadow: 0 0 0 2px rgb(248,234,212);
          }

          .react-flow__node:hover {
            box-shadow: 0 0 0 2px rgb(248,234,212);
          }

          .react-flow__edge-path {
            transition: none;
          }

          .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(61, 60, 61, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
          }

          .loading-overlay.visible {
            opacity: 1;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgb(248,234,212);
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          .node-details-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 70%;
            height: 100%;
            background-color: rgba(61, 60, 61, 0.9);
            z-index: 1000;
            transition: opacity 0.3s ease-in-out;
          }

          .mode-switch {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 8px;
          }
          .mode-button {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Inter, sans-serif';
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .mode-button.active {
            background-color: #272343;
            color: #fffffe;
          }
          .mode-button:not(.active) {
            background-color: #fffffe;
            color: #272343;
            border: 1px solid #272343;
          }
          @keyframes slideIn {
            from {
              transform: translate(-50%, -100%);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
        `}
      </style>

      <div className="mode-switch">
        <button
          className={`mode-button ${isPanMode ? 'active' : ''}`}
          onClick={() => handleModeChange(true)}
          style={{
            opacity: isPanMode ? 1 : 0.7
          }}
        >
          <img 
            src="https://api.iconify.design/fluent:hand-wave-24-regular.svg" 
            alt="Pan" 
            style={{
              width: '20px',
              height: '20px',
              filter: isPanMode ? 'invert(1)' : 'invert(0.2)'
            }}
          />
          Discover
        </button>
        <button
          className={`mode-button ${!isPanMode ? 'active' : ''}`}
          onClick={() => handleModeChange(false)}
          style={{
            opacity: !isPanMode ? 1 : 0.7
          }}
        >
          <img 
            src="https://api.iconify.design/fluent:select-all-24-regular.svg" 
            alt="Select" 
            style={{
              width: '20px',
              height: '20px',
              filter: !isPanMode ? 'invert(1)' : 'invert(0.2)'
            }}
          />
          Merge
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={isPanMode}
        nodesConnectable={false}
        elementsSelectable={false}
        selectionMode={SelectionMode.Full}
        panOnDrag={isPanMode}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        selectionOnDrag={false}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        nodesFocusable={false}
        edgesFocusable={false}
        edgesUpdatable={false}
        onInit={(instance) => {
          reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
        }}
        style={{ backgroundColor: '#fffffe' }}
        defaultEdgeOptions={{
          type: 'straight',
          animated: false,
          style: { 
            stroke: 'rgb(132, 132, 140)',
            strokeWidth: 2,
            zIndex: 1
          }
        }}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background size={1.5}/>
        {/* <VantaBackground /> */}
        {/* <Controls /> */}
        {/* <MiniMap /> */}
        {selectedNode && isPanMode && (
          <div>
            <div style={{ pointerEvents: 'auto' }}> 
              <NodeDetails
                selectedNode={selectedNode}
                onClose={() => setSelectedNode(null)}
                onRecommend={handleRecommendation}
                onConfirm={handleConfirmRecommendation}
                hasRecommendations={selectedNode?.data?.isRecommendation}
                hasPendingRecommendations={hasPendingRecommendations}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </ReactFlow>

      <div className={`loading-overlay ${isLoading ? 'visible' : ''}`} style={{ pointerEvents: 'none' }}>
        <div className="loading-spinner" />
      </div>

      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
        <UploadBox 
          onUploadSuccess={debouncedRefresh} 
          isLoading={isLoading} 
          setIsLoading={setIsLoading}
          selectedNodes={selectedNodes}
          mergeNodes={mergeNodes}
          isMerging={isMerging}
        />

        {toastMessage && (
          <Toast
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>
    </div>
  );
};

export const Flow = () => (
  <ReactFlowProvider>
    <FlowInner />
  </ReactFlowProvider>
); 