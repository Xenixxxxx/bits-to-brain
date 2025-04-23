package com.bits2brain.backend.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Slf4j
@Component
@RequiredArgsConstructor
public class VideoEmbedHelper {

    @Value("${azure.video.indexer.subscriptionKey}")
    private String subscriptionKey;

    @Value("${azure.video.indexer.location}")
    private String location;

    @Value("${azure.video.indexer.accountId}")
    private String accountId;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String getEmbedUrl(String videoId) throws Exception {
        String accessToken = getAccessToken(videoId);
        log.info("[VideoEmbedHelper] Access token: {}", accessToken);

        return String.format(
                "https://www.videoindexer.ai/embed/player/%s/%s/?accessToken=%s&locale=en",
                location, videoId, accessToken
        );
    }

    public String getAccessToken(String videoId) throws Exception {
        String url = String.format(
                "https://api.videoindexer.ai/%s/Accounts/%s/Videos/%s/AccessToken?allowEdit=false",
                location, accountId, videoId
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Ocp-Apim-Subscription-Key", subscriptionKey)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        log.info("[VideoEmbedHelper] Response: {}", response);

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to get access token: " + response.body());
        }

        return response.body().replace("\"", "");
    }

}
