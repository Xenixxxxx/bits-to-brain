package com.bits2brain.backend.agent.tools;

import com.bits2brain.backend.service.KnowledgeService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.bits2brain.backend.util.TextTruncator;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@Slf4j
@Component
class ParseUrlTool implements AgentTool {

    private final ChatLanguageModel chatModel;
    private final KnowledgeService knowledgeService;

    @Autowired
    public ParseUrlTool(ChatLanguageModel chatModelProvider, KnowledgeService knowledgeService) {
        this.chatModel = chatModelProvider;
        this.knowledgeService = knowledgeService;
    }

    @Override
    public String getName() {
        return "parseUrlTool";
    }

    @Override
    public Object run(Map<String, Object> input) {
        String url = (String) input.get("content");

        if (url == null || url.isBlank()) {
            return Map.of("error", "No URL provided.");
        }

        log.info("[parseUrlTool] Fetching webpage from: {}", url);

        String pageText;
        Instant t1 = Instant.now();
        try {
            Document doc = Jsoup.connect(url).get();
            pageText = doc.body().text();
        } catch (IOException e) {
            log.error("[parseUrlTool] Failed to fetch webpage: {}", e.getMessage());
            return Map.of("error", "Failed to load webpage", "details", e.getMessage());
        }
        Instant t2 = Instant.now();

        log.info("[parseUrlTool] Webpage fetched successfully in {} ms", Duration.between(t1, t2).toMillis());

        String truncatedText = TextTruncator.truncate(pageText);
        String prompt = "You are a helpful assistant that extracts structured knowledge from webpage text.\n" +
                "Given the content below, extract:\n" +
                "- A clear and concise title (preferably within 5 words)\n" +
                "- A short summary of the content\n\n" +
                "Return the result strictly in JSON format like:\n" +
                "{ \"title\": \"...\", \"summary\": \"...\" }\n\n" +
                "Content:\n" + truncatedText;

        Instant t3 = Instant.now();
        try {
            String result = chatModel.chat(prompt);
            Instant t4 = Instant.now();

            log.info("[parseUrlTool] LLM response completed in {} ms", Duration.between(t3, t4).toMillis());

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(result, new TypeReference<>() {});
            parsed.put("source", "parseUrlTool");
            parsed.put("timing", Map.of(
                    "fetchTimeMs", Duration.between(t1, t2).toMillis(),
                    "llmTimeMs", Duration.between(t3, t4).toMillis()
            ));

            log.info("[parseUrlTool] Parsed result: {}", parsed);
            knowledgeService.saveFromParsedResult(parsed);
            return parsed;
        } catch (Exception e) {
            log.error("[parseUrlTool] Chat model processing failed: {}", e.getMessage());
            return Map.of("error", "Chat model processing failed", "details", e.getMessage());
        }
    }

}
