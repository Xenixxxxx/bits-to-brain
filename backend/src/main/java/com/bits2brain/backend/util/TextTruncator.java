package com.bits2brain.backend.util;

import static com.bits2brain.backend.util.Const.MAX_CHAR_LENGTH;

/**
 * Utility for truncating long text input to stay within token-safe character limits.
 */
public class TextTruncator {



    /**
     * Truncates text to the safe length for token-bound LLM prompts.
     * @param text input text
     * @return truncated version if over limit
     */
    public static String truncate(String text) {
        if (text == null) return "";
        return text.length() > MAX_CHAR_LENGTH ? text.substring(0, MAX_CHAR_LENGTH) : text;
    }
}