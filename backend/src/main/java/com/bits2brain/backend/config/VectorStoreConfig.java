package com.bits2brain.backend.config;

import dev.langchain4j.community.store.embedding.neo4j.Neo4jEmbeddingStore;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class VectorStoreConfig {
    @Value("${spring.neo4j.uri}")
    private String uri;

    @Value("${spring.neo4j.authentication.username}")
    private String username;

    @Value("${spring.neo4j.authentication.password}")
    private String password;

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore(EmbeddingModel embeddingModel) {
        return Neo4jEmbeddingStore.builder()
                .withBasicAuth(uri, username, password)
                .dimension(1536)
                .build();
    }
}
