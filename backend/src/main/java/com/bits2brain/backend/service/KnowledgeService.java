package com.bits2brain.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.data.document.Metadata;


import static com.bits2brain.backend.util.Const.SIMILARITY_THRESHOLD;

@Slf4j
@Service
public class KnowledgeService {
    private final Neo4jClient neo4jClient;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;

    @Autowired
    public KnowledgeService(EmbeddingModel embeddingModel, EmbeddingStore<TextSegment> vectorStore, Neo4jClient neo4jClient) {
        this.embeddingStore = vectorStore;
        this.embeddingModel = embeddingModel;
        this.neo4jClient = neo4jClient;
    }

    @PostConstruct
    public void verifyNeo4jConnection() {
        neo4jClient.query("RETURN 1").run();
        log.info("Connected to Neo4j");
    }


    public void saveFromParsedResult(Map<String, Object> parsed) {
        String title = (String) parsed.getOrDefault("title", "Untitled");
        String summary = (String) parsed.getOrDefault("summary", "");
        String type = (String) parsed.getOrDefault("type", "unknown");
        String createdAt = Instant.now().toString();

        String uuid = UUID.randomUUID().toString();

        Metadata metadata = new Metadata();
        metadata.put("uuid", uuid);
        metadata.put("title", title);
        metadata.put("type", type);
        metadata.put("createdAt", createdAt);

        TextSegment textSegment = new TextSegment(summary, metadata);
        log.info("[KnowledgeService] Saving text segment: {}, Metadata: {}", textSegment, metadata);
        Embedding embedding = embeddingModel.embed(textSegment).content();

        EmbeddingSearchRequest embeddingSearchRequest = EmbeddingSearchRequest.builder().queryEmbedding(embedding).minScore(SIMILARITY_THRESHOLD).maxResults(3).build();

        // similarity search
        List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(embeddingSearchRequest).matches();
        for (EmbeddingMatch<TextSegment> r : relevant) {
            log.info("[KnowledgeService] Found similar Score: {}, document: {}", r.score(), r.embedded().text());
            if (r.score() == 1) {
                log.info("[KnowledgeService] Exact match found, not saving.");
                return;
            }
        }

        // save node
        this.embeddingStore.add(embedding, textSegment);

        // save links based on UUID
        for (EmbeddingMatch<TextSegment> r : relevant) {
            String toId = r.embedded().metadata().getString("uuid");
            Double score = r.score();

            createRelationship(uuid, toId, score);
            log.info("[KnowledgeService] Created link from {} to {} with score {}", uuid, toId, score);
        }
    }

    public void createRelationship(String fromId, String toId, double score) {
        neo4jClient.query("""
                MATCH (a {uuid: $fromId}), (b {uuid: $toId})
                MERGE (a)-[r:SIMILAR {score: $score}]->(b)
                """).bindAll(Map.of("fromId", fromId, "toId", toId, "score", score)).run();
    }

    public Map<String, Object> getNodeByUuid(String uuid) {
        return (Map<String, Object>) neo4jClient.query("""
            MATCH (n {uuid: $uuid})
            RETURN n.title AS title, n.text AS text, n.createdAt AS createdAt, n.type AS type
        """)
                .bind(uuid).to("uuid")
                .fetchAs(Map.class)
                .mappedBy((typeSystem, record) -> Map.of(
                        "title", record.get("title").asString(),
                        "text", record.get("text").asString(),
                        "createdAt", record.get("createdAt").asString(),
                        "type", record.get("type").asString()
                ))
                .one()
                .orElseThrow(() -> new RuntimeException("Node not found for uuid: " + uuid));
    }

}
