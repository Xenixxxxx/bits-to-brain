package com.bits2brain.backend.agent.tools;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Common interface for all agent tools.
 * Every tool must provide a unique name and a run method.
 */
public interface AgentTool {
    String getName();
    Object run(Map<String, Object> input);
}