import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import 'reactflow/dist/style.css';
import { fetchGraphData, fetchNodeDetail, fetchRecommendation, confirmNode } from '../../api';
import { MarkdownNode } from '../MarkdownNode';
import { NodeDetails } from './NodeDetails';
import { UploadBox } from './UploadBox';
import { useNodeManagement } from '../../hooks/useNodeManagement';

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
      .strength(-1000)  // 节点间的排斥力
    )
    .force('center', forceCenter(0, 0))  // 中心力
    .force('collision', forceCollide()
      .radius(100)  // 节点碰撞半径
      .strength(0.7)  // 碰撞强度
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
  const [hasPendingRecommendations, setHasPendingRecommendations] = useState(false);
  const [recommendationNodes, setRecommendationNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
            isRecommendation: false
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
            stroke: 'rgb(0, 0, 0)',
            strokeWidth: 2
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
  }, []);

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

  // 导出刷新函数和节点选中状态管理函数
  window.refreshFlow = debouncedRefresh;
  window.getSelectedNode = () => selectedNode;
  window.setSelectedNode = (node) => {
    if (node) {
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
        `}
      </style>

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
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        onInit={(instance) => {
          reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
        }}
        style={{ backgroundColor: 'rgb(255, 255, 255)' }}
        defaultEdgeOptions={{
          type: 'straight',
          animated: false,
          style: { 
            stroke: 'rgb(0, 0, 0)',
            strokeWidth: 2
          }
        }}
        edgesFocusable={false}
        edgesUpdatable={false}
        nodesFocusable={false}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background color="rgb(248,234,212)" gap={16} size={1} />
        {/* <Controls /> */}
        {/* <MiniMap /> */}
        {selectedNode && (
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

      <UploadBox onUploadSuccess={debouncedRefresh} isLoading={isLoading} setIsLoading={setIsLoading} />
    </div>
  );
};

// 导出包装了 Provider 的 Flow 组件
export const Flow = () => (
  <ReactFlowProvider>
    <FlowInner />
  </ReactFlowProvider>
); 