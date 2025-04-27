import React, { useEffect } from 'react';
import { Flow } from './components/Flow/Flow';
import { ChatDialog } from './components/ChatDialog';
import { Logo } from './components/Logo';
import { v4 as uuidv4 } from 'uuid';

function App() {
  useEffect(() => {
    // 生成新的 sessionId 并存储
    const sessionId = uuidv4();
    sessionStorage.setItem('sessionId', sessionId);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      width: '100vw', 
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'rgb(27, 54, 82)'
    }}>
      <Logo />
      <div style={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: '70%', 
          height: '100%',
          position: 'relative',
          backgroundColor: 'hsl(0, 0.00%, 100.00%)'
        }}>
          <Flow />
        </div>
        <div style={{ 
          width: '30%', 
          height: '100%',
          borderLeft: '1px solid rgb(0, 0, 0)',
          backgroundColor: 'rgb(61,60,61)'
        }}>
          <ChatDialog />
        </div>
      </div>
    </div>
  );
}

export default App;