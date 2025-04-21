package com.bits2brain.backend.agent;

import com.bits2brain.backend.agent.tools.AgentTool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Central manager to register and call all available tools.
 * Tools are identified by a unique name and implement the AgentTool interface.
 */
@Component
public class ToolManager {

    private final List<AgentTool> tools;

    @Autowired
    public ToolManager(List<AgentTool> tools) {
        this.tools = tools;
    }

    /**
     * Call a tool by its name with given input.
     *
     * @param toolName the name of the tool to invoke
     * @param input input content
     * @return the result of tool execution
     */
    public Object call(String toolName, Map<String, Object> input) {
        return tools.stream()
                .filter(tool -> tool.getName().equals(toolName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Tool not found: " + toolName))
                .run(input);
    }
}
