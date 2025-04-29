import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useReactFlow } from 'reactflow';
import './recommend-button.css';

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isManuallyPositioned, setIsManuallyPositioned] = useState(false);
  const detailsRef = useRef(null);
  const { getNode, getViewport } = useReactFlow();

  const convertToEmbedUrl = (url) => {
    return url.replace('watch?v=', 'embed/');
  }

  const handlePrevVideo = () => {
    setCurrentVideoIndex(prev => 
      prev === 0 ? selectedNode.detail.extra.video_urls.length - 1 : prev - 1
    );
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex(prev => 
      prev === selectedNode.detail.extra.video_urls.length - 1 ? 0 : prev + 1
    );
  };

  const handleCancelRecommend = () => {
    setCanRecommend(false);
    if (window.clearRecommendations) {
      window.clearRecommendations();
    }
  };

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('iframe')) return;
    
    const detailsElement = detailsRef.current;
    if (!detailsElement) return;

    const matrix = new WebKitCSSMatrix(getComputedStyle(detailsElement).transform);
    const currentX = matrix.m41;
    const currentY = matrix.m42;

    const offsetX = e.clientX - currentX;
    const offsetY = e.clientY - currentY;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    setIsManuallyPositioned(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !detailsRef.current) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    setPosition({ x, y });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const updateBubblePosition = useCallback(() => {
    if (selectedNode && detailsRef.current && !isDragging && !isManuallyPositioned) {
      const node = getNode(selectedNode.id);
      if (node) {
        const viewport = getViewport();
        const detailsElement = detailsRef.current;
        const nodeElement = document.querySelector(`[data-id="${selectedNode.id}"]`);

        if (nodeElement) {
          const nodeRect = nodeElement.getBoundingClientRect();
          const detailsRect = detailsElement.getBoundingClientRect();
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          
          const nodeScreenPosition = {
            x: node.position.x * viewport.zoom + viewport.x,
            y: node.position.y * viewport.zoom + viewport.y
          };

          let bubblePosition = {
            x: nodeScreenPosition.x + (nodeRect.width * viewport.zoom) / 2,
            y: nodeScreenPosition.y - 10
          };

          setPosition(bubblePosition);
        }
      }
    }
  }, [selectedNode, getNode, getViewport, isDragging, isManuallyPositioned]);

  useEffect(() => {
    if (selectedNode && detailsRef.current) {
      const detailsElement = detailsRef.current;

      detailsElement.style.width = '0px';
      detailsElement.style.height = '0px';
      detailsElement.style.opacity = '0';

      requestAnimationFrame(() => {
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
        reactFlowInstance.addEventListener('wheel', updateBubblePosition);
      }

      updateBubblePosition();
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      const reactFlowInstance = document.querySelector('.react-flow');
      if (reactFlowInstance) {
        reactFlowInstance.removeEventListener('wheel', updateBubblePosition);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedNode, hasPendingRecommendations, onRecommend, updateBubblePosition, canRecommend, isDragging, handleMouseMove, handleMouseUp]);

  if (!selectedNode) return null;

  const content = selectedNode.data.isRecommendation 
    ? selectedNode.data.summary 
    : selectedNode.detail?.text || '';

  return (
    <div
      ref={detailsRef}
      onMouseDown={handleMouseDown}
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
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e5e7eb',
        transform: `translate(${position.x}px, ${position.y}px)`,
        fontFamily: 'Inter, sans-serif',
        willChange: 'transform',
        transition: isDragging ? 'none' : 'transform 0.3s ease-out'
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
              fontFamily: 'Inter, sans-serif',
              visibility: selectedNode.data?.isRecommendation ? 'hidden' : 'visible',
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
              fontFamily: 'Inter, sans-serif',
              visibility: selectedNode.data?.isRecommendation ? 'hidden' : 'visible',
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
          <button className='recommend-button'
            onClick={() => {
              if (hasPendingRecommendations) {
                handleCancelRecommend();
              } else {
                setCanRecommend(true);
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"></path>
            </svg>
            <div className="recommend-text">
              {hasPendingRecommendations ? 'Cancel' : 'Discover'}
            </div>
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
          maxHeight: '250px',
          cursor: 'default'
        }}>
          <div style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitUserDrag: 'none',
            khtmlUserDrag: 'none',
            MozUserDrag: 'none',
            OUserDrag: 'none',
          }}>
            <ReactMarkdown>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      ) : activeTab === 'video' ? (
        <div style={{
          flex: 1,
          overflow: 'hidden',
          marginBottom: '12px',
          maxHeight: '250px',
          position: 'relative'
        }}>
          {selectedNode.detail.extra.video_urls && selectedNode.detail.extra.video_urls.length > 0 ? (
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
                src={convertToEmbedUrl(selectedNode.detail.extra.video_urls[currentVideoIndex])} 
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
                  visibility: currentVideoIndex === selectedNode.detail.extra.video_urls.length - 1 ? 'hidden' : 'visible'
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
                {currentVideoIndex + 1} / {selectedNode.detail.extra.video_urls.length}
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
          {selectedNode.detail && selectedNode.detail.extra.website_urls ? selectedNode.detail.extra.website_urls.map(url => (
            <a href={url} target="_blank" rel="noopener noreferrer">
              {url}
            </a>
          )) : ''}
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