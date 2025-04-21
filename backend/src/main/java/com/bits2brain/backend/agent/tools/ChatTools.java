package com.bits2brain.backend.agent.tools;

import com.bits2brain.backend.service.KnowledgeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatTools {

    private final KnowledgeService knowledgeService;
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final ChatLanguageModel chatModel;

    @Tool("Finds the most relevant knowledge node by semantic similarity to the input text")
    public Map<String, Object> findRelevantNode(@P("user input topic") String topic) {
        try {
            Embedding queryEmbedding = embeddingModel.embed(topic).content();

            EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                    .queryEmbedding(queryEmbedding)
                    .minScore(0.9)
                    .maxResults(1)
                    .build();

            List<EmbeddingMatch<TextSegment>> matches = embeddingStore.search(searchRequest).matches();
            if (matches.isEmpty()) {
                return Map.of("matched", false, "message", "No relevant knowledge node found.");
            }

            EmbeddingMatch<TextSegment> match = matches.get(0);
            TextSegment segment = match.embedded();

            Metadata metadata = segment.metadata();

            return Map.of(
                    "matched", true,
                    "uuid", Objects.requireNonNull(metadata.getString("uuid")),
                    "title", Objects.requireNonNull(metadata.getString("title")),
                    "summary", segment.text(),
                    "score", match.score()
            );
        } catch (Exception e) {
            log.error("[QueryVectorTool] Failed to query embedding store", e);
            return Map.of("matched", false, "error", e.getMessage());
        }
    }

    @Tool("Given a node uuid, returns its title, content(text)")
    public Map<String, Object> queryNodeByUuid(@P("uuid") String uuid) {
        try {
            log.info("[QueryNodeByUuidTool] Querying node with UUID: {}", uuid);
            Map<String, Object> node = knowledgeService.getNodeByUuid(uuid);
            if (node == null || node.isEmpty()) {
                log.warn("[QueryNodeByUuidTool] Node not found for UUID: {}", uuid);
                return Map.of("error", "Node not found for UUID: " + uuid);
            }
            node.remove("createdAt");
            node.remove("type");
            return node;
        } catch (Exception e) {
            log.warn("[QueryNodeByUuidTool] error for UUID: {}, {}", uuid, e.getMessage());
            return Map.of("error", "Node not found for UUID: " + uuid);
        }
    }

    @Tool("Given a topic the user is interested in, recommends 3 related knowledge nodes with title and summary.")
    public List<Map<String, String>> recommendNodesTool(String topic) {
        String prompt = String.format("""
            You are a smart assistant helping to expand a knowledge graph.

            The user wants to learn about: "%s"

            Please recommend 3 distinct knowledge nodes that are relevant to this topic.
            For each recommended node, include:
            - A concise title (5 words max)
            - A short summary (1-2 sentences)

            Return the result strictly in JSON array format like:
            [
              {"title": "Node Title A", "summary": "A short summary of A..."},
              {"title": "Node Title B", "summary": "A short summary of B..."},
              {"title": "Node Title C", "summary": "A short summary of C..."}
            ]
        """, topic);

        try {
            String result = chatModel.chat(prompt);
            log.info("[RecommendNodesTool] Raw result:\n{}", result);
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(result, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("[RecommendNodesTool] Failed to parse recommendation result", e);
            return List.of(Map.of("error", "Failed to parse result", "raw", e.getMessage()));
        }
    }

    @Tool("Confirm and save a newly recommended node into the knowledge graph.")
    public Map<String, Object> confirmRecommendationTool(@P("title") String title, @P("summary") String summary) {
        try {
            String prompt = String.format("""
                You are a knowledge assistant.
                Given the following knowledge title and its short summary, write a detailed explanation (1-3 paragraphs).
                
                Title: %s
                Summary: %s
                """, title, summary);

            String fullText = chatModel.chat(prompt);

            Map<String, Object> parsedResult = Map.of(
                    "title", title,
                    "summary", fullText,
                    "type", "generated"
            );
            knowledgeService.saveFromParsedResult(parsedResult);
            return Map.of("status", "success", "message", "Node saved successfully");
        } catch (Exception e) {
            log.error("[ConfirmRecommendationTool] Failed to save node", e);
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

}
