package com.bits2brain.backend.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ComputerVisionHelper {

    @Value("${azure.vision.endpoint}")
    private String endpoint;

    @Value("${azure.vision.key}")
    private String apiKey;

    public String readImageFile(MultipartFile file) {
        try {
            String url = endpoint + "/vision/v3.2/read/analyze";
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.set("Ocp-Apim-Subscription-Key", apiKey);

            log.info("[ComputerVisionHelper] Sending file to Azure Computer Vision API: {}", url);
            log.info("[ComputerVisionHelper] Api key: {}", apiKey);

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

            ResponseEntity<Void> response = restTemplate.exchange(
                    URI.create(url),
                    HttpMethod.POST,
                    requestEntity,
                    Void.class
            );

            String operationLocation = response.getHeaders().getFirst("Operation-Location");
            if (operationLocation == null || operationLocation.isEmpty()) {
                throw new RuntimeException("Operation-Location header is missing.");
            }

            log.info("[ComputerVisionHelper] Submitted successfully, polling result at: {}", operationLocation);

            RestTemplate pollingRestTemplate = new RestTemplate();
            Map<String, Object> result;
            int maxAttempts = 10;
            int attempts = 0;
            HttpEntity<Void> getEntity = new HttpEntity<>(headers);

            while (true) {
                Thread.sleep(1000);
                ResponseEntity<Map> pollResponse = pollingRestTemplate.exchange(
                        URI.create(operationLocation),
                        HttpMethod.GET,
                        getEntity,
                        Map.class
                );
                result = pollResponse.getBody();
                String status = (String) result.get("status");
                if ("succeeded".equalsIgnoreCase(status)) {
                    break;
                }
                if ("failed".equalsIgnoreCase(status)) {
                    throw new RuntimeException("OCR processing failed.");
                }
                if (++attempts >= maxAttempts) {
                    throw new RuntimeException("Timed out waiting for OCR result.");
                }
            }


            Map<String, Object> analyzeResult = (Map<String, Object>) result.get("analyzeResult");
            if (analyzeResult == null) {
                return "";
            }

            StringBuilder sb = new StringBuilder();
            List<Map<String, Object>> readResults = (List<Map<String, Object>>) analyzeResult.get("readResults");
            for (Map<String, Object> page : readResults) {
                List<Map<String, Object>> lines = (List<Map<String, Object>>) page.get("lines");
                for (Map<String, Object> line : lines) {
                    sb.append(line.get("text")).append("\n");
                }
            }
            return sb.toString();

        } catch (Exception e) {
            log.error("[ComputerVisionHelper] OCR from file failed: {}", e.getMessage(), e);
            return "";
        }
    }
}
