package com.hoggcountry.trailassistant.scout;

import android.content.Context;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * App-private store + download-readiness boundary for the on-device Gemma model.
 *
 * <p>Offline-safe: {@link #getStatus()} never touches the network. It only
 * inspects app-private storage ({@code context.getFilesDir()/scout-models}) and
 * the {@link ScoutModelSpec} contract. The actual byte transfer is handled by
 * {@link ScoutModelDownloader}, which uses {@link #invalidateVerification()} to
 * clear the marker BEFORE moving a new file into the final path, then calls
 * {@link #verify()} after a successful move. Nothing in this class fabricates a
 * ready model, and no model API/cloud inference is invoked.
 *
 * <h3>Fail-closed marker design</h3>
 * The {@code .verified} sibling marker is BOUND to the verified file's identity
 * (size in bytes + last-modified time in milliseconds). {@link #isVerified()}
 * returns {@code true} ONLY when the marker exists AND its recorded size and
 * mtime match the current file. A post-verify replacement that changes size or
 * mtime fails closed without a per-load re-hash. The downloader MUST call
 * {@link #invalidateVerification()} before moving new bytes into the final path
 * so a crash mid-replace can never leave a stale marker over an unverified file.
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

    /**
     * Cheap status snapshot — no network and no checksum hashing.
     *
     * <p>Computes {@code canDownload}, {@code downloadConfigured} (= hasDownloadUrl),
     * and all canonical contract fields so {@link ScoutModelStatus#toJSObject()}
     * emits the exact shape required by the cross-platform contract.
     */
    public ScoutModelStatus getStatus() {
        File file = modelFile();
        boolean exists = file.isFile();
        long size = exists ? file.length() : 0L;

        // Internal: state 'unconfigured' requires NEITHER url NOR checksum.
        boolean internalConfigured = spec.hasDownloadUrl() || spec.hasExpectedChecksum();

        String state;
        if (!internalConfigured) {
            state = ScoutModelStatus.UNCONFIGURED;
        } else if (!exists) {
            state = ScoutModelStatus.NEEDS_DOWNLOAD;
        } else if (spec.hasExpectedSize() && size != spec.expectedSizeBytes) {
            state = ScoutModelStatus.NEEDS_DOWNLOAD;
        } else if (isVerified(file)) {
            state = ScoutModelStatus.READY;
        } else {
            state = ScoutModelStatus.PRESENT_UNVERIFIED;
        }

        // Canonical emitted fields.
        boolean checksumConfigured = spec.hasExpectedChecksum();
        // downloadConfigured = hasDownloadUrl ONLY (not the OR).
        boolean downloadConfigured = spec.hasDownloadUrl();
        boolean canDownload = downloadConfigured && ScoutModelStatus.NEEDS_DOWNLOAD.equals(state);

        return new ScoutModelStatus(
                spec.modelId,
                state,
                spec.fileName,
                file.getAbsolutePath(),
                exists,
                size,
                spec.expectedSizeBytes,
                ScoutModelSpec.CHECKSUM_ALGORITHM,
                spec.expectedSha256,
                checksumConfigured,
                downloadConfigured,
                canDownload,
                spec.downloadUrl,
                buildReason(state, spec));
    }

    /**
     * Ensures the app-private model directory exists and returns the current
     * status, which carries all fields needed for the {@code prepareModelDownload}
     * plugin method. The directory creation is the only side-effect; no transfer
     * is started.
     */
    public ScoutModelStatus prepareDownload() {
        ensureModelDir();
        return getStatus();
    }

    /**
     * Verifies an already-downloaded file against the configured size and SHA-256
     * and, on success, writes a sibling {@code .verified} marker containing the
     * file's size and last-modified time so {@link #getStatus()} can report
     * {@link ScoutModelStatus#READY} cheaply without re-hashing on every call.
     *
     * <p>Returns {@code false} (and clears any marker) when the spec has no
     * checksum, the file is missing, or the size/hash mismatch — i.e. fail closed.
     * Reads the whole file, so call it off the main thread.
     */
    public boolean verify() throws IOException {
        if (!spec.hasExpectedChecksum()) {
            clearVerifiedMarker();
            return false;
        }
        File file = modelFile();
        if (!file.isFile()) {
            clearVerifiedMarker();
            return false;
        }
        if (spec.hasExpectedSize() && file.length() != spec.expectedSizeBytes) {
            clearVerifiedMarker();
            return false;
        }

        boolean ok = sha256(file).equalsIgnoreCase(spec.expectedSha256);
        if (ok) {
            writeVerifiedMarker(file);
        } else {
            clearVerifiedMarker();
        }
        return ok;
    }

    /**
     * Clears the {@code .verified} marker so the next {@link #getStatus()} call
     * cannot report the model as ready. MUST be called by the downloader BEFORE
     * moving new bytes into the final model path so a crash mid-replace can never
     * leave a stale marker over an unverified file.
     */
    public void invalidateVerification() {
        clearVerifiedMarker();
    }

    public boolean ensureModelDir() {
        return modelDir.isDirectory() || modelDir.mkdirs();
    }

    // -------------------------------------------------------------------------
    // Marker helpers (fail-closed identity binding)
    // -------------------------------------------------------------------------

    /**
     * Returns {@code true} only when the marker exists AND its recorded size and
     * mtime exactly match the current file. Any mismatch deletes the stale marker
     * so it can never again cause a false-ready result.
     */
    private boolean isVerified(File file) {
        File marker = verifiedMarker();
        if (!marker.isFile()) {
            return false;
        }
        try {
            long[] identity = readMarker(marker);
            long recordedSize = identity[0];
            long recordedMtime = identity[1];
            if (recordedSize == file.length() && recordedMtime == file.lastModified()) {
                return true;
            }
            // Stale marker — file was replaced or tampered. Remove it.
            clearVerifiedMarker();
            return false;
        } catch (IOException e) {
            clearVerifiedMarker();
            return false;
        }
    }

    private File verifiedMarker() {
        return new File(modelDir, spec.fileName + VERIFIED_SUFFIX);
    }

    /**
     * Writes the marker file containing two lines: {@code <sizeBytes>\n<mtimeMillis>}.
     * Binding the marker to the file's identity makes a same-content replacement
     * detectable by mtime even when size is identical.
     */
    private void writeVerifiedMarker(File file) throws IOException {
        ensureModelDir();
        File marker = verifiedMarker();
        try (FileWriter writer = new FileWriter(marker, false)) {
            writer.write(file.length() + "\n" + file.lastModified() + "\n");
        }
    }

    /** Reads {@code <sizeBytes>\n<mtimeMillis>} from the marker file. */
    private static long[] readMarker(File marker) throws IOException {
        try (BufferedReader reader =
                     new BufferedReader(new InputStreamReader(new FileInputStream(marker)))) {
            String sizeLine = reader.readLine();
            String mtimeLine = reader.readLine();
            if (sizeLine == null || mtimeLine == null) {
                throw new IOException("Marker file truncated: " + marker);
            }
            return new long[]{Long.parseLong(sizeLine.trim()), Long.parseLong(mtimeLine.trim())};
        }
    }

    private void clearVerifiedMarker() {
        File marker = verifiedMarker();
        if (marker.isFile() && !marker.delete()) {
            marker.deleteOnExit();
        }
    }

    // -------------------------------------------------------------------------
    // Reason string helper
    // -------------------------------------------------------------------------

    private static String buildReason(String state, ScoutModelSpec spec) {
        switch (state) {
            case ScoutModelStatus.UNCONFIGURED:
                return "No download endpoint configured for "
                        + spec.modelId
                        + "; the model must be provisioned before Scout can run on-device.";
            case ScoutModelStatus.READY:
                return "Model already downloaded and verified.";
            case ScoutModelStatus.PRESENT_UNVERIFIED:
                return "Model file present; integrity verification pending.";
            case ScoutModelStatus.NEEDS_DOWNLOAD:
            default:
                return "Model download required.";
        }
    }

    // -------------------------------------------------------------------------
    // SHA-256 helper
    // -------------------------------------------------------------------------

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
