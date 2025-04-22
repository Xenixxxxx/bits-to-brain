package com.bits2brain.backend.util;

public class prompts {
    public static final String TEXT_EXTRACT = """
            You are a knowledge extraction assistant.
            
            Given the content below, extract the following structured information:
            
            1. "title" — A concise, **specific** title (within 5 words) that clearly identifies the **main topic or entity**, suitable as a knowledge graph node. Avoid generic words like "Overview", "Summary", "Introduction", etc.
            2. "summary" — A **structured summary using Markdown**, including headings and bullet points where appropriate. About 2–5 paragraphs.
            
            Return ONLY a valid raw **JSON** object. DO NOT include any code block markers (like ```json) or additional explanations.
            
            Format:
            {
              "title": "Concise and meaningful title",
              "summary": "## Key Concepts\\n\\n- ...\\n- ...\\n\\n### Details\\n\\n- ..."
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

