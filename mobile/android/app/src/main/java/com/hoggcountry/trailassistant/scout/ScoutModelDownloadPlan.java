package com.hoggcountry.trailassistant.scout;

import com.getcapacitor.JSObject;

/**
 * What a first-run/on-demand downloader would need to fetch the model.
 *
 * Returned by {@link ScoutModelStore#prepareDownload()}, which only inspects
 * local state and creates the app-private directory — it never starts a
 * transfer. {@code canDownload} is true only when an endpoint is configured and
 * a fetch is actually required; when nothing is configured it is false and
 * {@code status} is {@link ScoutModelStatus#UNCONFIGURED}, so callers cannot be
 * tricked into believing a model is on its way.
 */
public final class ScoutModelDownloadPlan {
    public final String modelId;
    public final String status;
    public final boolean canDownload;
    public final String url;
    public final String destinationPath;
    public final long expectedSizeBytes;
    public final String checksumAlgorithm;
    public final String expectedChecksum;
    public final String reason;

    ScoutModelDownloadPlan(
            String modelId,
            String status,
            boolean canDownload,
            String url,
            String destinationPath,
            long expectedSizeBytes,
            String checksumAlgorithm,
            String expectedChecksum,
            String reason) {
        this.modelId = modelId;
        this.status = status;
        this.canDownload = canDownload;
        this.url = url;
        this.destinationPath = destinationPath;
        this.expectedSizeBytes = expectedSizeBytes;
        this.checksumAlgorithm = checksumAlgorithm;
        this.expectedChecksum = expectedChecksum;
        this.reason = reason;
    }

    public JSObject toJSObject() {
        JSObject object = new JSObject();
        object.put("modelId", modelId);
        object.put("state", status);
        object.put("canDownload", canDownload);
        object.put("destinationPath", destinationPath);
        object.put("expectedBytes", expectedSizeBytes);
        object.put("checksumAlgorithm", checksumAlgorithm);
        object.put("checksumConfigured", expectedChecksum != null && !expectedChecksum.isEmpty());
        object.put("downloadConfigured", url != null && !url.isEmpty());
        object.put("reason", reason);
        if (url != null) {
            object.put("url", url);
        }
        if (expectedChecksum != null) {
            object.put("expectedChecksum", expectedChecksum);
        }
        return object;
    }
}
