package com.bits2brain.backend.service;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.data.document.Metadata;

import java.util.List;
import java.util.Map;

import static com.bits2brain.backend.util.Const.SIMILARITY_THRESHOLD;

@Slf4j
@Service
public class KnowledgeService {

    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;


    @Autowired
    public KnowledgeService(EmbeddingModel embeddingModel, EmbeddingStore<TextSegment> vectorStore) {
        this.embeddingStore = vectorStore;
        this.embeddingModel = embeddingModel;
    }

    public void saveFromParsedResult(Map<String, Object> parsed) {
        String title = (String) parsed.getOrDefault("title", "Untitled");
        String summary = (String) parsed.getOrDefault("summary", "");
        String type = (String) parsed.getOrDefault("type", "unknown");

        Metadata metadata = new Metadata();
        metadata.put("title", title);
        metadata.put("type", type);

        TextSegment textSegment = new TextSegment(summary, metadata);
        log.info("[KnowledgeService] Saving text segment: {}, Metadata: {}", textSegment, metadata);
        Embedding embedding = embeddingModel.embed(textSegment).content();

        EmbeddingSearchRequest embeddingSearchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(embedding)
                .minScore(SIMILARITY_THRESHOLD)
                .maxResults(3)
                .build();

        // similarity search
        List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(embeddingSearchRequest).matches();
        for (EmbeddingMatch<TextSegment> r : relevant) {
            log.info("[KnowledgeService] Found similar Score: {}, document: {}", r.score(), r.embedded().text());
            if (r.score() == 1) {
                return;
            }
        }

        // save embedding
        this.embeddingStore.add(embedding, textSegment);

        // save node
        // save links
    }


}
