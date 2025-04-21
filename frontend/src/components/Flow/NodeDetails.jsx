import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export const NodeDetails = ({ 
  selectedNode, 
  onClose, 
  onRecommend, 
  onConfirm,
  hasRecommendations,
  hasPendingRecommendations
}) => {
  const detailsRef = useRef(null);

  useEffect(() => {
    if (selectedNode && detailsRef.current) {
      // Get node position
      const nodeElement = document.querySelector(`[data-id="${selectedNode.id}"]`);
      if (nodeElement) {
        const nodeRect = nodeElement.getBoundingClientRect();
        const detailsElement = detailsRef.current;

        // Set initial position and size
        detailsElement.style.left = `${nodeRect.left}px`;
        detailsElement.style.top = `${nodeRect.top}px`;
        detailsElement.style.width = '0px';
        detailsElement.style.height = '0px';
        detailsElement.style.opacity = '0';

        // Trigger animation
        requestAnimationFrame(() => {
          detailsElement.style.transition = 'all 0.3s ease-out';
          detailsElement.style.left = '50%';
          detailsElement.style.top = '50%';
          detailsElement.style.transform = 'translate(-50%, -50%)';
          detailsElement.style.width = '40vw';
          detailsElement.style.height = '50vh';
          detailsElement.style.opacity = '1';
        });
      }
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  // Get content based on node type
  const content = selectedNode.data.isRecommendation 
    ? selectedNode.data.summary 
    : selectedNode.detail?.text || '';

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          opacity: selectedNode ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
        onClick={onClose}
      />
      <div
        ref={detailsRef}
        style={{
          position: 'fixed',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          width: '40vw',
          height: '50vh',
          overflow: 'auto',
          zIndex: 1000,
          pointerEvents: 'auto',
          cursor: 'default',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            {selectedNode.data.label}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          marginBottom: '16px',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          color: '#4b5563'
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
          {!hasRecommendations && !hasPendingRecommendations && (
            <button
              onClick={() => {
                onRecommend();
                onClose();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              获取推荐
            </button>
          )}
          {hasRecommendations && (
            <button
              onClick={async () => {
                onClose();
                await onConfirm(selectedNode.id);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              确认
            </button>
          )}
          {hasPendingRecommendations && !hasRecommendations && (
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              请先确认或取消当前的推荐
            </div>
          )}
        </div>
      </div>
    </>
  );
};