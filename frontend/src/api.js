// API 基础配置
const API_CONFIG = {
  // 切换这两个地址来控制 API 访问
  BASE_URL: 'http://localhost:8080',
  // BASE_URL: 'http://192.168.50.113:8080',
};

const mockGraphData = {
  "edges": [
      {
          "target": "c19f9c9f-98bf-4e22-aac1-7aac888a226e",
          "score": 0.95,
          "source": "c070e4fa-af41-480c-a1d2-8eec7b9823c8"
      },
      {
          "target": "c070e4fa-af41-480c-a1d2-8eec7b9823c8",
          "score": 0.9124996662139893,
          "source": "9e2a5373-dfd0-4019-b69f-2f5bd1203206"
      },
      {
          "target": "c19f9c9f-98bf-4e22-aac1-7aac888a226e",
          "score": 0.8989050388336182,
          "source": "9e2a5373-dfd0-4019-b69f-2f5bd1203206"
      },
      {
          "target": "a200c6d2-1733-4ae6-8fa6-d09d1b2b8f68",
          "score": 0.8832798004150391,
          "source": "9e2a5373-dfd0-4019-b69f-2f5bd1203206"
      },
      {
          "target": "739c9ff0-d6bc-4b37-9e58-6d42a3cc6465",
          "score": 0.0,
          "source": "f3271ac8-242a-4695-8717-0b0a21a1f39e"
      }
  ],
  "nodes": [
      {
          "title": "6 Extracted Knowledge from Text",
          "uuid": "9e2a5373-dfd0-4019-b69f-2f5bd1203206"
      },
      {
          "title": "big title",
          "uuid": "739c9ff0-d6bc-4b37-9e58-6d42a3cc6465"
      },
      {
          "title": "Extracted Knowledge from Text",
          "uuid": "a200c6d2-1733-4ae6-8fa6-d09d1b2b8f68"
      },
      {
          "title": "1Extracted Knowledge from Text",
          "uuid": "c070e4fa-af41-480c-a1d2-8eec7b9823c8"
      },
      {
          "title": "2Extracted Knowledge from Text",
          "uuid": "f3271ac8-242a-4695-8717-0b0a21a1f39e"
      },
      {
          "title": "3Extracted Knowledge from Text",
          "uuid": "c19f9c9f-98bf-4e22-aac1-7aac888a226e"
      }
  ]
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
    // console.log('From graph API :', data);
    return data;
  } catch (error) {
    console.error('error getting graph data:', error);
    throw error;
  }
};

const mockNodeDetail = {
  "text": "3Sample summary from text",
  "createdAt": "2025-04-20T10:55:09.874354Z",
  "type": "text",
  "title": "3Extracted Knowledge from Text"
};

export const fetchNodeDetail = async (nodeId) => {
  // return mockNodeDetail;

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

const mockRecommendation = [
  {
  title: "Techniques in Text Summarization",
  summary: "Overview of various methods used to condense large texts into shorter, comprehensive summaries, including extraction-based and abstraction-based techniques."
  },
  {
  title: "Applications of Text Summaries",
  summary: "Exploration of how text summaries are utilized in different fields such as academia, business intelligence, and legal document analysis to enhance information processing."
  },
  {
  title: "Challenges in Automatic Summarization",
  summary: "Discussion of the difficulties faced in automatic text summarization, such as maintaining context, handling diverse sources, and ensuring the accuracy of generated summaries."
  }
];

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
  // return mockRecommendation;

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


