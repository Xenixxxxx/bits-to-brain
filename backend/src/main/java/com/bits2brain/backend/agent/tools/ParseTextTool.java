package com.bits2brain.backend.agent.tools;

import com.bits2brain.backend.agent.models.AzureOpenAiChat;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;



import java.util.Map;


/**
 * Implementation of AgentTool using LangChain4j and Azure ChatModelProvider.
 */
@Component
class ParseTextTool implements AgentTool {

    private final ChatLanguageModel chatModel;

    @Autowired
    public ParseTextTool(AzureOpenAiChat c) {
        this.chatModel = c.get();
    }

    @Override
    public String getName() {
        return "parseTextTool";
    }

    @Override
    public Object run(Map<String, Object> input) {
        String content = (String) input.get("content");

        if (content == null || content.isBlank()) {
            return Map.of("error", "No content provided.");
        }

        String prompt = "You are a helpful assistant that extracts structured knowledge from text.\n" +
                "Given the following content, summarize the key points in a structured way:\n" + content;

        try {
            String result = chatModel.chat(prompt);
            return Map.of(
                    "title", "Extracted Knowledge from Text",
                    "summary", result,
                    "source", "parseTextTool"
            );
        } catch (Exception e) {
            return Map.of("error", "Chat model processing failed", "details", e.getMessage());
        }
    }
}
