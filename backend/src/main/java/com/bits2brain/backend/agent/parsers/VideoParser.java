package com.bits2brain.backend.agent.parsers;

import com.bits2brain.backend.config.AzureVideoIndexerClient;
import com.bits2brain.backend.service.KnowledgeService;
import com.bits2brain.backend.util.FileUtils;
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
import java.util.concurrent.CompletableFuture;

import static com.bits2brain.backend.util.Const.VIDEO_PARSER_NAME;
import static com.bits2brain.backend.util.Prompts.SUBTITLE_EXTRACT;

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

    @Override
    public Object run(Map<String, Object> input) {
        MultipartFile file = (MultipartFile) input.get("file");
        if (file == null || file.isEmpty()) {
            return Map.of("error", "No video file provided.");
        }

        try {
            String name = "upload_" + UUID.randomUUID();
            File localFile = File.createTempFile(name, ".mp4");
            try (FileOutputStream fos = new FileOutputStream(localFile)) {
                fos.write(file.getBytes());
            }

            // 1. Calculate MD5 to deduplicate
            String md5 = FileUtils.calculateMD5(localFile);
            if (FileUtils.isDuplicate(md5)) {
                log.warn("[VideoParser] Duplicate video detected, skipping processing.");
                return Map.of("message", "Duplicate video, skipping processing.");
            }
            FileUtils.saveMD5(md5);

            log.info("[VideoParser] Uploading video to Azure: {}", name);
            String videoId = azureClient.uploadVideo(name, localFile);

            // 2. Return immediately, and asynchronously process the rest
            CompletableFuture.runAsync(() -> {
                try {
                    Instant t1 = Instant.now();
                    azureClient.waitForProcessing(videoId);

                    Map<String, Object> insights = azureClient.getInsights(videoId);
                    log.info("[VideoParser] Received insights: {}", insights.keySet());

                    List<Map<String, Object>> videos = (List<Map<String, Object>>) insights.get("videos");
                    if (videos == null || videos.isEmpty()) {
                        log.error("[VideoParser] No video insights available");
                        return;
                    }

                    Map<String, Object> insightsMap = (Map<String, Object>) videos.get(0).get("insights");
                    if (insightsMap == null || !insightsMap.containsKey("transcript")) {
                        log.error("[VideoParser] No transcript found in insights");
                        return;
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
                    log.info("[VideoParser] Extracted transcript: {}", transcript);

                    String prompt = SUBTITLE_EXTRACT + transcript;
                    String result = chatModel.chat(prompt);

                    ObjectMapper mapper = new ObjectMapper();
                    Map<String, Object> parsed = mapper.readValue(result, Map.class);
                    parsed.put("source", VIDEO_PARSER_NAME);
                    parsed.put("extra", Map.of("video_ids", List.of(videoId)));

                    log.info("[VideoParser] Processing time: {} ms", Duration.between(t1, Instant.now()).toMillis());

                    knowledgeService.saveFromParsedResult(parsed, true);
                    log.info("[VideoParser] Parsed result saved successfully");

                } catch (Exception e) {
                    log.error("[VideoParser] Async processing error: {}", e.getMessage(), e);
                }
            });

            return Map.of("videoId", videoId, "message", "Video uploaded. Processing asynchronously.");

        } catch (Exception e) {
            log.error("[VideoParser] Error: {}", e.getMessage(), e);
            return Map.of("error", "Processing failed", "details", e.getMessage());
        }
    }

}