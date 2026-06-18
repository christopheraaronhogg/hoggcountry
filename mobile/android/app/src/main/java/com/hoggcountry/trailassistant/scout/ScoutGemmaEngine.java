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

    /** True only when a runtime is loaded and model weights are usable. */
    boolean isAvailable();

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
     * call doesn't pay (or risk) the heavy, sometimes-flaky lazy init. Best-effort:
     * implementations MUST NOT throw — a warm-up failure just means the first real
     * turn behaves as before. The default is a no-op (the unavailable stub has
     * nothing to warm).
     */
    default void warmUp() {
        // No-op by default.
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
