package com.hoggcountry.trailassistant.scout;

import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Process-wide event bridge between {@link ScoutModelDownloadService} (which owns
 * the actual byte transfer and outlives the Activity/WebView) and
 * {@link ScoutGemmaPlugin} (which only exists while the app UI is alive).
 *
 * <p>Why a singleton bus instead of binding the service to the plugin: the whole
 * point of the foreground service is that the multi-GB download survives the user
 * leaving the app — at which point the plugin (and its {@code PluginCall}s) are
 * gone. The service therefore cannot hold a plugin reference. It publishes here;
 * whatever plugin instance is alive subscribes and forwards to JS. When no plugin
 * is subscribed the events are simply dropped (the ongoing notification is the
 * user-facing progress), and on next launch the plugin reconciles from
 * {@link #isActive()} + {@link ScoutModelStore#getStatus()}.
 *
 * <p>All methods are thread-safe: the service publishes from its worker thread,
 * the plugin registers/unregisters from the Capacitor thread.
 */
public final class ScoutModelDownloadBus {

    /** Terminal + progress callbacks. Implemented by the live plugin. */
    public interface Listener {
        void onProgress(long bytesDownloaded, long totalBytes);

        /** Model fully downloaded and checksum-verified (state READY). */
        void onComplete(long totalBytes);

        /** Download failed (transfer or verification). Carries a user-facing message. */
        void onError(String message);

        /** User-initiated cancel; a partial {@code .part} file is kept for resume. */
        void onCancelled();
    }

    private static final ScoutModelDownloadBus INSTANCE = new ScoutModelDownloadBus();

    public static ScoutModelDownloadBus get() {
        return INSTANCE;
    }

    private final CopyOnWriteArrayList<Listener> listeners = new CopyOnWriteArrayList<>();
    private final AtomicBoolean active = new AtomicBoolean(false);
    private volatile long lastBytes = 0L;
    private volatile long lastTotal = -1L;

    private ScoutModelDownloadBus() {}

    public void register(Listener listener) {
        if (listener != null) {
            listeners.addIfAbsent(listener);
        }
    }

    public void unregister(Listener listener) {
        if (listener != null) {
            listeners.remove(listener);
        }
    }

    /** True between {@link #markActive()} and any terminal publish. */
    public boolean isActive() {
        return active.get();
    }

    public long lastBytes() {
        return lastBytes;
    }

    public long lastTotal() {
        return lastTotal;
    }

    /** Called by the service when it begins (or resumes) a transfer. */
    public void markActive() {
        active.set(true);
    }

    public void publishProgress(long bytesDownloaded, long totalBytes) {
        lastBytes = bytesDownloaded;
        lastTotal = totalBytes;
        for (Listener listener : listeners) {
            listener.onProgress(bytesDownloaded, totalBytes);
        }
    }

    public void publishComplete(long totalBytes) {
        active.set(false);
        lastBytes = totalBytes;
        lastTotal = totalBytes;
        for (Listener listener : listeners) {
            listener.onComplete(totalBytes);
        }
    }

    public void publishError(String message) {
        active.set(false);
        for (Listener listener : listeners) {
            listener.onError(message);
        }
    }

    public void publishCancelled() {
        active.set(false);
        for (Listener listener : listeners) {
            listener.onCancelled();
        }
    }
}
