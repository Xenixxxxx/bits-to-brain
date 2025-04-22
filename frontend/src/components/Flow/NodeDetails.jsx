import React, { useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useReactFlow } from 'reactflow';

export const NodeDetails = ({ 
  selectedNode, 
  onClose, 
  onRecommend, 
  onConfirm,
  hasRecommendations,
  hasPendingRecommendations
}) => {
  const detailsRef = useRef(null);
  const { getNode, getViewport } = useReactFlow();

  // 更新气泡位置的函数
  const updateBubblePosition = useCallback(() => {
    if (selectedNode && detailsRef.current) {
      const node = getNode(selectedNode.id);
      if (node) {
        const viewport = getViewport();
        const detailsElement = detailsRef.current;
        const nodeElement = document.querySelector(`[data-id="${selectedNode.id}"]`);

        if (nodeElement) {
          const nodeRect = nodeElement.getBoundingClientRect();
          
          // 计算节点在视口中的位置
          const nodeScreenPosition = {
            x: node.position.x * viewport.zoom + viewport.x,
            y: node.position.y * viewport.zoom + viewport.y
          };

          // 计算气泡位置（气泡底部与节点顶部对齐，水平中心对齐）
          const bubblePosition = {
            x: nodeScreenPosition.x + (nodeRect.width * viewport.zoom) / 2, // 使用节点的实际宽度
            y: nodeScreenPosition.y - 10 // 留出 10px 的间距
          };

          // 更新气泡位置
          detailsElement.style.left = `${bubblePosition.x}px`;
          detailsElement.style.top = `${bubblePosition.y}px`;
          detailsElement.style.transform = 'translate(-50%, -100%)'; // 向上偏移整个气泡的高度，水平居中
        }
      }
    }
  }, [selectedNode, getNode, getViewport]);

  useEffect(() => {
    if (selectedNode && detailsRef.current) {
      const detailsElement = detailsRef.current;

      // 初始动画
      detailsElement.style.width = '0px';
      detailsElement.style.height = '0px';
      detailsElement.style.opacity = '0';

      // 触发动画
      requestAnimationFrame(() => {
        detailsElement.style.transition = 'all 0.3s ease-out';
        detailsElement.style.width = '500px';
        detailsElement.style.height = 'auto';
        detailsElement.style.maxHeight = '600px';
        detailsElement.style.opacity = '1';
      });

      // 自动获取推荐
      if (!selectedNode.data.isRecommendation && !hasPendingRecommendations) {
        // 使用 setTimeout 确保在动画开始后再调用推荐
        setTimeout(() => {
          onRecommend();
        }, 100);
      }

      // 添加视口变化监听
      const reactFlowInstance = document.querySelector('.react-flow');
      if (reactFlowInstance) {
        reactFlowInstance.addEventListener('mousemove', updateBubblePosition);
        reactFlowInstance.addEventListener('wheel', updateBubblePosition);
      }

      // 初始定位
      updateBubblePosition();
    }

    // 清理监听器
    return () => {
      const reactFlowInstance = document.querySelector('.react-flow');
      if (reactFlowInstance) {
        reactFlowInstance.removeEventListener('mousemove', updateBubblePosition);
        reactFlowInstance.removeEventListener('wheel', updateBubblePosition);
      }
    };
  }, [selectedNode, hasPendingRecommendations, onRecommend, updateBubblePosition]);

  if (!selectedNode) return null;

  // Get content based on node type
  const content = selectedNode.data.isRecommendation 
    ? selectedNode.data.summary 
    : selectedNode.detail?.text || '';

  return (
    <div
      ref={detailsRef}
      style={{
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '16px',
        width: '500px',
        maxHeight: '600px',
        overflow: 'auto',
        zIndex: 5,
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e5e7eb',
        transform: 'translate(-50%, -100%)',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0
      }}>
        {/* <h3 style={{ 
          margin: 0, 
          fontSize: '1.25rem', 
          fontWeight: '600',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '450px',
          fontFamily: 'Inter, sans-serif',
          color: 'rgb(61,60,61)'
        }}>
          {selectedNode.data.label}
        </h3> */}
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: 'rgb(61,60,61)',
            padding: '0 4px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          ×
        </button>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        marginBottom: '12px',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        color: 'rgb(61,60,61)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: 'auto',
        flexShrink: 0
      }}>
        {hasRecommendations && (
          <button
            onClick={async () => {
              onClose();
              await onConfirm(selectedNode.id);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              width: '100%',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Confirm
          </button>
        )}
      </div>
    </div>
  );
};