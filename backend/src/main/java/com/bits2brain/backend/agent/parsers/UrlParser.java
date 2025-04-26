package com.bits2brain.backend.agent.parsers;

import com.bits2brain.backend.service.KnowledgeService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.bits2brain.backend.util.TextTruncator;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.bits2brain.backend.util.Const.URL_PARSER_NAME;
import static com.bits2brain.backend.util.prompts.TEXT_EXTRACT;

@Slf4j
@Component
class UrlParser implements Parser {

    private final ChatLanguageModel chatModel;
    private final KnowledgeService knowledgeService;

    @Autowired
    public UrlParser(ChatLanguageModel chatModelProvider, KnowledgeService knowledgeService) {
        this.chatModel = chatModelProvider;
        this.knowledgeService = knowledgeService;
    }

    @Override
    public String getName() {
        return URL_PARSER_NAME;
    }

    @Override
    public Object run(Map<String, Object> input) {
        String url = (String) input.get("content");

        if (url == null || url.isBlank()) {
            return Map.of("error", "No URL provided.");
        }

        log.info("[urlParser] Fetching webpage from: {}", url);

        String pageText;
        Instant t1 = Instant.now();
        try {
            Document doc = Jsoup.connect(url).get();
            pageText = doc.body().text();
        } catch (IOException e) {
            log.error("[urlParser] Failed to fetch webpage: {}", e.getMessage());
            return Map.of("error", "Failed to load webpage", "details", e.getMessage());
        }
        Instant t2 = Instant.now();

        log.info("[urlParser] Webpage fetched successfully in {} ms", Duration.between(t1, t2).toMillis());

        String truncatedText = TextTruncator.truncate(pageText);
        String prompt = TEXT_EXTRACT + truncatedText;

        Instant t3 = Instant.now();
        try {
            String result = chatModel.chat(prompt);
            Instant t4 = Instant.now();

            log.info("[urlParser] LLM response completed in {} ms", Duration.between(t3, t4).toMillis());
            log.info("[urlParser] LLM response: {}", result);

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(result, new TypeReference<>() {
            });
            parsed.put("source", URL_PARSER_NAME);
            Map<String, Object> extra = new HashMap<>();
            extra.put("website_urls", List.of(url));
            parsed.put("extra", extra);

            parsed.put("timing", Map.of(
                    "fetchTimeMs", Duration.between(t1, t2).toMillis(),
                    "llmTimeMs", Duration.between(t3, t4).toMillis()
            ));

            log.info("[urlParser] Parsed result: {}", parsed);
            knowledgeService.saveFromParsedResult(parsed, true);
            return parsed;
        } catch (Exception e) {
            log.error("[urlParser] Chat model processing failed", e);
            return Map.of("error", "Chat model processing failed", "details", e.getMessage());
        }
    }

}
