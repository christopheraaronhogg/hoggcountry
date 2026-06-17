package com.hoggcountry.trailassistant.scout;

import com.getcapacitor.JSObject;

/**
 * Cheap, immutable snapshot of the on-device model file state.
 *
 * Built by {@link ScoutModelStore#getStatus()} with no network and no checksum
 * hashing — only a file existence/size probe plus the {@link ScoutModelSpec}
 * contract. The status string is one of the constants below; the gate is
 * fail-closed: a file is never reported {@link #READY} until it has been
 * verified (size + SHA-256) and a marker recorded.
 *
 * <p>The {@link #toJSObject()} shape is the canonical cross-platform contract
 * (Android JSObject, iOS [String:Any], TypeScript ScoutGemmaModelStatus) and
 * must be kept identical on all platforms.
 */
public final class ScoutModelStatus {
    /** No download endpoint or checksum configured — nothing to fetch yet. */
    public static final String UNCONFIGURED = "unconfigured";
    /** Configured, but the file is absent or the wrong size — fetch needed. */
    public static final String NEEDS_DOWNLOAD = "needs_download";
    /** File present and size matches, but integrity not yet verified. */
    public static final String PRESENT_UNVERIFIED = "present_unverified";
    /** File present, size + checksum verified. Safe to load. */
    public static final String READY = "ready";

    public final String modelId;
    /** One of the state constants above. */
    public final String state;
    public final String fileName;
    public final String filePath;
    public final boolean exists;
    public final long bytesOnDevice;
    public final long expectedBytes;
    public final String checksumAlgorithm;
    /** Null when no checksum is configured. */
    public final String expectedChecksum;
    /** True when a checksum is configured (used to gate expectedChecksum emission). */
    public final boolean checksumConfigured;
    /**
     * True when a download URL endpoint exists ({@code hasDownloadUrl}).
     * This is intentionally NOT "url OR checksum" — see canonical contract.
     */
    public final boolean downloadConfigured;
    /** True when a download is possible and needed right now. */
    public final boolean canDownload;
    /** Download URL; null when no endpoint is configured. */
    public final String url;
    /** Optional human-readable reason string; null when not present. */
    public final String reason;

    ScoutModelStatus(
            String modelId,
            String state,
            String fileName,
            String filePath,
            boolean exists,
            long bytesOnDevice,
            long expectedBytes,
            String checksumAlgorithm,
            String expectedChecksum,
            boolean checksumConfigured,
            boolean downloadConfigured,
            boolean canDownload,
            String url,
            String reason) {
        this.modelId = modelId;
        this.state = state;
        this.fileName = fileName;
        this.filePath = filePath;
        this.exists = exists;
        this.bytesOnDevice = bytesOnDevice;
        this.expectedBytes = expectedBytes;
        this.checksumAlgorithm = checksumAlgorithm;
        this.expectedChecksum = expectedChecksum;
        this.checksumConfigured = checksumConfigured;
        this.downloadConfigured = downloadConfigured;
        this.canDownload = canDownload;
        this.url = url;
        this.reason = reason;
    }

    /**
     * Emits the canonical cross-platform status shape.
     *
     * <ul>
     *   <li>{@code expectedChecksum} is emitted only when {@code checksumConfigured}.</li>
     *   <li>{@code url} is emitted only when {@code downloadConfigured}.</li>
     *   <li>{@code reason} is emitted only when present (non-null, non-empty).</li>
     *   <li>{@code destinationPath} is NOT emitted — callers derive it from {@code filePath}.</li>
     * </ul>
     */
    public JSObject toJSObject() {
        JSObject object = new JSObject();
        object.put("modelId", modelId);
        object.put("state", state);
        object.put("fileName", fileName);
        object.put("filePath", filePath);
        object.put("exists", exists);
        object.put("bytesOnDevice", bytesOnDevice);
        object.put("expectedBytes", expectedBytes);
        object.put("checksumAlgorithm", checksumAlgorithm);
        object.put("checksumConfigured", checksumConfigured);
        object.put("downloadConfigured", downloadConfigured);
        object.put("canDownload", canDownload);
        if (checksumConfigured) {
            object.put("expectedChecksum", expectedChecksum);
        }
        if (downloadConfigured) {
            object.put("url", url);
        }
        if (reason != null && !reason.isEmpty()) {
            object.put("reason", reason);
        }
        return object;
    }
}
