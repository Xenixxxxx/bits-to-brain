package com.bits2brain.backend.config;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.io.FileSystemResource;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class AzureVideoIndexerClient {

    @Value("${azure.video.indexer.subscriptionKey}")
    private String subscriptionKey;

    @Value("${azure.video.indexer.accountId}")
    private String accountId;

    @Value("${azure.video.indexer.location}")
    private String location;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getAccessToken() {
        String url = String.format("https://api.videoindexer.ai/Auth/%s/Accounts/%s/AccessToken", location, accountId);
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                .queryParam("allowEdit", "true");

        HttpHeaders headers = new HttpHeaders();
        headers.set("Ocp-Apim-Subscription-Key", subscriptionKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                builder.toUriString(), HttpMethod.GET, entity, String.class);

        return response.getBody().replace("\"", ""); // remove quotes
    }

    public String uploadVideo(String name, File videoFile) throws IOException {
        String accessToken = getAccessToken();
        String url = String.format("https://api.videoindexer.ai/%s/Accounts/%s/Videos?name=%s&accessToken=%s",
                location, accountId, name, accessToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(videoFile));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        return root.get("id").asText();
    }

    public void waitForProcessing(String videoId) throws InterruptedException {
        while (true) {
            String state = getProcessingState(videoId);
            log.info("[AzureVideoIndexer] Video {} Processing state: {}", videoId, state);

            if ("Processed".equalsIgnoreCase(state)) return;
            else if ("Failed".equalsIgnoreCase(state)) throw new RuntimeException("Video processing failed");

            TimeUnit.SECONDS.sleep(10);
        }
    }

    private String getProcessingState(String videoId) {
        String accessToken = getAccessToken();
        String url = String.format("https://api.videoindexer.ai/%s/Accounts/%s/Videos/%s/Index?accessToken=%s",
                location, accountId, videoId, accessToken);

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.get("state").asText();
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse processing state", e);
        }
    }

    public Map<String, Object> getInsights(String videoId) throws IOException {
        String accessToken = getAccessToken();
        String url = String.format("https://api.videoindexer.ai/%s/Accounts/%s/Videos/%s/Index?accessToken=%s",
                location, accountId, videoId, accessToken);

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        return objectMapper.readValue(response.getBody(), Map.class);
    }
}
