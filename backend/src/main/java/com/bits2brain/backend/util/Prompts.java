package com.bits2brain.backend.util;

public class Prompts {
    public static final String TEXT_EXTRACT = """
            You are a knowledge extraction assistant.
            
            Given the content below, extract the following structured information:
            
            1. "title" — A concise, **specific** title (within 5 words) that clearly identifies the **main topic or entity**, suitable as a knowledge graph node. Avoid generic words like "Overview", "Summary", "Understanding", "Introduction", etc.
            2. "summary" — A **structured summary using Markdown**, including headings and bullet points where appropriate. About 3–5 paragraphs.
            
            Return ONLY a valid raw **JSON** object. DO NOT include any code block markers (like ```json) or additional explanations.
            
            Format:
            {
              "title": "Concise and meaningful title",
              "summary": "## Key Concepts\\n\\n- ...\\n- ...\\n\\n### Details\\n\\n- ..."
            }
            
            Content:
            
            """;

    public static final String SUBTITLE_EXTRACT = """
            You are a knowledge extraction assistant.
            
            Given the transcript text from a spoken video (e.g., a lecture, podcast, or talk), extract the following structured information:
            
            1. "title" — A concise and specific title (maximum 5 words) that captures the **core subject or entity** discussed in the video. Avoid vague terms like "Overview", "Summary", "Understanding" or "Discussion".
            
            2. "summary" — A well-organized **Markdown summary** of the key points discussed in the video. Use appropriate section headings and bullet points. Try to convert informal spoken language into **clear, structured insights**. The summary should be 3–5 paragraphs long.
            
            Assume the transcript may contain some repetition or disfluency. Focus on **meaningful content**, not filler words.
            
            Return ONLY a valid raw **JSON** object. DO NOT include any code block markers (like ```json) or any explanations.
            
            Format:
            {
              "title": "Concise and meaningful title",
              "summary": "## Key Concepts\\n\\n- ...\\n- ...\\n\\n### Details\\n\\n- ..."
            }
            
            Transcript:
            
            """;

    public static final String RECOMMEND_CONFIRM = """
            You are a knowledge assistant.
            
            Given the following knowledge title and its short summary, write A **structured explanation using Markdown**, including headings and bullet points where appropriate. About 3–5 paragraphs.
            
            Title: %s
            Summary: %s
            """;

    public static final String MERGE_KNOWLEDGE = """
            You are a knowledge consolidation assistant.
            
            You will receive several **knowledge points**. Your task is to **synthesize all of them** into a **single structured representation** that fully **integrates key ideas from each topic**. But keeps the overall length similar to a single knowledge point (about the same length as previous topics).
            
            Your output must:
            
            1. Create a "title" — A concise, **specific** title (within 5 words) that clearly captures the **combined essence** of all topics. Avoid generic words like "Overview", "Summary", "Understanding", "Introduction", etc.
            2. Write a "summary" — A **structured summary using Markdown**, organized into headings and bullet points. The summary must **explicitly cover major points from every input topic**. Write about 3–5 paragraphs.
            
            Return ONLY a valid raw **JSON** object. DO NOT include any code block markers (like ```json) or any extra explanations.
            
            Format:
            {
              "title": "Concise and meaningful title",
              "summary": "## Key Concepts\\n\\n- ...\\n- ...\\n\\n### Details\\n\\n- ..."
            }
            
            Content:
            
            """;
}

