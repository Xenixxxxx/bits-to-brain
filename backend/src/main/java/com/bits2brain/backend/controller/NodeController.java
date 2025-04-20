package com.bits2brain.backend.controller;

import com.bits2brain.backend.service.KnowledgeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
