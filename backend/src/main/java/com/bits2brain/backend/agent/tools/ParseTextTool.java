package com.bits2brain.backend.agent.tools;

import com.bits2brain.backend.agent.models.AzureOpenAiChat;
import com.bits2brain.backend.service.KnowledgeService;
import com.bits2brain.backend.util.TextTruncator;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


import java.util.Map;

@Slf4j
@Component
public class ParseTextTool implements AgentTool {

    private final ChatLanguageModel chatModel;
    private final KnowledgeService knowledgeService;

    @Autowired
    public ParseTextTool(AzureOpenAiChat chatModelProvider, KnowledgeService knowledgeService) {
        this.chatModel = chatModelProvider.get();
        this.knowledgeService = knowledgeService;
    }

    @Override
    public String getName() {
        return "parseTextTool";
    }

    @Override
    public Object run(Map<String, Object> input) {
//        String content = (String) input.get("content");
//
//        if (content == null || content.isBlank()) {
//            return Map.of("error", "No content provided.");
//        }
//
//        // Truncate to safe limit for token budget
//        String truncatedText = TextTruncator.truncate(content);
//
//        String prompt = "You are a helpful assistant that extracts structured knowledge from text.\n" +
//                "Given the following content, summarize the key points in a structured way:\n" + truncatedText;

        try {
//            String result = chatModel.chat(prompt);
//            Map<String, Object> parsed = Map.of(
//                    "title", "Extracted Knowledge from Text",
//                    "summary", result,
//                    "type", "text"
//            );

            Map<String, Object> parsed = Map.of(
                    "title", "Extracted Extracted Knowledge from Text",
                    "summary", "Sample Sample summary from text",
                    "type", "text"
            );
            log.info("[parseTextTool] Parsed result: {}", parsed);
            knowledgeService.saveFromParsedResult(parsed);
            return parsed;
        } catch (Exception e) {
            return Map.of("error", "Chat model processing failed", "details", e.getMessage());
        }
    }
}
