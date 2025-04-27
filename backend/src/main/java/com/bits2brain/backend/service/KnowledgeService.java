package com.bits2brain.backend.service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.bits2brain.backend.mapper.NodeMapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.data.document.Metadata;


import static com.bits2brain.backend.util.Const.LINK_SIMILARITY_THRESHOLD;
import static com.bits2brain.backend.util.Const.MAX_MERGE_COUNT;
import static com.bits2brain.backend.util.Prompts.MERGE_KNOWLEDGE;
import static com.bits2brain.backend.util.Prompts.RECOMMEND_CONFIRM;

@Slf4j
@Service
public class KnowledgeService {
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;
    private final ChatLanguageModel chatLanguageModel;
    private final NodeMapper nodeMapper;

    @Autowired
    public KnowledgeService(EmbeddingModel embeddingModel, EmbeddingStore<TextSegment> vectorStore,
                            NodeMapper nodeMapper, ChatLanguageModel chatModelProvider) {
        this.embeddingStore = vectorStore;
        this.embeddingModel = embeddingModel;
        this.chatLanguageModel = chatModelProvider;
        this.nodeMapper = nodeMapper;
    }

    public void saveFromParsedResult(Map<String, Object> parsed, boolean autoLink) {
        String title = (String) parsed.getOrDefault("title", "Untitled");
        String summary = (String) parsed.getOrDefault("summary", "");
        String source = (String) parsed.getOrDefault("source", "unknown");
        String createdAt = Instant.now().toString();
        String uuid = (String) parsed.getOrDefault("uuid", UUID.randomUUID().toString());
        if (uuid.isBlank()) {
            uuid = UUID.randomUUID().toString();
        }

        Metadata metadata = new Metadata();
        metadata.put("uuid", uuid);
        metadata.put("title", title);
        metadata.put("source", source);
        metadata.put("createdAt", createdAt);
        try {
            if (parsed.containsKey("extra")) {
                ObjectMapper mapper = new ObjectMapper();
                String extraJson = mapper.writeValueAsString(parsed.get("extra"));
                metadata.put("extra", extraJson);
            }
        } catch (Exception e) {
            log.error("[KnowledgeService] Failed to parse extra metadata", e);
        }

        TextSegment textSegment = new TextSegment(summary, metadata);
        log.info("[KnowledgeService] Saving text segment: {}, Metadata: {}", textSegment, metadata);
        Embedding embedding = embeddingModel.embed(textSegment).content();

        EmbeddingSearchRequest embeddingSearchRequest = EmbeddingSearchRequest.builder().queryEmbedding(embedding).minScore(LINK_SIMILARITY_THRESHOLD).maxResults(3).build();

        // save node
        this.embeddingStore.add(embedding, textSegment);
        log.info("[KnowledgeService] Node saved with UUID: {}", uuid);

        if (!autoLink) {
            log.info("[KnowledgeService] Link creation disabled.");
            return;
        }

        // similarity search
        List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(embeddingSearchRequest).matches();
        List<EmbeddingMatch<TextSegment>> relevantFiltered = new ArrayList<>();
        for (EmbeddingMatch<TextSegment> r : relevant) {
            if (r.score() == 1) {
                continue;
            }
            log.info("[KnowledgeService] Found similar Score: {}, document: {}", r.score(), r.embedded().text());
            relevantFiltered.add(r);
        }

        // save links based on UUID
        for (EmbeddingMatch<TextSegment> r : relevantFiltered) {
            String toId = r.embedded().metadata().getString("uuid");
            Double score = r.score();

            nodeMapper.createRelationship(uuid, toId, score);
            log.info("[KnowledgeService] Created link from {} to {} with score {}", uuid, toId, score);
        }
        log.info("[KnowledgeService] Links created.");
    }


    public List<Map<String, Object>> recommendByUuid(String fromId) {
        Map<String, Object> node = nodeMapper.getNodeByUuid(fromId);
        return recommendFromNode(node, fromId);
    }

    public List<Map<String, Object>> recommendByTitle(String title) {
        Map<String, Object> node = nodeMapper.getNodeByTitle(title);
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
                
                Return ONLY a valid **raw JSON array** object. DO NOT include ```json or ``` or any explanation text. Format:
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


    public void confirmAndSave(String title, String summary, String fromId, String newId) {
        String prompt = String.format(RECOMMEND_CONFIRM, title, summary);

        String fullText = chatLanguageModel.chat(prompt);

        Map<String, Object> parsedResult = Map.of(
                "title", title,
                "summary", fullText,
                "source", "generated",
                "uuid", newId
        );

        saveFromParsedResult(parsedResult, true);
        nodeMapper.createRelationship(fromId, newId, 0);
        log.info("[KnowledgeService] Created relationship from {} to {}", fromId, newId);
    }

    public Map<String, Object> mergeNodes(List<String> uuids) throws JsonProcessingException {
        if (uuids == null || uuids.isEmpty()) {
            log.error("[mergeNodes] No UUIDs provided");
            throw new IllegalArgumentException("No UUIDs provided");
        }
        if (uuids.size() > MAX_MERGE_COUNT) {
            log.error("[mergeNodes] Cannot merge more than {} nodes. Provided: {}", MAX_MERGE_COUNT, uuids.size());
            throw new IllegalArgumentException("Cannot merge more than " + MAX_MERGE_COUNT + " nodes.");
        }

        // 1. Get all nodes by UUIDs
        log.info("[mergeNodes] Fetching nodes for UUIDs: {}", uuids);
        List<Map<String, Object>> nodes = uuids.stream()
                .map(nodeMapper::getNodeByUuid)
                .toList();

        // 2. Combine all titles and texts
        String combinedTitle = nodes.stream().map(n -> (String) n.get("title")).collect(Collectors.joining(" | "));
        String combinedText = IntStream.range(0, nodes.size())
                .mapToObj(i -> "Concept " + (i + 1) + ": " + nodes.get(i).get("title") + "\n" + nodes.get(i).get("text"))
                .collect(Collectors.joining("\n\n"));

        log.info("[mergeNodes] Combined title: {}", combinedTitle);

        // 3. Merge extra fields
        log.info("[mergeNodes] Merging extra fields from nodes");
        Set<String> websiteUrls = new HashSet<>();
        Set<String> youtubeUrls = new HashSet<>();
        Set<String> videoIds = new HashSet<>();

        for (Map<String, Object> node : nodes) {
            Map<String, Object> extra = (Map<String, Object>) node.getOrDefault("extra", Map.of());
            log.info("[mergeNodes] Extra fields: {}", extra);
            websiteUrls.addAll((List<String>) extra.getOrDefault("website_urls", List.of()));
            youtubeUrls.addAll((List<String>) extra.getOrDefault("youtube_urls", List.of()));
            videoIds.addAll((List<String>) extra.getOrDefault("video_ids", List.of()));
        }
        log.info("[mergeNodes] Merged extra fields: website_urls: {}, youtube_urls: {}, video_ids: {}",
                websiteUrls, youtubeUrls, videoIds);

        // 4. Generate a new title and summary using the LLM
        log.info("[mergeNodes] Generating merged title and summary using LLM");
        String prompt = MERGE_KNOWLEDGE + combinedText;

        log.info("[mergeNodes] Merging nodes with prompt: {}", prompt);

        String result = chatLanguageModel.chat(prompt);
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> resultMap = mapper.readValue(result, new TypeReference<>() {
        });
        String newUuid = UUID.randomUUID().toString();
        String newTitle = (String) resultMap.getOrDefault("title", "");
        String mergedText = (String) resultMap.getOrDefault("summary", "");

        if (newTitle.isBlank() || mergedText.isBlank()) {
            log.error("[mergeNodes] Failed to generate new title or summary from LLM");
            throw new IllegalArgumentException("Failed to generate new title or summary");
        }
        log.info("[mergeNodes] Generated new node with UUID: {}, Title: {}", newUuid, newTitle);

        // 5. Save the new node
        Map<String, Object> newNodeInfo = Map.of(
                "uuid", newUuid,
                "title", newTitle,
                "summary", mergedText,
                "source", "merged",
                "createdAt", Instant.now().toString(),
                "extra", Map.of(
                        "website_urls", websiteUrls,
                        "youtube_urls", youtubeUrls,
                        "video_ids", videoIds
                )
        );
        log.info("[mergeNodes] Saving new merged node");
        saveFromParsedResult(newNodeInfo, false);

        // 6. find all neighbors of the original nodes and connect them to the new node
        log.info("[mergeNodes] Reconnecting neighbors to new node");
        nodeMapper.reconnectNeighbors(newUuid, uuids);

        // 7. delete the original nodes and their relationships
        log.info("[mergeNodes] Deleting original nodes: {}", uuids);
        nodeMapper.deleteNodesByUuids(uuids);

        log.info("[mergeNodes] Merge completed successfully. New node UUID: {}", newUuid);
        return Map.of("uuid", newUuid, "title", newTitle, "text", mergedText, "extra", Map.of(
                "website_urls", websiteUrls,
                "youtube_urls", youtubeUrls,
                "video_ids", videoIds
        ));
    }

    public Map<String, Object> getNodeByUuid(String uuid) {
        Map<String, Object> node = nodeMapper.getNodeByUuid(uuid);
        if (node == null) {
            log.error("[KnowledgeService] No node found for UUID: {}", uuid);
            return Map.of("error", "Node not found for UUID: " + uuid);
        }
        return node;
    }

    public void addYoutubeUrlToNode(String uuid, String youtubeLink) {
        nodeMapper.addYoutubeUrlToNode(uuid, youtubeLink);
    }
}
