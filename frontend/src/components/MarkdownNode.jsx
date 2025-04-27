import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

export const MarkdownNode = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        padding: '2px', 
        borderRadius: '12px', 
        backgroundColor: data.isSelected 
          ? '#ffd803' 
          : isHovered 
            ? '#ffd803' 
            : '#bae8e8',
        border: data.isSelected
          ? '2px solid #272343'
          : '0.2px solid #000000',
        boxShadow: data.isSelected
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 2px #272343, 0 0 30px 10px rgba(255, 216, 3, 0.2), 0 0 60px 20px rgba(255, 216, 3, 0.1), 0 0 90px 30px rgba(255, 216, 3, 0.05)'
          : isHovered 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.1), 0 0 30px 10px rgba(255, 216, 3, 0.2), 0 0 60px 20px rgba(255, 216, 3, 0.1), 0 0 90px 30px rgba(255, 216, 3, 0.05)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.1), 0 0 10px 5px rgba(230, 230, 230, 0.2), 0 0 20px 10px rgba(180, 180, 180, 0.1), 0 0 30px 15px rgba(143, 143, 143, 0.05)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        width: isHovered ? `${data.size * 2}px` : `${data.size * 1.5}px`,
        height: isHovered ? `${data.size}px` : `${data.size * 0.67}px`, 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 2,  
        transition: 'all 0.3s ease-in-out', 
        transform: isHovered ? 'translateY(-15px)' : 'translateY(0)',  
        outline: 'none', 
        overflow: 'visible', 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '12px', 
        background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none'
      }} />
      <Handle
        type="target"
        position={Position.Top}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'transparent',
          width: 0,
          height: 0,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,  
          opacity: 0  
        }}
        isConnectable={false}
        id="target"
      />
      <div style={{
        fontSize: isHovered ? `${data.size * 0.15}px` : `${data.size * 0.1}px`, 
        fontWeight: '500',
        marginBottom: '2px',  
        color: '#2d334a',
        fontFamily: 'Inter, sans-serif',
        maxWidth: '100%',  
        overflow: 'visible',  
        whiteSpace: 'normal',  
        padding: '0 2px'  
      }}>
        {data.label}
      </div>
      <div style={{
        fontSize: '12px',
        color: 'rgb(255, 255, 255)',
        fontFamily: 'Inter, sans-serif',
        maxWidth: '100px',  
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
      </div>
      <Handle
        type="source"
        position={Position.Top}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'transparent',
          width: 0,
          height: 0,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,  
          opacity: 0  
        }}
        isConnectable={false}
        id="source"
      />
    </div>
  );
}; 