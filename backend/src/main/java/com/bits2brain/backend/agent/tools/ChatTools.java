package com.bits2brain.backend.agent.tools;

import com.bits2brain.backend.service.KnowledgeService;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Tool("Finds the most relevant knowledge node by semantic similarity to the input text")
    public Map<String, Object> findRelevantNode(String query) {
        try {
            Embedding queryEmbedding = embeddingModel.embed(query).content();

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

    @Tool("Recommend related knowledge based on a given title")
    public List<Map<String, Object>> recommendNodesTool(@P("The title of the knowledge node") String title) {
        return knowledgeService.recommendByTitle(title);
    }

}
