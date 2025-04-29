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
            opacity: isPanMode ? 1 : 0.7,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <svg width="20px" height="20px" viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{
            filter: isPanMode ? 'invert(1)' : 'invert(0.2)'
          }}>
            <path d="M19.0006 9.03002C19.0007 8.10058 18.8158 7.18037 18.4565 6.32317C18.0972 5.46598 17.5709 4.68895 16.9081 4.03734C16.2453 3.38574 15.4594 2.87265 14.5962 2.52801C13.7331 2.18336 12.8099 2.01409 11.8806 2.03002C10.0966 2.08307 8.39798 2.80604 7.12302 4.05504C5.84807 5.30405 5.0903 6.98746 5.00059 8.77001C4.95795 9.9595 5.21931 11.1402 5.75999 12.2006C6.30067 13.2609 7.10281 14.1659 8.09058 14.83C8.36897 15.011 8.59791 15.2584 8.75678 15.5499C8.91565 15.8415 8.99945 16.168 9.00059 16.5V18.03H15.0006V16.5C15.0006 16.1689 15.0829 15.843 15.24 15.5515C15.3971 15.26 15.6241 15.0121 15.9006 14.83C16.8528 14.1911 17.6336 13.328 18.1741 12.3167C18.7147 11.3054 18.9985 10.1767 19.0006 9.03002V9.03002Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 21.04C14.1345 21.6891 13.0819 22.04 12 22.04C10.9181 22.04 9.86548 21.6891 9 21.04" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Discover
        </button>
        <button
          className={`mode-button ${!isPanMode ? 'active' : ''}`}
          onClick={() => handleModeChange(false)}
          style={{
            opacity: !isPanMode ? 1 : 0.7,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: !isPanMode ? 'invert(1)' : 'invert(0.2)'
          }}>
            <path d="M15.1289 5.43005L19.3489 6.19C19.7634 6.26246 20.1596 6.41602 20.5147 6.64178C20.8698 6.86755 21.1769 7.16113 21.4184 7.50574C21.6599 7.85035 21.8311 8.23918 21.9221 8.65002C22.0131 9.06087 22.0223 9.48566 21.9489 9.90002L20.2789 19.35C20.2076 19.7642 20.0552 20.1601 19.8305 20.5151C19.6057 20.8702 19.313 21.1773 18.9692 21.4189C18.6254 21.6605 18.2372 21.8318 17.827 21.923C17.4168 22.0141 16.9927 22.0233 16.5789 21.95L8.69891 20.5601C8.28397 20.4871 7.88751 20.333 7.53229 20.1064C7.17706 19.8799 6.87006 19.5855 6.62891 19.2401" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11.2802 2.05006C11.6933 1.97532 12.1173 1.98313 12.5274 2.07307C12.9376 2.16302 13.3258 2.33331 13.6698 2.57411C14.0138 2.8149 14.3067 3.12144 14.5316 3.47603C14.7565 3.83061 14.909 4.22621 14.9802 4.64003L16.6501 14.1C16.7249 14.5132 16.7171 14.9372 16.6271 15.3473C16.5372 15.7575 16.3669 16.1457 16.1261 16.4897C15.8853 16.8337 15.5788 17.1266 15.2242 17.3515C14.8696 17.5764 14.474 17.7289 14.0602 17.8001L6.18015 19.19C5.34473 19.3384 4.4846 19.1489 3.78888 18.6632C3.09316 18.1775 2.61883 17.4354 2.47015 16.6L2.16016 14.82" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.17037 14.82C1.68722 11.9188 2.37523 8.94454 4.08331 6.55023C5.79139 4.15592 8.37988 2.53738 11.2804 2.05005V2.05005" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.09068 14.36C1.58068 10.19 6.09067 12.78 8.18067 9.76001C10.2707 6.74001 7.18069 2.76005 11.2907 2.05005" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
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