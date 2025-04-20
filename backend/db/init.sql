-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Node table
CREATE TABLE IF NOT EXISTS knowledge_node (
                                              id UUID PRIMARY KEY,
                                              title VARCHAR(255),
    summary TEXT,
    source_type VARCHAR(50),
    vector vector(3072),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
    );

-- Link table
CREATE TABLE IF NOT EXISTS knowledge_link (
                                              id UUID PRIMARY KEY,
                                              from_id UUID REFERENCES knowledge_node(id),
    to_id UUID REFERENCES knowledge_node(id),
    score FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
    );
