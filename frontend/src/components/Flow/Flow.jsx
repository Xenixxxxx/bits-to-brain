import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  SelectionMode
} from 'reactflow';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import 'reactflow/dist/style.css';
import { fetchGraphData, fetchNodeDetail, fetchRecommendation, confirmNode, mergeNodes as mergeNodesApi } from '../../api';
import { MarkdownNode } from '../MarkdownNode';
import { NodeDetails } from './NodeDetails';
import { UploadBox } from './UploadBox';
import { useNodeManagement } from '../../hooks/useNodeManagement';
import { VantaBackground } from './VantaBackground';
import { Toast } from '../Toast';

const nodeTypes = {
  markdown: MarkdownNode,
};

// 创建一个全局对象来存储节点位置
const nodePositions = new Map();

// 防抖函数
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

// 计算力导向布局
const getForceLayoutedElements = (nodes, edges) => {
  // 创建节点和边的副本，避免修改原始数据
  const nodesCopy = nodes.map(node => ({ ...node }));
  const edgesCopy = edges.map(edge => ({ ...edge }));

  // 创建力导向模拟
  const simulation = forceSimulation(nodesCopy)
    .force('link', forceLink(edgesCopy)
      .id(d => d.id)
      .distance(200)  // 边的长度
      .strength(0.5)  // 边的强度
    )
    .force('charge', forceManyBody()
      .strength(-500)  // 节点间的排斥力
    )
    .force('center', forceCenter(0, 0))  // 中心力
    .force('collision', forceCollide()
      .radius(100)  // 节点碰撞半径
      .strength(1)  // 碰撞强度
    );

  // 运行模拟
  simulation.tick(300);  // 运行300次迭代

  // 获取计算后的节点位置
  const layoutedNodes = nodesCopy.map(node => ({
    ...node,
    position: {
      x: node.x,
      y: node.y
    }
  }));

  // 保持原始边的 source 和 target
  const layoutedEdges = edges.map(edge => ({
    ...edge,
    source: edge.source,
    target: edge.target
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

// 内部 Flow 组件
const FlowInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isPanMode, setIsPanMode] = useState(true);  // 新增：控制拖拽模式
  const [hasPendingRecommendations, setHasPendingRecommendations] = useState(false);
  const [recommendationNodes, setRecommendationNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const previousDataRef = useRef(null);
  const reactFlowInstance = useReactFlow();

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await fetchGraphData();
      
      // 检查数据是否真的发生了变化
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
            size: Math.random() * 40 + 80  // 随机生成 80-120 之间的大小
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

        // 应用力导向布局
        const { nodes: layoutedNodes, edges: layoutedEdges } = getForceLayoutedElements(
          initialNodes,
          initialEdges
        );

        // 使用 requestAnimationFrame 来确保平滑更新
        requestAnimationFrame(() => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          console.log('Setting edges:', layoutedEdges);
        });
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [setNodes, setEdges]);

  // 使用防抖的刷新函数
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

  // 添加边的状态变化监听
  useEffect(() => {
    console.log('Edges updated:', edges);
  }, [edges]);

  const onNodeClick = useCallback(async (event, node) => {
    if (!isPanMode) {
      // 检查节点是否已经被选中
      const isCurrentlySelected = selectedNodes.includes(node.id);
      
      if (isCurrentlySelected) {
        // 如果节点已经被选中，则取消选中
        setSelectedNodes(prev => prev.filter(id => id !== node.id));
        setNodes(nds =>
          nds.map(n => ({
            ...n,
            data: {
              ...n.data,
              isSelected: n.id === node.id ? false : n.data.isSelected
            }
          }))
        );
      } else {
        // 如果节点未被选中，且当前选中的节点数量小于 3，则选中该节点
        if (selectedNodes.length < 3) {
          setSelectedNodes(prev => [...prev, node.id]);
          setNodes(nds =>
            nds.map(n => ({
              ...n,
              data: {
                ...n.data,
                isSelected: n.id === node.id ? true : n.data.isSelected
              }
            }))
          );
        } else {
          // 显示错误提示
          setToastMessage('Maximun 3 nodes can be selected for demo');
        }
      }
      return;
    }

    if (node.data.isRecommendation) {
      setSelectedNode(node);
      return;
    }

    try {
      const detail = await fetchNodeDetail(node.id);
      setSelectedNode({
        ...node,
        detail,
      });
    } catch (error) {
      console.error('Error fetching node detail:', error);
    }
  }, [isPanMode, selectedNodes]);

  const onNodeDrag = useCallback((event, node) => {
    // 实时更新节点位置，但不触发边的重渲染
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
    
    // 更新节点位置
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

    // 更新边的位置
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === node.id || edge.target === node.id) {
          return {
            ...edge,
            // 使用时间戳确保边重新计算位置
            id: `${edge.id}-${Date.now()}`,
          };
        }
        return edge;
      })
    );
  }, [setNodes, setEdges]);

  // 修改：在切换模式时清除选中状态
  const handleModeChange = useCallback((isPan) => {
    setIsPanMode(isPan);
    setSelectedNode(null);
    setSelectedNodes([]);
    // 清除所有节点的选中状态
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
      const selectedNodes = nodes.filter(node => node.data.isSelected);
      console.log('selectedNodes:', selectedNodes);
      
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
      
      // 刷新图表数据
      await fetchData();
      
      // 清除选中状态
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
    }
  }, [nodes, fetchData]);

  // 导出刷新函数和节点选中状态管理函数
  window.refreshFlow = debouncedRefresh;
  window.getSelectedNode = () => selectedNode;
  window.setSelectedNode = (node) => {
    if (isPanMode && node) {
      setSelectedNode(node);
    }
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
            src="https://api.iconify.design/fluent:hand-24-filled.svg" 
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
            src="https://api.iconify.design/fluent:select-all-24-filled.svg" 
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
        nodesDraggable={!isPanMode}
        nodesConnectable={!isPanMode}
        elementsSelectable={!isPanMode}
        selectionMode={SelectionMode.Full}
        panOnDrag={isPanMode}
        panOnScroll={isPanMode}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        selectionOnDrag={!isPanMode}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        nodesFocusable={!isPanMode}
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
        {/* <VantaBackground /> */}
        {/* <Controls /> */}
        {/* <MiniMap /> */}
        {selectedNode && isPanMode && (
          <NodeDetails
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onRecommend={handleRecommendation}
            onConfirm={handleConfirmRecommendation}
            hasRecommendations={selectedNode?.data?.isRecommendation}
            hasPendingRecommendations={hasPendingRecommendations}
            isLoading={isLoading}
          />
        )}
      </ReactFlow>

      <div className={`loading-overlay ${isLoading ? 'visible' : ''}`} style={{ pointerEvents: 'none' }}>
        <div className="loading-spinner" />
      </div>

      <UploadBox 
        onUploadSuccess={debouncedRefresh} 
        isLoading={isLoading} 
        setIsLoading={setIsLoading}
        selectedNodes={selectedNodes}
        mergeNodes={mergeNodes}
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

// 导出包装了 Provider 的 Flow 组件
export const Flow = () => (
  <ReactFlowProvider>
    <FlowInner />
  </ReactFlowProvider>
); 