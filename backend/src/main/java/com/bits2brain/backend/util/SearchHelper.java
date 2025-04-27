package com.bits2brain.backend.util;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.net.URI;
import java.util.List;
import java.util.Map;

@Component
public class SearchHelper {

    @Value("${google.api.key}")
    private String apiKey;

    @Value("${google.customsearch.cx}")
    private String cx;

    @Value("${google.customsearch.search-url:https://www.googleapis.com/customsearch/v1}")
    private String searchUrl;

    public String searchYouTube(String query) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(searchUrl)
                    .queryParam("key", apiKey)
                    .queryParam("cx", cx)
                    .queryParam("q", query)
                    .queryParam("siteSearch", "youtube.com")
                    .queryParam("num", 1)
                    .build().toUri();

            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            if (items != null && !items.isEmpty()) {
                Map<String, Object> firstItem = items.get(0);
                return (String) firstItem.get("link");
            }
        } catch (Exception e) {
            System.err.println("[VideoSearchHelper] Search YouTube failed: " + e.getMessage());
        }
        return "";
    }
}

