package com.bits2brain.backend.agent.parsers;

import java.util.Map;

/**
 * Interface for all parsers.
 * Parsers are used to extract information from various sources.
 * Each parser must implement the run method to process input data.
 */
public interface Parser {
    String getName();
    Object run(Map<String, Object> input);
}