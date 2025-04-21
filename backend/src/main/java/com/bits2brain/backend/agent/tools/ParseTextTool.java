package com.bits2brain.backend.agent.tools;

import com.bits2brain.backend.service.KnowledgeService;
import com.bits2brain.backend.util.TextTruncator;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.core.type.TypeReference;


import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ParseTextTool implements AgentTool {

    private final ChatLanguageModel chatModel;
    private final KnowledgeService knowledgeService;


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

        // Truncate to safe limit for token budget
        String truncatedText = TextTruncator.truncate(content);

        String prompt = "You are a helpful assistant that extracts structured knowledge from text.\n" +
                "Given the content below, extract:\n" +
                "- A concise title (preferably within 5 words)\n" +
                "- A brief summary of the key ideas\n\n" +
                "Return the result strictly in JSON format like:\n" +
                "{ \"title\": \"...\", \"summary\": \"...\" }\n\n" +
                "Content:\n" + truncatedText;

        try {
            String result = chatModel.chat(prompt);
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(result, new TypeReference<>() {
            });

            parsed.put("type", "text"); // add type metadata

            log.info("[parseTextTool] Parsed result: {}", parsed);
            knowledgeService.saveFromParsedResult(parsed);
            return parsed;
        } catch (Exception e) {
            log.error("[parseTextTool] Error processing chat model: {}", e.getMessage(), e);
            return Map.of("error", "Chat model processing failed");
        }
    }
}
