import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Handle, Position } from 'reactflow';

export const MarkdownNode = ({ data }) => {
  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '50%',  // 改为圆形
        backgroundColor: 'rgb(248,234,212)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        width: '120px',  // 调整宽度
        height: '120px',  // 添加高度
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'transparent', // 可隐藏视觉
          width: 10,
          height: 10,
          borderRadius: '0%',
          pointerEvents: 'none',
          display: 'none'
        }}
        isConnectable={true}
        id="target"
      />
      <div style={{
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '5px',
        color: 'rgb(61,60,61)',
        fontFamily: 'Inter, sans-serif',
        maxWidth: '100px',  // 限制文本宽度
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {data.label}
      </div>
      <div style={{
        fontSize: '12px',
        color: 'rgb(61,60,61)',
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
          background: 'transparent', // 可隐藏视觉
          width: 10,
          height: 10,
          borderRadius: '0%',
          pointerEvents: 'none',
          display: 'none'
        }}
        isConnectable={true}
        id="source"
      />
    </div>
  );
}; 