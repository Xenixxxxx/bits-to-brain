package com.bits2brain.backend.controller;

import com.bits2brain.backend.agent.ParserManager;
import jakarta.annotation.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import static com.bits2brain.backend.util.Const.*;

/**
 * Controller for handling file uploads and text input.
 * It processes the input and returns the result from the appropriate parser.
 */
@RestController
@RequestMapping("/api/agent")
public class UploadController {
    @Resource
    private ParserManager parserManager;

    @PostMapping("/upload")
    public ResponseEntity<?> handleUpload(
            @RequestPart(value = "text", required = false) String text,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        Map<String, Object> inputMap = new HashMap<>();
        String inputContent = null;
        String parserName = null;

        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null) {
                return ResponseEntity.badRequest().body("Unsupported file type.");
            }

            if (contentType.startsWith("image/")) {
                byte[] imageBytes = file.getBytes();
                String base64Image = Base64.getEncoder().encodeToString(imageBytes);
                inputContent = "data:" + contentType + ";base64," + base64Image;
                parserName = "parseImageTool";

            } else if (contentType.startsWith("video/")) {
                inputMap.put("file", file);
                parserName = VIDEO_PARSER_NAME;

            } else if (contentType.equals("text/plain") || contentType.equals("application/pdf")) {
                inputContent = new String(file.getBytes());
                parserName = "parseTextTool";
            } else {
                return ResponseEntity.badRequest().body("Unsupported file type: " + contentType);
            }
        } else if (text != null && !text.isEmpty()) {
            if (text.startsWith("http://") || text.startsWith("https://")) {
                if (text.contains("youtube.com")) {
                    parserName = YOUTUBE_PARSER_NAME;
                    inputContent = text;
                } else {
                    parserName = URL_PARSER_NAME;
                    inputContent = text;
                }
            } else {
                parserName = TEXT_PARSER_NAME;
                inputContent = text;
            }
        } else {
            return ResponseEntity.badRequest().body("No valid input provided.");
        }


        inputMap.put("content", inputContent);

        Object result = parserManager.call(parserName, inputMap);
        return ResponseEntity.ok(result);
    }
}
