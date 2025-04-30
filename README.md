# bits2brain

> "Turn fragmented knowledge into structured insight — and build your own personalized knowledge star map."
>

Is fragmented information just a waste of time?

We are constantly exposed to scattered knowledge: a tip from a short video, an insightful point from a YouTube tutorial, a top answer on Reddit, or even a brief description next to a museum exhibit. These moments often pass by without leaving a lasting trace. **bits2brain** aims to change that — it's an AI-powered system that helps you automatically **capture knowledge from everyday life**, **form connections**, and gradually build **your own dynamic knowledge star map**. By linking your memory nodes with AI, your thinking becomes structured, visualized, and easy to navigate.

---

## Core Features

### 1. Knowledge Star Map Generation

- Users can upload fragments of knowledge — web links, screenshots, videos, YouTube URLs, etc. Each becomes a unique node in the star map.
- Using text embeddings, the system automatically identifies related nodes and connects them, creating knowledge pathways.
- The star map is dynamic — it evolves with your ongoing learning and exploration.

### 2. Node Expansion & Cognitive Completion

- Clicking "discover" on a node allows the AI to infer relevant topics based on context and generate suggested nodes.
- Suggested nodes appear as dotted lines; users can preview AI-generated summaries and choose to lock them in.
- Users can also explore topics directly through Chat, such as “I want to learn about football,” and receive relevant entry points.

### 3. Knowledge Fusion & Summarization

- Users can select similar nodes to be merged by an LLM, creating a new summarized node.
- The merged node retains connections, videos, and related resources — enabling content compression and refinement.

### 4. Multimodal Input Support

- Supports uploading text, screenshots, videos, and other formats.
- Image content is processed using Azure Computer Vision OCR to extract embedded text.
- Uploaded videos are analyzed with Azure Video Indexer to generate summaries and reference links.

### 5. Conversational AI with Agent System

- Users can express learning goals via natural language, and the Agent recommends relevant topics and expansion paths based on the current graph state.
- When a node is selected, users can ask context-aware questions — answers incorporate the node's information.
- Users can ask for video recommendations to enrich a node, and the Agent will search, retrieve, and attach relevant content automatically.

---

## Tech Stack & System Architecture

- **Frontend**: JavaScript + React — interactive UI for star map visualization and chat
- **Backend**: Java + Spring Boot — handles business logic, Agent coordination, and knowledge graph operations
- **Database**: Neo4j — graph database for storing nodes and semantic connections
- **Deployment**: Docker-based containers hosted on Azure Virtual Machine
- **CI/CD**: GitHub Actions — for automatic build, image packaging, and deployment updates
- **Natural Language & Generation**: Azure OpenAI Service — for dialogue, summarization, and node synthesis
- **Embedding & Retrieval**: Azure AI Embedding Models + Neo4j — semantic vector-based node search (RAG-style workflow)
- **Image Processing**: Azure Computer Vision — OCR for extracting knowledge from photos or screenshots
- **Video Analysis**: Azure Video Indexer — to parse videos and attach summaries/links to nodes
- **Video Search**: Google Custom Search API — used by the Agent to retrieve relevant YouTube videos based on a node's topic
- **Agent Architecture**: LangChain4j + Memory — enables multi-turn, context-aware conversations
- **Tool System**: Knowledge search, node query, content recommendation, video search, and video attachment are modularized tools the Agent can invoke

---

## Who Is It For?

**bits2brain** is designed for individuals navigating the age of information overload, seeking better ways to learn and manage knowledge:

- **Students & Lifelong Learners**: Want to structure scattered insights from daily content into lasting knowledge
- **Content Creators & Researchers**: Need to track, connect, and organize diverse sources of inspiration and information
- **Knowledge Professionals**: Including PMs, analysts, consultants — who continuously learn and need to form mental models across domains

---

## Future Directions

1. Introduce user accounts and collaborative workspaces for team-based knowledge graph building
2. Enhance node hierarchy — e.g., allow expanding a large node to reveal a structured tree of subtopics
3. Support richer input types like voice, and use Azure Blob Storage to retain original raw content for each node
4. Add spaced repetition and review features — knowledge nodes darken in color as users reinforce them over time, visually reflecting mastery

---

## 🚀 Try it out!

You'll get your personal knowledge star map system running in minutes!

### Step 1 – Clone the repository

👉 [**Fork this repo**](https://github.com/your-username/bits2brain/fork) and then clone it locally:

```bash
git clone https://github.com/your-username/bits2brain.git
cd bits2brain
```

### Step 2 – Set up your environment

Copy the environment config file:

```bash
cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.propertie
```

Then fill in your Azure OpenAI and Google API credentials and database configuration in the new `application.properties` file.

### Step 3 – Deploy with one command

Simply run the deployment script to start backend, frontend, and database containers:

```bash
./restart.sh
```

Once complete, open your browser and visit:

[**http://localhost:3000**](http://localhost:3000/) to explore your own knowledge star map!