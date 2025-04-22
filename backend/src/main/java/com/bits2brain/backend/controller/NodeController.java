package com.bits2brain.backend.controller;

import com.bits2brain.backend.service.KnowledgeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/node")
public class NodeController {

    private final KnowledgeService knowledgeService;


    public NodeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<Map<String, Object>> getNode(@PathVariable String uuid) {
        try {
            Map<String, Object> data = knowledgeService.getNodeByUuid(uuid);
            return ResponseEntity.ok(data);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/recommend")
    public List<Map<String, Object>> recommend(@RequestParam String fromId) {
        return knowledgeService.recommendByUuid(fromId);
    }

    @PostMapping("/confirm")
    public ResponseEntity<String> confirmAndSave(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        String summary = request.get("summary");
        String fromId = request.get("fromId");
        String uuid = request.get("uuid");

        if (title == null || summary == null || fromId == null || uuid == null ||
                title.isBlank() || summary.isBlank() || fromId.isBlank() || uuid.isBlank()) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }

        knowledgeService.confirmAndSave(title, summary, fromId, uuid);
        return ResponseEntity.ok("Saved and linked");
    }
}
