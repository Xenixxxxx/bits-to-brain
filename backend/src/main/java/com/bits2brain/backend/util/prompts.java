package com.bits2brain.backend.util;

public class prompts {
    public static final String TEXT_EXTRACT = """
            You are a knowledge extraction assistant.
            
            Given the content below, extract the following structured information:
            
            1. "title" — A concise title (ideally within 5 words), suitable as a node in a knowledge graph.
            2. "summary" — A structured summary written in **Markdown format**
            
            Return the result strictly in JSON format like:
            {
              "title": "Concise and meaningful title",
              "summary": "A well-written summary with multiple paragraphs..."
            }
            
            Content:
            """;

    public static final String RECOMMEND_CONFIRM = """
            You are a knowledge assistant.
            
            Given the following knowledge title and its short summary, write a detailed and structured explanation (2–3 paragraphs) in **Markdown format**.
            
            Title: %s
            Summary: %s
            """;
}

