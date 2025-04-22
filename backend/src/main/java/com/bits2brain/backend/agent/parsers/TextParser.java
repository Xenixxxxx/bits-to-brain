package com.bits2brain.backend.agent.parsers;

import com.bits2brain.backend.service.KnowledgeService;
import com.bits2brain.backend.util.TextTruncator;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.core.type.TypeReference;


import java.util.Map;

import static com.bits2brain.backend.util.Const.TEXT_PARSER_NAME;
import static com.bits2brain.backend.util.prompts.TEXT_EXTRACT;

@Slf4j
@Component
@RequiredArgsConstructor
public class TextParser implements Parser {

    private final ChatLanguageModel chatModel;
    private final KnowledgeService knowledgeService;


    @Override
    public String getName() {
        return TEXT_PARSER_NAME;
    }

    @Override
    public Object run(Map<String, Object> input) {
        String content = (String) input.get("content");

        if (content == null || content.isBlank()) {
            return Map.of("error", "No content provided.");
        }

        // Truncate to safe limit for token budget
        String truncatedText = TextTruncator.truncate(content);

        String prompt = TEXT_EXTRACT + truncatedText;

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
