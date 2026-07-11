package com.hoggcountry.trailassistant.scout;

/**
 * Native boundary for the on-device Gemma engine.
 *
 * This interface is the ONLY place that should know about a model runtime
 * (LiteRT-LM / MediaPipe LLM Inference) or Gemma weights. ScoutGemmaPlugin
 * talks to this interface and never to a runtime directly, so the JS contract in
 * mobile/src/lib/scout/capacitor-gemma-bridge.ts stays stable while the engine
 * is swapped from the honest "unavailable" stub to a real implementation.
 *
 * Integration: ScoutGemmaPlugin.createEngine() tries a local implementation
 * first and falls back to the unavailable stub when the runtime or verified
 * model is missing.
 */
public interface ScoutGemmaEngine {

    /**
     * True when this engine can attempt generation (runtime linked + verified
     * weights present). Runtime initialization readiness is reported separately by
     * {@link #isRuntimeReady()} because loading LiteRT-LM is intentionally kept off
     * the Capacitor/UI thread.
     */
    boolean isAvailable();

    /** True only after the native LiteRT-LM engine has initialized successfully. */
    default boolean isRuntimeReady() {
        return false;
    }

    /**
     * Returns the model this build targets. Implementations may return the
     * target descriptor even when weights are absent (informational), or null
     * when nothing is configured.
     */
    ScoutGemmaModelInfo describeModel();

    /**
     * Runs a single on-device completion, streaming incremental text to {@code sink}
     * as it is produced and returning the full result when generation completes.
     *
     * @param sink receives each incremental text chunk during generation; may be
     *             {@code null} for a non-streaming call (the full text is still
     *             returned). Implementations must tolerate a null sink.
     * @throws ScoutGemmaUnavailableException when the engine cannot generate.
     *         Implementations must never return fabricated text.
     */
    GenerateResult generate(String prompt, String systemContext, int maxTokens, TokenSink sink)
            throws ScoutGemmaUnavailableException;

    /**
     * Eagerly initializes the underlying runtime so the FIRST {@link #generate}
     * call doesn't pay (or risk) the heavy, sometimes-flaky lazy init. Returns only
     * after initialization has succeeded; failures are surfaced honestly to the
     * caller instead of reporting a false-positive warm-up.
     */
    default boolean warmUp() throws ScoutGemmaUnavailableException {
        if (!isAvailable()) {
            throw new ScoutGemmaUnavailableException("On-device Gemma is not available.");
        }
        return isRuntimeReady();
    }

    /**
     * Cooperatively cancels the active generation, if any. This must be callable
     * from outside the serial inference executor; queueing it behind generation
     * would make cancellation ineffective.
     */
    default boolean cancelGeneration() {
        return false;
    }

    /** Receives incremental text chunks as the engine streams a response. */
    interface TokenSink {
        void onToken(String chunk);
    }

    /**
     * Releases any native resources held by this engine instance.
     * Safe to call multiple times; subsequent calls are no-ops.
     * Must be called when swapping engines or when the plugin is destroyed.
     */
    void close();

    /** Mirrors the JS generate() return shape: { text, truncated }. */
    final class GenerateResult {
        public final String text;
        public final boolean truncated;

        public GenerateResult(String text, boolean truncated) {
            this.text = text;
            this.truncated = truncated;
        }
    }
}
