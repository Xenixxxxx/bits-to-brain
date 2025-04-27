// API 基础配置
const API_CONFIG = {
  // 切换这两个地址来控制 API 访问
  BASE_URL: 'http://20.92.230.227:8080',
  // BASE_URL: 'http://192.168.50.113:8080',
};

export const fetchGraphData = async () => {
  // return mockGraphData;

  const apiUrl = `${API_CONFIG.BASE_URL}/api/graph`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('error getting graph data:', error);
    throw error;
  }
};

export const fetchNodeDetail = async (nodeId) => {

  const apiUrl = `${API_CONFIG.BASE_URL}/api/node/${nodeId}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('From detail API :', data);
    return data;
  } catch (error) {
    console.error('error detail data:', error);
    throw error;
  }
};

export const fetchRecommendation = async (nodeId) => {
  // return mockRecommendation;

  const apiUrl = `${API_CONFIG.BASE_URL}/api/node/recommend?fromId=${nodeId}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('From recommendation API:', data);
    return data;
  } catch (error) {
    console.error('error recommendation data:', error);
    throw error;
  }
};

export const confirmNode = async (title, summary, fromId, newid) => {
  const apiUrl = `${API_CONFIG.BASE_URL}/api/node/confirm`;

  try {
    const data = {
      title: title,
      summary: summary,
      fromId: fromId,
      uuid: newid
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response;
    console.log('From confirm API :', result);
    return result;
  } catch (error) {
    console.error('error confirm data:', error);
    throw error;
  }
};

export const upload = async (formData) => {

  const apiUrl = `${API_CONFIG.BASE_URL}/api/agent/upload`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('From upload API :', data);
    return data;
  } catch (error) {
    console.error('error upload data:', error);
    throw error;
  }
};

export const mergeNodes = async (nodeIds) => {
  const apiUrl = `${API_CONFIG.BASE_URL}/api/node/merge`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nodeIds)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();
    console.log('From merge API:', data);
    return data;
  } catch (error) {
    console.error('Error merging nodes:', error);
    throw error;
  }
};


