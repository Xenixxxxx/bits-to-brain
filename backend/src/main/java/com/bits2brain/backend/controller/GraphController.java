package com.bits2brain.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
public class GraphController {

    private final Neo4jClient neo4jClient;

    @Autowired
    public GraphController(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @GetMapping("/api/graph")
    public Map<String, Object> getGraph() {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        // Query all nodes
        neo4jClient.query("""
                MATCH (n)
                RETURN n.uuid AS uuid, n.title AS title
                """).fetch().all().forEach(row -> {
            nodes.add(Map.of(
                    "uuid", row.get("uuid"),
                    "title", row.get("title")
            ));
        });

        // Query all edges
        neo4jClient.query("""
                MATCH (a)-[r:SIMILAR]->(b)
                RETURN a.uuid AS source, b.uuid AS target, r.score AS score
                """).fetch().all().forEach(row -> {
            edges.add(Map.of(
                    "source", row.get("source"),
                    "target", row.get("target"),
                    "score", row.get("score")
            ));
        });

        return Map.of(
                "nodes", nodes,
                "edges", edges
        );
    }
}
