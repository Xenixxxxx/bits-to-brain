package com.bits2brain.backend.agent.models;

import dev.langchain4j.model.azure.AzureOpenAiChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Provides access to Azure-hosted ChatLanguageModel (e.g., GPT-4).
 * This class is a managed Spring Bean and should be injected wherever needed.
 */
@Component
public class AzureOpenAiChat {

    private static final Logger logger = LoggerFactory.getLogger(AzureOpenAiChat.class);

    @Value("${azure.openai.endpoint}")
    private String endpoint;

    @Value("${azure.openai.api-key}")
    private String apiKey;

    @Value("${azure.openai.deployment-id}")
    private String deploymentId;

    @Value("${azure.openai.api-version}")
    private String apiVersion; // unused but required for future versions or custom clients

    private ChatLanguageModel chatModel;

    @PostConstruct
    private void initialize() {
        try {
            logger.info("Initializing Azure OpenAI Chat Model...");

            this.chatModel = AzureOpenAiChatModel.builder()
                    .endpoint(endpoint)
                    .apiKey(apiKey)
                    .deploymentName(deploymentId)
                    .temperature(0.1)
                    .maxTokens(500)
                    .build();

            logger.info("Azure OpenAI Chat Model initialized successfully");
        } catch (Exception e) {
            logger.error("Failed to initialize Azure OpenAI Chat Model: {}", e.getMessage(), e);
            throw new RuntimeException("Azure Chat Model initialization failed", e);
        }
    }

    public ChatLanguageModel get() {
        return chatModel;
    }
}
