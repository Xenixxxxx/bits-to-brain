package com.bits2brain.backend.controller;

import com.bits2brain.backend.service.KnowledgeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static com.bits2brain.backend.util.Const.MAX_MERGE_COUNT;


@Slf4j
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


    @PostMapping("/merge")
    public ResponseEntity<?> mergeNodes(@RequestBody List<String> nodeIds) {
        try {
            if (nodeIds == null || nodeIds.size() < 2) {
                return ResponseEntity.badRequest().body("Please provide at least 2 nodes to merge.");
            }
            if (nodeIds.size() > MAX_MERGE_COUNT) {
                return ResponseEntity.badRequest().body("Too many nodes to merge. Max allowed: " + MAX_MERGE_COUNT);
            }

            Map<String, Object> result = knowledgeService.mergeNodes(nodeIds);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("[NodeController] mergeNodes error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Merging failed: " + e.getMessage());
        }
    }

}
