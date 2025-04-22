import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Handle, Position } from 'reactflow';

export const MarkdownNode = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '50%',  // 改为圆形
        backgroundColor: isHovered ? 'rgb(156, 159, 166)' : 'rgb(82, 82, 89)',
        boxShadow: isHovered 
          ? '0 35px 40px -5px rgba(0, 0, 0, 0.4), 0 20px 20px -5px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1), 0 0 90px 30px rgba(217, 163, 98, 0.4), 0 0 180px 60px rgba(217, 163, 98, 0.3), 0 0 270px 90px rgba(217, 163, 98, 0.2)'
          : '0 35px 40px -5px rgba(0, 0, 0, 0.4), 0 20px 20px -5px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1), 0 0 30px 10px rgba(82, 82, 89, 0.4), 0 0 60px 20px rgba(82, 82, 89, 0.3), 0 0 90px 30px rgba(82, 82, 89, 0.2)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        width: isHovered ? `${data.size * 2}px` : `${data.size}px`,  // 悬停时大小变为3倍
        height: isHovered ? `${data.size * 2}px` : `${data.size}px`,  // 悬停时大小变为3倍
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 2,  // 确保节点在最上层
        transition: 'all 0.3s ease-in-out',  // 添加所有属性的过渡效果
        transform: isHovered ? 'translateY(-15px)' : 'translateY(0)',  // 悬停时位移变为3倍
        outline: 'none',  // 移除白框
        backdropFilter: 'blur(8px)',  // 添加背景模糊
        WebkitBackdropFilter: 'blur(8px)',  // Safari 支持
        filter: 'blur(0.5px)'  // 添加轻微模糊
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
        borderRadius: '50%',
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
          zIndex: 0,  // 确保连接点在最底层
          opacity: 0  // 完全透明
        }}
        isConnectable={false}
        id="target"
      />
      <div style={{
        fontSize: isHovered ? `${data.size * 0.45}px` : `${data.size * 0.15}px`,  // 悬停时字体大小也变为3倍
        fontWeight: '500',
        marginBottom: '5px',
        color: 'rgb(255, 255, 255)',
        fontFamily: 'Inter, sans-serif',
        maxWidth: isHovered ? `${data.size * 2.4}px` : `${data.size * 0.8}px`,  // 悬停时文本宽度也变为3倍
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {data.label}
      </div>
      <div style={{
        fontSize: '12px',
        color: 'rgb(255, 255, 255)',
        fontFamily: 'Inter, sans-serif',
        maxWidth: '100px',  // 限制文本宽度
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {/* <ReactMarkdown>
          {data.content}
        </ReactMarkdown> */}
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
          zIndex: 0,  // 确保连接点在最底层
          opacity: 0  // 完全透明
        }}
        isConnectable={false}
        id="source"
      />
    </div>
  );
}; 