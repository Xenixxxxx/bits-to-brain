import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Handle, Position } from 'reactflow';

export const MarkdownNode = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        padding: '2px',  // 减小内边距
        borderRadius: '12px',  // 改为圆角矩形
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
        width: isHovered ? `${data.size * 2}px` : `${data.size * 1.5}px`,  // 增加宽度
        height: isHovered ? `${data.size}px` : `${data.size * 0.67}px`,  // 保持高度不变
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 2,  // 确保节点在最上层
        transition: 'all 0.3s ease-in-out',  // 添加所有属性的过渡效果
        transform: isHovered ? 'translateY(-15px)' : 'translateY(0)',  // 悬停时位移变为3倍
        outline: 'none',  // 移除白框
        overflow: 'visible',  // 允许内容溢出
        // backdropFilter: 'blur(4px)',  // 添加背景模糊
        // WebkitBackdropFilter: 'blur(4px)',  // Safari 支持
        // filter: 'blur(0.5px)'  // 添加轻微模糊
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
        borderRadius: '12px',  // 改为圆角矩形
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
        fontSize: isHovered ? `${data.size * 0.15}px` : `${data.size * 0.1}px`,  // 悬停时字体大小也变为3倍
        fontWeight: '500',
        marginBottom: '2px',  // 减小底部间距
        color: '#2d334a',
        fontFamily: 'Inter, sans-serif',
        maxWidth: '100%',  // 使用百分比确保不会超出父容器
        overflow: 'visible',  // 允许内容溢出
        whiteSpace: 'normal',  // 允许文字换行
        padding: '0 2px'  // 添加较小的内边距防止文字贴边
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