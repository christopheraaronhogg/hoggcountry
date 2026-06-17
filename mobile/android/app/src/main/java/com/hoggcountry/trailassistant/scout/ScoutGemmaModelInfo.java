package com.hoggcountry.trailassistant.scout;

/**
 * Immutable description of the on-device model the Scout bridge targets.
 *
 * Mirrors GemmaModelDescriptor in
 * mobile/src/lib/scout/providers/on-device-gemma.ts:
 *   { tier, modelId, maxContextTokens }
 * where tier is the JS GemmaTier union: "fast" | "balanced" | "small".
 */
public final class ScoutGemmaModelInfo {
    public final String tier;
    public final String modelId;
    public final int maxContextTokens;

    public ScoutGemmaModelInfo(String tier, String modelId, int maxContextTokens) {
        this.tier = tier;
        this.modelId = modelId;
        this.maxContextTokens = maxContextTokens;
    }
}
