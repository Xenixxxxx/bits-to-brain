import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../api/chat';
import ReactMarkdown from 'react-markdown';

export const ChatDialog = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const sessionId = sessionStorage.getItem('sessionId');
      const selectedNode = window.getSelectedNode?.();
      const response = await sendMessage(input, { 
        sessionId,
        selectedNodeId: selectedNode?.id
      });
      
      // Handle different response formats
      if (response.buttons) {
        // Response with buttons
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.response,
          buttons: response.buttons
        }]);
      } else {
        // Simple text response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.response
        }]);
      }

      // 刷新流程图，但保持节点选中状态
      if (window.refreshFlow) {
        const currentSelectedNode = window.getSelectedNode?.();
        window.refreshFlow();
        if (currentSelectedNode) {
          // 等待刷新完成后重新选中节点
          setTimeout(() => {
            window.setSelectedNode?.(currentSelectedNode);
          }, 100);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = async (button) => {
    if (isLoading) return;
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: button.label
    }]);
    setIsLoading(true);

    try {
      const sessionId = sessionStorage.getItem('sessionId');
      const selectedNode = window.getSelectedNode?.();
      const response = await sendMessage(button.value || button.label, { 
        sessionId,
        selectedNodeId: selectedNode?.id
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.content,
        buttons: response.buttons
      }]);

      // 刷新流程图，但保持节点选中状态
      if (window.refreshFlow) {
        const currentSelectedNode = window.getSelectedNode?.();
        window.refreshFlow();
        if (currentSelectedNode) {
          // 等待刷新完成后重新选中节点
          setTimeout(() => {
            window.setSelectedNode?.(currentSelectedNode);
          }, 100);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your selection.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#2d334a'
    }}>
      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxWidth: '100%',
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: message.role === 'user' ? '#e3f6f5' : '#bae8e8',
                color: message.role === 'user' ? '#2d334a' : '#272343',
                fontFamily: 'Inter, sans-serif',
                maxWidth: '85%',
                wordBreak: 'break-word'
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
                  h1: ({ children }) => <h1 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: '1.125rem', margin: '0.5rem 0' }}>{children}</h3>,
                  ul: ({ children }) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ margin: '0.25rem 0' }}>{children}</li>,
                  code: ({ children }) => (
                    <code style={{
                      backgroundColor: message.role === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '0.25rem',
                      fontFamily: 'monospace'
                    }}>
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre style={{
                      backgroundColor: message.role === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      overflowX: 'auto',
                      margin: '0.5rem 0'
                    }}>
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote style={{
                      borderLeft: '4px solid',
                      borderColor: message.role === 'user' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.2)',
                      margin: '0.5rem 0',
                      paddingLeft: '1rem',
                      fontStyle: 'italic'
                    }}>
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: message.role === 'user' ? 'white' : '#3b82f6',
                        textDecoration: 'underline'
                      }}
                    >
                      {children}
                    </a>
                  ),
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt}
                      style={{
                        maxWidth: '100%',
                        borderRadius: '0.5rem',
                        margin: '0.5rem 0'
                      }}
                    />
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.buttons && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '0.25rem'
              }}>
                {message.buttons.map((button, btnIndex) => (
                  <button
                    key={btnIndex}
                    onClick={() => handleButtonClick(button)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#1f2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'background-color 0.2s',
                      ':hover': {
                        backgroundColor: '#e5e7eb'
                      }
                    }}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          maxWidth: '48rem',
          margin: '0 auto'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              outline: 'none',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff',
              ':focus': {
                borderColor: '#3b82f6',
                boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: isLoading || !input.trim() ? '#d1d5db' : '#272343',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              ':hover': {
                backgroundColor: isLoading || !input.trim() ? '#d1d5db' : '#2563eb'
              }
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Sending...
              </span>
            ) : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}; 