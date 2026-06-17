package com.hoggcountry.trailassistant.scout;

import android.content.Context;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * App-private store + download-readiness boundary for the on-device Gemma model.
 *
 * <p>Offline-safe: {@link #getStatus()} and {@link #prepareDownload()} never
 * touch the network. They only inspect app-private storage
 * ({@code context.getFilesDir()/scout-models}) and the {@link ScoutModelSpec}
 * contract. The actual byte transfer is intentionally NOT wired here yet — when a
 * download endpoint is finalized, a downloader uses the plan returned by
 * {@link #prepareDownload()} to fetch into {@link #modelFile()}, then calls
 * {@link #verify()} before the file is treated as ready. Nothing in this class
 * fabricates a ready model, and no model API/cloud inference is invoked.
 */
public final class ScoutModelStore {
    private static final String MODEL_DIR = "scout-models";
    private static final String VERIFIED_SUFFIX = ".verified";
    private static final int READ_BUFFER_BYTES = 1 << 16;

    private final File modelDir;
    private final ScoutModelSpec spec;

    public ScoutModelStore(Context context) {
        this(context, ScoutModelSpec.target());
    }

    public ScoutModelStore(Context context, ScoutModelSpec spec) {
        this.spec = spec;
        this.modelDir = new File(context.getFilesDir(), MODEL_DIR);
    }

    public ScoutModelSpec spec() {
        return spec;
    }

    public File modelFile() {
        return new File(modelDir, spec.fileName);
    }

    /** Cheap status snapshot — no network and no checksum hashing. */
    public ScoutModelStatus getStatus() {
        File file = modelFile();
        boolean exists = file.isFile();
        long size = exists ? file.length() : 0L;
        boolean configured = spec.hasDownloadUrl() || spec.hasExpectedChecksum();

        String status;
        if (!configured) {
            status = ScoutModelStatus.UNCONFIGURED;
        } else if (!exists) {
            status = ScoutModelStatus.NEEDS_DOWNLOAD;
        } else if (spec.hasExpectedSize() && size != spec.expectedSizeBytes) {
            status = ScoutModelStatus.NEEDS_DOWNLOAD;
        } else if (isVerified()) {
            status = ScoutModelStatus.READY;
        } else {
            status = ScoutModelStatus.PRESENT_UNVERIFIED;
        }

        return new ScoutModelStatus(
                spec.modelId,
                status,
                file.getAbsolutePath(),
                exists,
                size,
                spec.expectedSizeBytes,
                ScoutModelSpec.CHECKSUM_ALGORITHM,
                spec.expectedSha256,
                configured);
    }

    /**
     * Prepares for a (future) first-run/on-demand download without performing it.
     * Creates the app-private model directory and returns a plan describing what a
     * downloader would need. Offline-safe; never starts a transfer.
     */
    public ScoutModelDownloadPlan prepareDownload() {
        ensureModelDir();
        ScoutModelStatus status = getStatus();
        boolean canDownload =
                spec.hasDownloadUrl() && ScoutModelStatus.NEEDS_DOWNLOAD.equals(status.status);

        String reason;
        if (!spec.hasDownloadUrl()) {
            reason = "No download endpoint configured for "
                    + spec.modelId
                    + "; the model must be provisioned before Scout can run on-device.";
        } else if (ScoutModelStatus.READY.equals(status.status)) {
            reason = "Model already downloaded and verified.";
        } else if (ScoutModelStatus.PRESENT_UNVERIFIED.equals(status.status)) {
            reason = "Model file present; integrity verification pending.";
        } else {
            reason = "Model download required.";
        }

        return new ScoutModelDownloadPlan(
                spec.modelId,
                status.status,
                canDownload,
                spec.downloadUrl,
                modelFile().getAbsolutePath(),
                spec.expectedSizeBytes,
                ScoutModelSpec.CHECKSUM_ALGORITHM,
                spec.expectedSha256,
                reason);
    }

    /**
     * Verifies an already-downloaded file against the configured size and SHA-256
     * and, on success, writes a sibling {@code .verified} marker so
     * {@link #getStatus()} can report {@link ScoutModelStatus#READY} cheaply.
     *
     * <p>Returns {@code false} (and clears any marker) when the spec has no
     * checksum, the file is missing, or the size/hash mismatch — i.e. fail closed.
     * Reads the whole file, so call it off the main thread.
     */
    public boolean verify() throws IOException {
        if (!spec.hasExpectedChecksum()) {
            return false;
        }
        File file = modelFile();
        if (!file.isFile()) {
            return false;
        }
        if (spec.hasExpectedSize() && file.length() != spec.expectedSizeBytes) {
            clearVerifiedMarker();
            return false;
        }

        boolean ok = sha256(file).equalsIgnoreCase(spec.expectedSha256);
        if (ok) {
            writeVerifiedMarker();
        } else {
            clearVerifiedMarker();
        }
        return ok;
    }

    public boolean ensureModelDir() {
        return modelDir.isDirectory() || modelDir.mkdirs();
    }

    private boolean isVerified() {
        return verifiedMarker().isFile();
    }

    private File verifiedMarker() {
        return new File(modelDir, spec.fileName + VERIFIED_SUFFIX);
    }

    private void writeVerifiedMarker() throws IOException {
        ensureModelDir();
        File marker = verifiedMarker();
        if (!marker.createNewFile() && !marker.isFile()) {
            throw new IOException("Could not write verification marker: " + marker);
        }
    }

    private void clearVerifiedMarker() {
        File marker = verifiedMarker();
        if (marker.isFile() && !marker.delete()) {
            marker.deleteOnExit();
        }
    }

    private static String sha256(File file) throws IOException {
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IOException("SHA-256 unavailable on this platform", e);
        }
        byte[] buffer = new byte[READ_BUFFER_BYTES];
        try (InputStream in = new FileInputStream(file)) {
            int read;
            while ((read = in.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
        }
        return toHex(digest.digest());
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(Character.forDigit((b >> 4) & 0xF, 16));
            sb.append(Character.forDigit(b & 0xF, 16));
        }
        return sb.toString();
    }
}
