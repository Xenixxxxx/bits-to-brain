package com.bits2brain.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.core.type.TypeReference;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
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
import static com.bits2brain.backend.util.prompts.RECOMMEND_CONFIRM;

@Slf4j
@Service
public class KnowledgeService {
    private final Neo4jClient neo4jClient;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;
    private final ChatLanguageModel chatLanguageModel;

    @Autowired
    public KnowledgeService(EmbeddingModel embeddingModel, EmbeddingStore<TextSegment> vectorStore,
                            Neo4jClient neo4jClient, ChatLanguageModel chatModelProvider) {
        this.embeddingStore = vectorStore;
        this.embeddingModel = embeddingModel;
        this.neo4jClient = neo4jClient;
        this.chatLanguageModel = chatModelProvider;
    }

    @PostConstruct
    public void verifyNeo4jConnection() {
        neo4jClient.query("RETURN 1").run();
        log.info("Connected to Neo4j");
    }


    public String saveFromParsedResult(Map<String, Object> parsed) {
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
                return "";
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
        return uuid;
    }

    public void createRelationship(String fromId, String toId, double score) {
        if (fromId.compareTo(toId) > 0) {
            String temp = fromId;
            fromId = toId;
            toId = temp;
        }

        neo4jClient.query("""
                MATCH (a {uuid: $fromId}), (b {uuid: $toId})
                MERGE (a)-[r:SIMILAR]->(b)
                ON CREATE SET r.score = $score
                """).bindAll(Map.of("fromId", fromId, "toId", toId, "score", score)).run();
    }

    @SuppressWarnings("unchecked")
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
                        "type", record.get("type").asString(),
                        "uuid", uuid
                ))
                .one()
                .orElseThrow(() -> new RuntimeException("Node not found for uuid: " + uuid));
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getNodeByTitle(String title) {
        return (Map<String, Object>) neo4jClient.query("""
                            MATCH (n {title: $title})
                            RETURN n.title AS title, n.text AS text, n.createdAt AS createdAt, n.type AS type
                            LIMIT 1
                        """)
                .bind(title).to("title")
                .fetchAs(Map.class)
                .mappedBy((typeSystem, record) -> Map.of(
                        "title", record.get("title").asString(),
                        "text", record.get("text").asString(),
                        "createdAt", record.get("createdAt").asString(),
                        "type", record.get("type").asString()
                ))
                .one()
                .orElseThrow(() -> new RuntimeException("Node not found for title: " + title));
    }


    public List<Map<String, Object>> recommendByUuid(String fromId) {
        Map<String, Object> node = getNodeByUuid(fromId);
        return recommendFromNode(node, fromId);
    }

    public List<Map<String, Object>> recommendByTitle(String title) {
        Map<String, Object> node = getNodeByTitle(title);
        if (node == null) {
            log.error("[KnowledgeService] No node found for title: {}", title);
            return List.of();
        }
        String uuid = (String) node.get("uuid");
        if (uuid == null || uuid.isEmpty()) {
            log.error("[KnowledgeService] No UUID found for title: {}", title);
            return List.of();
        }
        return recommendFromNode(node, (String) node.get("uuid"));
    }

    private List<Map<String, Object>> recommendFromNode(Map<String, Object> node, String fromId) {
        String title = (String) node.get("title");
        String summary = (String) node.get("text");

        if (summary == null || summary.isEmpty()) {
            log.error("[KnowledgeService] No summary found for title: {}", title);
            return List.of();
        }

        String prompt = String.format("""
                You are a smart knowledge assistant helping to expand a knowledge graph.
                
                Given the following node:
                Title: "%s"
                Content: "%s"
                
                Please recommend 3 new, distinct knowledge nodes that are related to the original content.
                For each recommended node, include:
                - A concise and meaningful title (5 words max)
                - A one or two sentence summary explaining the topic
                
                Return the results strictly in **JSON array format**, like:
                [
                  {"title": "Title A", "summary": "Summary of A..."},
                  {"title": "Title B", "summary": "Summary of B..."},
                  {"title": "Title C", "summary": "Summary of C..."}
                ]
                """, title, summary);

        String result = chatLanguageModel.chat(prompt);
        log.info("[KnowledgeService] Recommendation result for '{}':\n{}", title, result);

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            List<Map<String, String>> parsed = objectMapper.readValue(result, new TypeReference<>() {
            });
            return parsed.stream()
                    .map(entry -> Map.<String, Object>of(
                            "fromId", fromId,
                            "title", entry.get("title"),
                            "summary", entry.get("summary")
                    ))
                    .toList();
        } catch (Exception e) {
            log.warn("[KnowledgeService] Failed to parse recommendation result, returning raw result", e);
            return List.of(Map.of(
                    "fromId", fromId,
                    "raw", result
            ));
        }
    }


    public void confirmAndSave(String title, String summary, String fromId) {
        String prompt = String.format(RECOMMEND_CONFIRM, title, summary);

        String fullText = chatLanguageModel.chat(prompt);

        Map<String, Object> parsedResult = Map.of(
                "title", title,
                "summary", fullText,
                "type", "generated"
        );

        String newId = saveFromParsedResult(parsedResult);
        createRelationship(fromId, newId, 0);
        log.info("[KnowledgeService] Created relationship from {} to {}", fromId, newId);
    }

}
