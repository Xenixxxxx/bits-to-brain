package com.bits2brain.backend.agent.models;

import dev.langchain4j.model.azure.AzureOpenAiEmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AzureEmbeddingModel {

    @Value("${azure.openai.endpoint}")
    private String endpoint;

    @Value("${azure.openai.api-key}")
    private String apiKey;

    @Value("${azure.embedding.deployment-id}")
    private String deploymentId;

    @Bean
    public EmbeddingModel embeddingModel() {
        return AzureOpenAiEmbeddingModel.builder()
                .endpoint(endpoint)
                .apiKey(apiKey)
                .deploymentName(deploymentId)
                .dimensions(1053)
                .logRequestsAndResponses(true)
                .build();
    }
}

