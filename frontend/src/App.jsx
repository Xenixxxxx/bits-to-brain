import React from 'react';
import { Flow } from './components/Flow/Flow';
import { ChatDialog } from './components/ChatDialog';

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh',
      overflow: 'hidden'
    }}>
      <div style={{ 
        width: '70%', 
        height: '100%',
        position: 'relative'
      }}>
        <Flow />
      </div>
      <div style={{ 
        width: '30%', 
        height: '100%',
        borderLeft: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <ChatDialog />
      </div>
    </div>
  );
}

export default App;