package com.hoggcountry.trailassistant.scout;

import android.content.Context;
import android.os.StatFs;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * First-run / on-demand downloader for the on-device Gemma model file.
 *
 * <p>Pairs with {@link ScoutModelStore}: it fetches the file described by
 * {@link ScoutModelSpec} into the app-private model dir, then hands off to
 * {@link ScoutModelStore#verify()} for SHA-256 verification before the file is
 * ever treated as ready. Downloading model weights is NOT cloud model usage —
 * inference still runs entirely on-device.
 *
 * <p>Robustness for a multi-GB, possibly-flaky trail-town Wi-Fi download:
 * <ul>
 *   <li>Resumable: streams to a {@code .part} file and uses HTTP {@code Range}
 *       to continue an interrupted transfer instead of restarting.</li>
 *   <li>Storage precheck: refuses to start unless free space covers the expected
 *       size plus margin, so it fails fast instead of filling the disk.</li>
 *   <li>Cancellable mid-stream; the {@code .part} file is kept for resume.</li>
 *   <li>Verifies size + checksum on completion and deletes the file on mismatch
 *       (fail-closed — a corrupt/partial model is never marked ready).</li>
 * </ul>
 *
 * <p>This class performs blocking network + disk IO; {@link ScoutGemmaPlugin}
 * runs it on a background executor.
 */
public final class ScoutModelDownloader {
    private static final String PART_SUFFIX = ".part";
    private static final int BUFFER_BYTES = 1 << 16; // 64 KB
    private static final long PROGRESS_STEP_BYTES = 1L << 19; // notify every ~512 KB
    private static final long FREE_SPACE_MARGIN_BYTES = 64L << 20; // 64 MB headroom
    private static final int CONNECT_TIMEOUT_MS = 30_000;
    private static final int READ_TIMEOUT_MS = 60_000;

    /** Reports cumulative progress; totalBytes is -1 when the size is unknown. */
    public interface ProgressListener {
        void onProgress(long bytesDownloaded, long totalBytes);
    }

    private final Context context;
    private final ScoutModelStore store;
    private final ScoutModelSpec spec;
    private volatile boolean cancelled;

    public ScoutModelDownloader(Context context) {
        this.context = context.getApplicationContext();
        this.store = new ScoutModelStore(this.context);
        this.spec = store.spec();
    }

    /** Cooperative cancel; a partial {@code .part} file is left in place for resume. */
    public void cancel() {
        cancelled = true;
    }

    /**
     * Downloads (or resumes), then verifies. Returns the post-verify status.
     *
     * @throws ScoutModelDownloadException on any precondition, transfer, or
     *         verification failure. Never leaves an unverified file reported as
     *         ready.
     */
    public ScoutModelStatus download(ProgressListener listener) throws ScoutModelDownloadException {
        if (!spec.hasDownloadUrl()) {
            throw new ScoutModelDownloadException(
                    "No model download endpoint is configured for " + spec.modelId + ".");
        }
        store.ensureModelDir();

        File finalFile = store.modelFile();
        File partFile = new File(finalFile.getAbsolutePath() + PART_SUFFIX);
        long expected = spec.hasExpectedSize() ? spec.expectedSizeBytes : -1L;

        // Already downloaded + verified? Nothing to do.
        if (ScoutModelStatus.READY.equals(store.getStatus().status)) {
            return store.getStatus();
        }

        ensureFreeSpace(finalFile, expected, partFile.length());

        long existing = partFile.isFile() ? partFile.length() : 0L;
        HttpURLConnection connection = null;
        try {
            connection = open(spec.downloadUrl, existing);
            int code = connection.getResponseCode();

            boolean append;
            if (code == HttpURLConnection.HTTP_PARTIAL) {
                append = true; // 206: server honored Range; continue the .part file.
            } else if (code == HttpURLConnection.HTTP_OK) {
                append = false; // 200: server ignored Range; restart from zero.
                existing = 0L;
            } else if (code == 416 && existing > 0L) {
                // Range not satisfiable — the .part is likely already complete.
                finalizeAndVerify(partFile, finalFile);
                return store.getStatus();
            } else {
                throw new ScoutModelDownloadException(
                        "Model download failed: HTTP " + code + " from " + spec.downloadUrl);
            }

            long total = resolveTotal(connection, expected, append ? existing : 0L);
            transfer(connection, partFile, append, existing, total, listener);
            finalizeAndVerify(partFile, finalFile);
            return store.getStatus();
        } catch (ScoutModelDownloadException e) {
            throw e;
        } catch (IOException e) {
            throw new ScoutModelDownloadException("Model download IO error: " + e.getMessage(), e);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private HttpURLConnection open(String url, long resumeFrom) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        if (resumeFrom > 0L) {
            connection.setRequestProperty("Range", "bytes=" + resumeFrom + "-");
        }
        connection.connect();
        return connection;
    }

    private long resolveTotal(HttpURLConnection connection, long expected, long offset) {
        if (expected > 0L) {
            return expected;
        }
        long contentLength = connection.getContentLengthLong();
        return contentLength >= 0L ? contentLength + offset : -1L;
    }

    private void transfer(
            HttpURLConnection connection,
            File partFile,
            boolean append,
            long startBytes,
            long total,
            ProgressListener listener)
            throws IOException, ScoutModelDownloadException {
        long written = append ? startBytes : 0L;
        long lastNotified = -1L;
        byte[] buffer = new byte[BUFFER_BYTES];

        try (InputStream in = connection.getInputStream();
                FileOutputStream out = new FileOutputStream(partFile, append)) {
            int read;
            while ((read = in.read(buffer)) != -1) {
                if (cancelled) {
                    throw new ScoutModelDownloadException("Model download cancelled.");
                }
                out.write(buffer, 0, read);
                written += read;
                if (listener != null && written - lastNotified >= PROGRESS_STEP_BYTES) {
                    listener.onProgress(written, total);
                    lastNotified = written;
                }
            }
            out.getFD().sync();
        }
        if (listener != null) {
            listener.onProgress(written, total);
        }
    }

    private void finalizeAndVerify(File partFile, File finalFile)
            throws ScoutModelDownloadException {
        if (finalFile.exists() && !finalFile.delete()) {
            throw new ScoutModelDownloadException("Could not replace existing model file.");
        }
        if (!partFile.renameTo(finalFile)) {
            throw new ScoutModelDownloadException("Could not move downloaded model into place.");
        }
        try {
            if (!store.verify()) {
                // Fail-closed: a file that does not match the pinned checksum is
                // deleted so it can never be loaded or reported ready.
                if (!finalFile.delete()) {
                    finalFile.deleteOnExit();
                }
                throw new ScoutModelDownloadException(
                        "Downloaded model failed checksum verification and was discarded.");
            }
        } catch (IOException e) {
            throw new ScoutModelDownloadException(
                    "Model verification IO error: " + e.getMessage(), e);
        }
    }

    private void ensureFreeSpace(File targetDir, long expectedSize, long alreadyOnDisk)
            throws ScoutModelDownloadException {
        if (expectedSize <= 0L) {
            return; // size unknown — skip the precheck rather than guess.
        }
        long needed = expectedSize - alreadyOnDisk + FREE_SPACE_MARGIN_BYTES;
        if (needed <= 0L) {
            return;
        }
        StatFs stat = new StatFs(targetDir.getParentFile().getAbsolutePath());
        long free = stat.getAvailableBytes();
        if (free < needed) {
            throw new ScoutModelDownloadException(
                    "Not enough free storage for the model: need ~"
                            + (needed >> 20) + " MB more, have " + (free >> 20) + " MB free.");
        }
    }
}
