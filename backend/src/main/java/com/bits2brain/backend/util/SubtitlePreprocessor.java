package com.bits2brain.backend.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SubtitlePreprocessor {

    private static final Pattern CAPTION_PATTERN = Pattern.compile("<c>(.*?)</c>");

    public static String extractPlainText(String rawSubtitleText) {
        if (rawSubtitleText == null || rawSubtitleText.isBlank()) {
            return "";
        }

        Matcher matcher = CAPTION_PATTERN.matcher(rawSubtitleText);
        StringBuilder cleanedText = new StringBuilder();

        while (matcher.find()) {
            String word = matcher.group(1).trim();
            if (!word.isEmpty()) {
                cleanedText.append(word).append(" ");
            }
        }

        return cleanedText.toString().trim();
    }

    public static void main(String[] args) {
        String rawSubtitleText = "<c>hello</c> <c>world</c>";
        String plainText = extractPlainText(rawSubtitleText);
        System.out.println("Extracted plain text: " + plainText);
    }

}
