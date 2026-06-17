package com.hoggcountry.trailassistant.scout;

import com.hoggcountry.trailassistant.BuildConfig;

/**
 * Immutable contract describing the on-device Gemma model file this build targets.
 *
 * It is the single configuration point for the download/store boundary. URL and
 * checksum are intentionally nullable: until the LiteRT-LM file and its endpoint
 * are finalized they stay null, ScoutModelStore reports the model as
 * {@code unconfigured}, and the Gemma-only build stays fail-closed (it never
 * treats a model as ready). When finalized, fill these in — the download URL is a
 * public model endpoint, NOT a secret, so nothing here should ever hold a token.
 *
 * The modelId mirrors {@link ScoutGemmaModelInfo#modelId} / the JS
 * GemmaModelDescriptor so status and engine descriptors agree on identity.
 */
public final class ScoutModelSpec {
    /** Sentinel for "final size not yet pinned" — size checks are skipped. */
    public static final long UNKNOWN_SIZE = -1L;

    /** Algorithm reported to JS and used by {@link ScoutModelStore#verify()}. */
    public static final String CHECKSUM_ALGORITHM = "SHA-256";

    public final String modelId;
    public final String fileName;
    public final long expectedSizeBytes;
    public final String expectedSha256;
    public final String downloadUrl;

    public ScoutModelSpec(
            String modelId,
            String fileName,
            long expectedSizeBytes,
            String expectedSha256,
            String downloadUrl) {
        this.modelId = modelId;
        this.fileName = fileName;
        this.expectedSizeBytes = expectedSizeBytes;
        this.expectedSha256 = expectedSha256;
        this.downloadUrl = downloadUrl;
    }

    /**
     * The model this Gemma-only build targets. URL + checksum are null on purpose:
     * no download endpoint is finalized, so the store reports {@code unconfigured}
     * and the build cannot drift into reporting a model as ready. When the real
     * LiteRT-LM file is pinned, set fileName/expectedSizeBytes/expectedSha256 and
     * a public downloadUrl here.
     */
    public static ScoutModelSpec target() {
        return new ScoutModelSpec(
                "gemma-4-E2B-it-litert-lm",
                "gemma-4-E2B-it-litert-lm.litertlm",
                BuildConfig.SCOUT_GEMMA_MODEL_BYTES > 0
                        ? BuildConfig.SCOUT_GEMMA_MODEL_BYTES
                        : UNKNOWN_SIZE,
                emptyToNull(BuildConfig.SCOUT_GEMMA_MODEL_SHA256),
                emptyToNull(BuildConfig.SCOUT_GEMMA_MODEL_URL));
    }

    public boolean hasDownloadUrl() {
        return downloadUrl != null && !downloadUrl.isEmpty();
    }

    public boolean hasExpectedChecksum() {
        return expectedSha256 != null && !expectedSha256.isEmpty();
    }

    public boolean hasExpectedSize() {
        return expectedSizeBytes > 0;
    }

    private static String emptyToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
    }
}
