package com.bits2brain.backend.agent;

import com.bits2brain.backend.agent.parsers.Parser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;


/**
 * ParserManager is responsible for managing and executing different parsers.
 * It uses Spring's dependency injection to get a list of available parsers.
 * The call method allows you to execute a specific parser by its name with the provided input.
 */
@Component
public class ParserManager {

    private final List<Parser> parsers;

    @Autowired
    public ParserManager(List<Parser> parsers) {
        this.parsers = parsers;
    }

    /**
     * Calls a specific parser by its name and passes the input to it.
     *
     * @param parserName The name of the parser to call.
     * @param input      The input data to process.
     * @return The result of the parser's execution.
     */
    public Object call(String parserName, Map<String, Object> input) {
        return parsers.stream()
                .filter(parser -> parser.getName().equals(parserName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Parser not found: " + parserName))
                .run(input);
    }
}
