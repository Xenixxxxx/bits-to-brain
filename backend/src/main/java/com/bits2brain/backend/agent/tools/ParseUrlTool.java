package com.bits2brain.backend.agent.tools;

import com.bits2brain.backend.agent.models.AzureOpenAiChat;
import com.bits2brain.backend.util.TextTruncator;
import dev.langchain4j.model.chat.ChatLanguageModel;
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

@Component
class ParseUrlTool implements AgentTool {

    private static final Logger logger = LoggerFactory.getLogger(ParseUrlTool.class);
    private final ChatLanguageModel chatModel;

    @Autowired
    public ParseUrlTool(ChatLanguageModel chatModelProvider) {
        this.chatModel = chatModelProvider;
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

        logger.info("[parseUrlTool] Fetching webpage from: {}", url);

        String pageText;
        Instant t1 = Instant.now();
        try {
            Document doc = Jsoup.connect(url).get();
            pageText = doc.body().text();
        } catch (IOException e) {
            logger.error("[parseUrlTool] Failed to fetch webpage: {}", e.getMessage());
            return Map.of("error", "Failed to load webpage", "details", e.getMessage());
        }
        Instant t2 = Instant.now();

        logger.info("[parseUrlTool] Webpage fetched successfully in {} ms", Duration.between(t1, t2).toMillis());

        String truncatedText = TextTruncator.truncate(pageText);
        String prompt = "You are a helpful assistant that extracts structured knowledge from webpage text.\n"
                + "Summarize the following page content in a structured and concise way:\n"
                + truncatedText;

        Instant t3 = Instant.now();
        try {
            String result = chatModel.chat(prompt);
            Instant t4 = Instant.now();

            logger.info("[parseUrlTool] LLM response completed in {} ms", Duration.between(t3, t4).toMillis());

            return Map.of(
                    "title", "Extracted Knowledge from Web Page",
                    "summary", result,
                    "source", "parseUrlTool",
                    "timing", Map.of(
                            "fetchTimeMs", Duration.between(t1, t2).toMillis(),
                            "llmTimeMs", Duration.between(t3, t4).toMillis()
                    )
            );
        } catch (Exception e) {
            logger.error("[parseUrlTool] Chat model processing failed: {}", e.getMessage());
            return Map.of("error", "Chat model processing failed", "details", e.getMessage());
        }
    }
}
