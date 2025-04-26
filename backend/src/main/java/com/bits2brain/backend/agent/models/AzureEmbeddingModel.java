package com.bits2brain.backend.agent.models;

import com.azure.ai.openai.OpenAIClient;
import dev.langchain4j.model.azure.AzureOpenAiEmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AzureEmbeddingModel {
    @Value("${azure.embedding.deployment-id}")
    private String deploymentId;

    private final OpenAIClient openAIClient;

    @Autowired
    public AzureEmbeddingModel(OpenAIClient openAIClient) {
        this.openAIClient = openAIClient;
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        return AzureOpenAiEmbeddingModel.builder()
                .openAIClient(openAIClient)
                .deploymentName(deploymentId)
                .dimensions(1536)
                .logRequestsAndResponses(true)
                .build();
    }
}

