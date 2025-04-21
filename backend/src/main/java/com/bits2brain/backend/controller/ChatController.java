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

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return Map.of("error", "Message is required");
        }

        String response = assistantAgent.chat(userMessage);
        return Map.of("response", response);
    }
}
