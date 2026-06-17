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
    public final String status;
    public final String absolutePath;
    public final boolean exists;
    public final long sizeBytes;
    public final long expectedSizeBytes;
    public final String checksumAlgorithm;
    public final String expectedChecksum;
    public final boolean configured;

    ScoutModelStatus(
            String modelId,
            String status,
            String absolutePath,
            boolean exists,
            long sizeBytes,
            long expectedSizeBytes,
            String checksumAlgorithm,
            String expectedChecksum,
            boolean configured) {
        this.modelId = modelId;
        this.status = status;
        this.absolutePath = absolutePath;
        this.exists = exists;
        this.sizeBytes = sizeBytes;
        this.expectedSizeBytes = expectedSizeBytes;
        this.checksumAlgorithm = checksumAlgorithm;
        this.expectedChecksum = expectedChecksum;
        this.configured = configured;
    }

    public JSObject toJSObject() {
        JSObject object = new JSObject();
        object.put("modelId", modelId);
        object.put("state", status);
        object.put("filePath", absolutePath);
        object.put("exists", exists);
        object.put("bytesOnDevice", sizeBytes);
        object.put("expectedBytes", expectedSizeBytes);
        object.put("checksumAlgorithm", checksumAlgorithm);
        object.put("checksumConfigured", expectedChecksum != null && !expectedChecksum.isEmpty());
        object.put("downloadConfigured", configured);
        if (expectedChecksum != null) {
            object.put("expectedChecksum", expectedChecksum);
        }
        return object;
    }
}
