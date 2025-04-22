package com.bits2brain.backend.controller;

import com.bits2brain.backend.agent.AgentProvider.AssistantAgent;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final AssistantAgent assistantAgent;

    @PostMapping
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        String uuid = request.get("uuid");
        String sessionId = request.get("sessionId");

        if (userMessage == null || userMessage.trim().isBlank()) {
            return Map.of("error", "Message is required");
        }

        if (sessionId == null || sessionId.isBlank()) {
            return Map.of("error", "Session ID is required");
        }

        if (uuid != null && !uuid.isBlank()) {
            userMessage = "[uuid: " + uuid + "] " + userMessage;
        }

        String response = assistantAgent.chat(sessionId, userMessage);
        return Map.of("response", response);
    }
}
