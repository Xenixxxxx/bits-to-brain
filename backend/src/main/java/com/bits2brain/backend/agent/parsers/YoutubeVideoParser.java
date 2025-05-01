package com.bits2brain.backend.agent.parsers;

import com.bits2brain.backend.service.KnowledgeService;
import com.bits2brain.backend.util.SubtitlePreprocessor;
import com.bits2brain.backend.util.TextTruncator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static com.bits2brain.backend.util.Const.YOUTUBE_PARSER_NAME;
import static com.bits2brain.backend.util.Prompts.SUBTITLE_EXTRACT;

@Slf4j
@Component
public class YoutubeVideoParser implements Parser {

    private final ChatLanguageModel chatModel;
    private final KnowledgeService knowledgeService;

    @Autowired
    public YoutubeVideoParser(ChatLanguageModel chatModel, KnowledgeService knowledgeService) {
        this.chatModel = chatModel;
        this.knowledgeService = knowledgeService;
    }

    @Override
    public String getName() {
        return YOUTUBE_PARSER_NAME;
    }

    @Override
    public Object run(Map<String, Object> input) {
        String url = (String) input.get("content");

        if (url == null || url.isBlank()) {
            return Map.of("error", "No URL provided.");
        }

        try {
            log.info("[YoutubeVideoParser] Downloading subtitles from: {}", url);
            Instant t1 = Instant.now();

            // Use yt-dlp to download auto-generated English subtitles only (VTT format)
            log.info("[YoutubeVideoParser] Current working directory: {}", System.getProperty("user.dir"));

            String uniqueId = UUID.randomUUID().toString();
            String ytDlpOutput = "video_subs_" + uniqueId;

            String cookiesFilePath = "/app/backend/data/youtube_cookies.txt";
            File cookiesFile = new File(cookiesFilePath);

            List<String> command = new ArrayList<>();
            command.add("yt-dlp");

            if (cookiesFile.exists()) {
                if (cookiesFile.length() < 100) {
                    log.warn("[YoutubeVideoParser] Cookie file exists but looks too small (<100 bytes). Skipping it.");
                } else {
                    log.info("[YoutubeVideoParser] Using cookies from: {}", cookiesFilePath);
                    command.add("--cookies");
                    command.add(cookiesFilePath);
                }
            } else {
                log.info("[YoutubeVideoParser] No cookies file found, running without authentication.");
            }


            command.addAll(List.of(
                    "--write-auto-sub",
                    "--sub-lang", "en",
                    "--skip-download",
                    "-o", ytDlpOutput + ".%(ext)s",
                    url
            ));

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                log.info("[yt-dlp] {}", line);
            }
            process.waitFor();

            // Find the actual subtitle file generated (e.g., video_subs_<uuid>.en.vtt)
            File subtitleFile = Files.list(Paths.get("."))
                    .filter(p -> p.getFileName().toString().startsWith(ytDlpOutput)
                            && p.getFileName().toString().endsWith(".vtt"))
                    .map(Path::toFile)
                    .findFirst()
                    .orElse(null);

            if (subtitleFile == null || !subtitleFile.exists()) {
                return Map.of("error", "Subtitle download failed");
            }

            Instant t2 = Instant.now();
            log.info("[YoutubeVideoParser] Subtitle download completed in {} ms", Duration.between(t1, t2).toMillis());

            // Extract text content from VTT file
            String transcript = Files.lines(subtitleFile.toPath())
                    .filter(l -> !l.startsWith("WEBVTT") &&
                            !l.matches("^\\d{2}:\\d{2}:\\d{2}\\.\\d{3}.*") &&
                            !l.trim().isEmpty())
                    .collect(Collectors.joining(" "));

            log.info("[YoutubeVideoParser] Transcript before processing: {}", transcript);
            transcript = SubtitlePreprocessor.extractPlainText(transcript);


            String truncatedText = TextTruncator.truncate(transcript);
            String prompt = SUBTITLE_EXTRACT + truncatedText;

            Instant t3 = Instant.now();
            String result = chatModel.chat(prompt);
            Instant t4 = Instant.now();
            log.info("[YoutubeVideoParser] LLM response completed in {} ms", Duration.between(t3, t4).toMillis());
            log.info("[YoutubeVideoParser] LLM response: {}", result);

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(result, new TypeReference<>() {
            });
            parsed.put("source", YOUTUBE_PARSER_NAME);
            Map<String, Object> extra = new HashMap<>();
            extra.put("youtube_urls", List.of(url));
            parsed.put("extra", extra);

            parsed.put("timing", Map.of(
                    "downloadMs", Duration.between(t1, t2).toMillis(),
                    "llmTimeMs", Duration.between(t3, t4).toMillis()
            ));

            log.info("[YoutubeVideoParser] Parsed result: {}", parsed);
            knowledgeService.saveFromParsedResult(parsed, true);
            if (!subtitleFile.delete()) {
                log.warn("[YoutubeVideoParser] Failed to delete temporary file: {}", subtitleFile.getName());
            }
            return parsed;

        } catch (Exception e) {
            log.error("[YoutubeVideoParser] Error: {}", e.getMessage(), e);
            return Map.of("error", "Processing failed", "details", e.getMessage());
        }
    }
}
