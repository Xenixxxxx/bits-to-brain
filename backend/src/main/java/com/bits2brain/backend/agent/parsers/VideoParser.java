package com.bits2brain.backend.agent.parsers;

import com.bits2brain.backend.config.AzureVideoIndexerClient;
import com.bits2brain.backend.service.KnowledgeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.bits2brain.backend.util.Const.VIDEO_PARSER_NAME;
import static com.bits2brain.backend.util.prompts.SUBTITLE_EXTRACT;
import static com.bits2brain.backend.util.prompts.TEXT_EXTRACT;

@Slf4j
@Component
public class VideoParser implements Parser {

    private final ChatLanguageModel chatModel;
    private final KnowledgeService knowledgeService;
    private final AzureVideoIndexerClient azureClient;

    @Autowired
    public VideoParser(ChatLanguageModel chatModel, KnowledgeService knowledgeService, AzureVideoIndexerClient azureClient) {
        this.chatModel = chatModel;
        this.knowledgeService = knowledgeService;
        this.azureClient = azureClient;
    }

    @Override
    public String getName() {
        return VIDEO_PARSER_NAME;
    }

    // TODO: asynchronous processing
    @Override
    public Object run(Map<String, Object> input) {
        MultipartFile file = (MultipartFile) input.get("file");
        if (file == null || file.isEmpty()) {
            return Map.of("error", "No video file provided.");
        }

        try {
            Instant t1 = Instant.now();
            String name = "upload_" + UUID.randomUUID();
            File localFile = File.createTempFile(name, ".mp4");
            try (FileOutputStream fos = new FileOutputStream(localFile)) {
                fos.write(file.getBytes());
            }

            log.info("[VideoParser] Uploading video to Azure: {}", name);
            String videoId = azureClient.uploadVideo(name, localFile);
            azureClient.waitForProcessing(videoId);

            Map<String, Object> insights = azureClient.getInsights(videoId);
            log.info("[VideoParser] Received insights: {}", insights.keySet());

            // Extract transcript (simple approach)
            List<Map<String, Object>> videos = (List<Map<String, Object>>) insights.get("videos");
            if (videos == null || videos.isEmpty()) {
                return Map.of("error", "No video insights available");
            }

            Map<String, Object> insightsMap = (Map<String, Object>) videos.get(0).get("insights");
            if (insightsMap == null || !insightsMap.containsKey("transcript")) {
                return Map.of("error", "No transcript found in insights");
            }

            List<Map<String, Object>> transcriptList = (List<Map<String, Object>>) insightsMap.get("transcript");
            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> segment : transcriptList) {
                String text = (String) segment.get("text");
                if (text != null && !text.isBlank()) {
                    sb.append(text).append(" ");
                }
            }
            String transcript = sb.toString().trim();

            Instant t2 = Instant.now();
            log.info("[VideoParser] Extracted transcript :{}", transcript);

            String prompt = SUBTITLE_EXTRACT + transcript;
            Instant t3 = Instant.now();
            String result = chatModel.chat(prompt);
            Instant t4 = Instant.now();

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(result, Map.class);
            parsed.put("source", VIDEO_PARSER_NAME);
            parsed.put("timing", Map.of(
                    "uploadAndProcessMs", Duration.between(t1, t2).toMillis(),
                    "llmTimeMs", Duration.between(t3, t4).toMillis()
            ));
            Map<String, Object> extra = new HashMap<>();
            extra.put("video_ids", List.of(videoId));
            parsed.put("extra", extra);

            knowledgeService.saveFromParsedResult(parsed, true);
            return parsed;

        } catch (Exception e) {
            log.error("[VideoParser] Error: {}", e.getMessage(), e);
            return Map.of("error", "Processing failed", "details", e.getMessage());
        }
    }
}