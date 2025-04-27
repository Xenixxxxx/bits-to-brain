import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useReactFlow } from 'reactflow';

export const NodeDetails = ({ 
  selectedNode, 
  onClose, 
  onRecommend, 
  onConfirm,
  hasRecommendations,
  hasPendingRecommendations,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState('content');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [canRecommend, setCanRecommend] = useState(false);
  const detailsRef = useRef(null);
  const { getNode, getViewport } = useReactFlow();

  const convertToEmbedUrl = (url) => {
    return url.replace('watch?v=', 'embed/');
  }

  const handlePrevVideo = () => {
    setCurrentVideoIndex(prev => 
      prev === 0 ? selectedNode.detail.extra.youtube_urls.length - 1 : prev - 1
    );
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex(prev => 
      prev === selectedNode.detail.extra.youtube_urls.length - 1 ? 0 : prev + 1
    );
  };

  const handleCancelRecommend = () => {
    setCanRecommend(false);
    if (window.clearRecommendations) {
      window.clearRecommendations();
    }
  };

  const updateBubblePosition = useCallback(() => {
    if (selectedNode && detailsRef.current) {
      const node = getNode(selectedNode.id);
      if (node) {
        const viewport = getViewport();
        const detailsElement = detailsRef.current;
        const nodeElement = document.querySelector(`[data-id="${selectedNode.id}"]`);

        if (nodeElement) {
          const nodeRect = nodeElement.getBoundingClientRect();
          
          const nodeScreenPosition = {
            x: node.position.x * viewport.zoom + viewport.x,
            y: node.position.y * viewport.zoom + viewport.y
          };

          const bubblePosition = {
            x: nodeScreenPosition.x + (nodeRect.width * viewport.zoom) / 2,
            y: nodeScreenPosition.y - 10
          };

          detailsElement.style.left = `${bubblePosition.x}px`;
          detailsElement.style.top = `${bubblePosition.y}px`;
          detailsElement.style.transform = 'translate(-50%, -100%)';
        }
      }
    }
  }, [selectedNode, getNode, getViewport]);

  useEffect(() => {
    if (selectedNode && detailsRef.current) {
      const detailsElement = detailsRef.current;

      detailsElement.style.width = '0px';
      detailsElement.style.height = '0px';
      detailsElement.style.opacity = '0';

      requestAnimationFrame(() => {
        detailsElement.style.transition = 'all 0.3s ease-out';
        detailsElement.style.width = '500px';
        detailsElement.style.height = 'auto';
        detailsElement.style.maxHeight = '600px';
        detailsElement.style.opacity = '1';
      });

      if (!selectedNode.data.isRecommendation && !hasPendingRecommendations && canRecommend) {
        setTimeout(() => {
          onRecommend();
        }, 100);
      }

      const reactFlowInstance = document.querySelector('.react-flow');
      if (reactFlowInstance) {
        reactFlowInstance.addEventListener('mousemove', updateBubblePosition);
        reactFlowInstance.addEventListener('wheel', updateBubblePosition);
      }

      updateBubblePosition();
    }

    return () => {
      const reactFlowInstance = document.querySelector('.react-flow');
      if (reactFlowInstance) {
        reactFlowInstance.removeEventListener('mousemove', updateBubblePosition);
        reactFlowInstance.removeEventListener('wheel', updateBubblePosition);
      }
    };
  }, [selectedNode, hasPendingRecommendations, onRecommend, updateBubblePosition, canRecommend]);

  if (!selectedNode) return null;

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
        maxHeight: '450px',
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
        flexShrink: 0,
        height: '30px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('content')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: activeTab === 'content' ? '#272343' : '#6b7280',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: activeTab === 'content' ? '#e3f6f5' : 'transparent',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'content') e.target.style.backgroundColor = 'rgba(108, 99, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'content') e.target.style.backgroundColor = 'transparent'
            }}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('video')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: activeTab === 'video' ? '#272343' : '#6b7280',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: activeTab === 'video' ? '#e3f6f5' : 'transparent',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'video') e.target.style.backgroundColor = 'rgba(108, 99, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'video') e.target.style.backgroundColor = 'transparent'
            }}
          >
            Video
          </button>
          <button
            onClick={() => setActiveTab('other')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: activeTab === 'other' ? '#272343' : '#6b7280',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: activeTab === 'other' ? '#e3f6f5' : 'transparent',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'other') e.target.style.backgroundColor = 'rgba(108, 99, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'other') e.target.style.backgroundColor = 'transparent'
            }}
          >
            Other
          </button>
          <button
            onClick={() => {
              if (canRecommend) {
                handleCancelRecommend();
              } else {
                setCanRecommend(true);
              }
            }}
            style={{
              background: 'none',
              border: '1px solid #6C63FF',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'Inter, sans-serif',
              transition: 'background-color 0.3s ease',
              marginLeft: '50%',
              marginRight: '10%',
              color: canRecommend ? '#6C63FF' : '#6C63FF'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 99, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {canRecommend ? 'Cancel' : 'Recommend'}
          </button>
        </div>
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

      {activeTab === 'content' ? (
        <div style={{
          flex: 1,
          overflow: 'auto',
          marginBottom: '12px',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          color: 'rgb(61,60,61)',
          fontFamily: 'Inter, sans-serif',
          maxHeight: '250px'
        }}>
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </div>
      ) : activeTab === 'video' ? (
        <div style={{
          flex: 1,
          overflow: 'hidden',
          marginBottom: '12px',
          maxHeight: '250px',
          position: 'relative'
        }}>
          {selectedNode.detail.extra.youtube_urls ? (
            <>
              <button
                onClick={handlePrevVideo}
                style={{
                  position: 'absolute',
                  left: '0px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  zIndex: 1,
                  visibility: currentVideoIndex === 0 ? 'hidden' : 'visible'
                }}
              >
                <img 
                  src="https://api.iconify.design/fluent:chevron-left-24-regular.svg" 
                  alt="Previous" 
                  style={{
                    width: '20px',
                    height: '20px',
                    filter: 'invert(0.2)'
                  }}
                />
              </button>
              <iframe 
                width="100%" 
                height="250" 
                src={convertToEmbedUrl(selectedNode.detail.extra.youtube_urls[currentVideoIndex])} 
                frameBorder="0" 
                allowFullScreen
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  backgroundColor: 'white'
                }}
              />
              <button
                onClick={handleNextVideo}
                style={{
                  position: 'absolute',
                  right: '0px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  zIndex: 1,
                  visibility: currentVideoIndex === selectedNode.detail.extra.youtube_urls.length - 1 ? 'hidden' : 'visible'
                }}
              >
                <img 
                  src="https://api.iconify.design/fluent:chevron-right-24-regular.svg" 
                  alt="Next" 
                  style={{
                    width: '20px',
                    height: '20px',
                    filter: 'invert(0.2)'
                  }}
                />
              </button>
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem'
              }}>
                {currentVideoIndex + 1} / {selectedNode.detail.extra.youtube_urls.length}
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              No video available
            </div>
          )}
        </div>
      ) : (
        <div style={{
          flex: 1,
          overflow: 'hidden',
          marginBottom: '12px',
          maxHeight: '250px'
        }}>
          Other Content
        </div>
      )}

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