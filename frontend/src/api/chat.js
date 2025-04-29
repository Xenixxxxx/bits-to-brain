import { config } from '../config';

const CHAT_API_URL = `${config.BASE_URL}/api/chat`;

export const sendMessage = async (message, options = {}) => {
  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId: options.sessionId,
        uuid: options.selectedNodeId
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
  
}; 