import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Handle, Position } from 'reactflow';

export const MarkdownNode = ({ data }) => {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '5px',
      width: '200px',
      fontSize: '12px',
      color: '#333',
      textAlign: 'center',
      border: '2px solid #3b82f6',
      backgroundColor: '#f8fafc',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      ':hover': {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        transform: 'translateY(-2px)'
      }
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: '8px', height: '8px', background: '#3b82f6' }}
      />
      <div style={{
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#1e40af'
      }}>
        {data.label}
      </div>
      <div style={{
        fontSize: '11px',
        color: '#4b5563',
        maxHeight: '60px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {/* <ReactMarkdown>
          {data.content}
        </ReactMarkdown> */}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: '8px', height: '8px', background: '#3b82f6' }}
      />
    </div>
  );
}; 