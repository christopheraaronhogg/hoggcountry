package com.hoggcountry.trailassistant.scout;

/**
 * Default engine used until a real LiteRT-LM engine is wired in.
 *
 * It honestly reports the model as unavailable and never fabricates output, so
 * Gemma-only Play builds block chat instead of silently using a paid/cloud model.
 * describeModel() still returns the target descriptor so UI/telemetry can show
 * what model this build is built around.
 *
 * ScoutGemmaPlugin.createEngine() already tries LiteRtScoutGemmaEngine first;
 * this stub remains the fallback when the verified model file is missing.
 */
public final class UnavailableScoutGemmaEngine implements ScoutGemmaEngine {
    static final ScoutGemmaModelInfo TARGET_MODEL =
            new ScoutGemmaModelInfo("balanced", "gemma-4-E2B-it-litert-lm", 4096);

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public ScoutGemmaModelInfo describeModel() {
        return TARGET_MODEL;
    }

    @Override
    public GenerateResult generate(String prompt, String systemContext, int maxTokens)
            throws ScoutGemmaUnavailableException {
        throw new ScoutGemmaUnavailableException(
                "On-device Gemma engine is not available in this build. Download and verify the Gemma 4 model file so the local LiteRT-LM runtime can load it.");
    }
}
