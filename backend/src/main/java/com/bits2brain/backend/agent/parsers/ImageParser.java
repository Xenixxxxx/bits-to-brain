package com.bits2brain.backend.agent.parsers;

import com.bits2brain.backend.service.KnowledgeService;
import com.bits2brain.backend.util.ComputerVisionHelper;
import com.bits2brain.backend.util.TextTruncator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import static com.bits2brain.backend.util.Const.IMAGE_PARSER_NAME;
import static com.bits2brain.backend.util.Prompts.TEXT_EXTRACT;

@Slf4j
@Component
@RequiredArgsConstructor
class ImageParser implements Parser {

    private final ChatLanguageModel chatModel;
    private final KnowledgeService knowledgeService;
    private final ComputerVisionHelper visionHelper;

    @Override
    public String getName() {
        return IMAGE_PARSER_NAME;
    }

    @Override
    public Object run(Map<String, Object> input) {
        MultipartFile file = (MultipartFile) input.get("file");

        if (file == null || file.isEmpty()) {
            return Map.of("error", "No image file provided.");
        }

        log.info("[imageParser] Starting OCR from uploaded file.");

        Instant t1 = Instant.now();
        String ocrText = visionHelper.readImageFile(file);

        if (ocrText == null || ocrText.isBlank()) {
            log.error("[imageParser] OCR returned empty text.");
            return Map.of("error", "OCR returned empty text.");
        }

        Instant t2 = Instant.now();

        log.info("[imageParser] OCR completed in {} ms", Duration.between(t1, t2).toMillis());

        String truncatedText = TextTruncator.truncate(ocrText);
        String prompt = TEXT_EXTRACT + truncatedText;

        Instant t3 = Instant.now();
        try {
            String result = chatModel.chat(prompt);
            Instant t4 = Instant.now();

            log.info("[imageParser] LLM response completed in {} ms", Duration.between(t3, t4).toMillis());
            log.info("[imageParser] LLM response: {}", result);

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(result, new TypeReference<>() {});
            parsed.put("source", IMAGE_PARSER_NAME);

            parsed.put("timing", Map.of(
                    "ocrTimeMs", Duration.between(t1, t2).toMillis(),
                    "llmTimeMs", Duration.between(t3, t4).toMillis()
            ));

            log.info("[imageParser] Parsed result: {}", parsed);
            knowledgeService.saveFromParsedResult(parsed, true);
            return parsed;
        } catch (Exception e) {
            log.error("[imageParser] Chat model processing failed", e);
            return Map.of("error", "Chat model processing failed", "details", e.getMessage());
        }
    }
}
