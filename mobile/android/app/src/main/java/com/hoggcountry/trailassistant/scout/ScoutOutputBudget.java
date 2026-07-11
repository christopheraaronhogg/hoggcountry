package com.hoggcountry.trailassistant.scout;

import java.nio.charset.StandardCharsets;

/**
 * Conservative visible-output limiter for LiteRT-LM 0.13.x.
 *
 * <p>That runtime exposes a total input+output KV-cache limit, but no per-turn
 * output-token limit. Until it does, use a tested four-UTF-8-bytes-per-token
 * approximation. This keeps Android answers in the same useful range as iOS
 * instead of accidentally treating 640 tokens as only 640 bytes, while retaining
 * a hard visible-output bound and cancelling generation at the ceiling.
 */
final class ScoutOutputBudget {
    private static final int APPROX_BYTES_PER_TOKEN = 4;
    private final int maxBytes;
    private int usedBytes;
    private boolean truncated;

    ScoutOutputBudget(int requestedMaxTokens) {
        // Keep malformed bridge input from producing a zero/unbounded budget.
        int safeTokens = Math.max(1, requestedMaxTokens);
        this.maxBytes = safeTokens > Integer.MAX_VALUE / APPROX_BYTES_PER_TOKEN
                ? Integer.MAX_VALUE
                : safeTokens * APPROX_BYTES_PER_TOKEN;
    }

    synchronized String take(String chunk) {
        if (chunk == null || chunk.isEmpty() || truncated) {
            return "";
        }

        int remaining = maxBytes - usedBytes;
        if (remaining <= 0) {
            truncated = true;
            return "";
        }

        int index = 0;
        int acceptedBytes = 0;
        while (index < chunk.length()) {
            int codePoint = chunk.codePointAt(index);
            String value = new String(Character.toChars(codePoint));
            int bytes = value.getBytes(StandardCharsets.UTF_8).length;
            if (acceptedBytes + bytes > remaining) {
                truncated = true;
                break;
            }
            acceptedBytes += bytes;
            index += Character.charCount(codePoint);
        }

        usedBytes += acceptedBytes;
        if (index < chunk.length()) {
            truncated = true;
        }
        return chunk.substring(0, index);
    }

    synchronized boolean isTruncated() {
        return truncated;
    }

    synchronized int usedBytes() {
        return usedBytes;
    }
}
