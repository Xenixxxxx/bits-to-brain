package com.bits2brain.backend.controller;

import com.bits2brain.backend.agent.ToolManager;
import jakarta.annotation.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/agent")
public class UploadController {
    @Resource
    private ToolManager toolManager;

    /**
     * Unified endpoint for uploading multimodal content (text, URL, image, video, PDF, etc.)
     * Automatically generates a prompt based on content type and delegates to the appropriate tool by name.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> handleUpload(
            @RequestPart(value = "text", required = false) String text,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {

        String autoPrompt = "";
        String inputContent = null;
        String toolName = null;

        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null) {
                return ResponseEntity.badRequest().body("Unsupported file type.");
            }

            if (contentType.startsWith("image/")) {
                byte[] imageBytes = file.getBytes();
                String base64Image = Base64.getEncoder().encodeToString(imageBytes);
                inputContent = "data:" + contentType + ";base64," + base64Image;
                autoPrompt = "Please extract meaningful knowledge from this image.";
                toolName = "parseImageTool";

            } else if (contentType.startsWith("video/")) {
                inputContent = "[Video uploaded; processing module required to extract frames/audio.]";
                autoPrompt = "This is a video uploaded by the user. Please summarize its main concepts for the knowledge graph.";
                toolName = "parseVideoTool";

            } else if (contentType.equals("text/plain") || contentType.equals("application/pdf")) {
                inputContent = new String(file.getBytes());
                autoPrompt = "Please extract core knowledge points from the following content and structure them.";
                toolName = "parseTextTool";
            } else {
                return ResponseEntity.badRequest().body("Unsupported file type: " + contentType);
            }
        } else if (text != null && !text.isEmpty()) {
            if (text.startsWith("http://") || text.startsWith("https://")) {
                inputContent = text;
                autoPrompt = "Please extract key knowledge points from the following webpage:";
                toolName = "parseUrlTool";
            } else {
                inputContent = text;
                autoPrompt = "Please transform the following content into a structured knowledge node:";
                toolName = "parseTextTool";
            }
        } else {
            return ResponseEntity.badRequest().body("No valid input provided.");
        }

        Map<String, Object> inputMap = new HashMap<>();
        inputMap.put("prompt", autoPrompt);
        inputMap.put("content", inputContent);

        Object result = toolManager.call(toolName, inputMap);
        return ResponseEntity.ok(result);
    }
}
