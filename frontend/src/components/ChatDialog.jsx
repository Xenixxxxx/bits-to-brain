import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../api/chat';

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
      const response = await sendMessage(input);
      
      // Handle different response formats
      if (response.buttons) {
        // Response with buttons
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.content,
          buttons: response.buttons
        }]);
      } else {
        // Simple text response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.content
        }]);
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
      const response = await sendMessage(button.value || button.label);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.content,
        buttons: response.buttons
      }]);
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
      backgroundColor: '#ffffff'
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
                backgroundColor: message.role === 'user' ? '#3b82f6' : '#f3f4f6',
                color: message.role === 'user' ? 'white' : '#1f2937',
                maxWidth: '85%',
                wordBreak: 'break-word'
              }}
            >
              {message.content}
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
              backgroundColor: isLoading || !input.trim() ? '#d1d5db' : '#3b82f6',
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