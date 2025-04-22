package com.bits2brain.backend.agent;

import com.bits2brain.backend.agent.tools.ChatTools;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.MemoryId;
import dev.langchain4j.service.UserMessage;
import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class AgentProvider {

    private final String systemPrompt = """
    You are a helpful AI assistant for a knowledge graph.
    
    If the user provides a node uuid:
    - Call queryNodeByUuidTool to retrieve node content.
    - Answer based on it.
    
    If the user wants to learn a new topic (without uuid):
    1. Call findRelevantNode to find similar node.
    2. If found, return its content for review.
    3. If not found, call recommendNodesTool to suggest 3 related nodes.
    4. When user confirms one, call confirmRecommendationTool to store it.
    
    Be concise and guide the user clearly.
    """;

    private final ChatLanguageModel chatLanguageModel;

    @Resource
    private final ChatTools chatTools;

    public interface AssistantAgent {
        String chat(@MemoryId String sessionId, @UserMessage String message);
    }

    @Bean
    public AssistantAgent assistantAgent() {


        ChatMemoryProvider chatMemoryProvider = sessionId ->
                MessageWindowChatMemory.builder()
                        .id(sessionId)
                        .maxMessages(5)
                        .build();

        return AiServices.builder(AssistantAgent.class)
                .chatLanguageModel(chatLanguageModel)
                .chatMemoryProvider(chatMemoryProvider)
                .systemMessageProvider(user -> systemPrompt)
                .tools(chatTools)
                .build();
    }
}
