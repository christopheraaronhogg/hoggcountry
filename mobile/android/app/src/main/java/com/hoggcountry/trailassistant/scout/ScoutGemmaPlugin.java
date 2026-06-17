package com.hoggcountry.trailassistant.scout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ScoutGemma")
public class ScoutGemmaPlugin extends Plugin {

    /**
     * volatile: the field is read on the Capacitor thread and on the inference
     * executor, and written on the downloads executor. The additional
     * synchronization in {@link #getEngine()} and {@link #startModelDownload}
     * guards the lazy-init and swap sequences; volatile ensures cross-thread
     * visibility of the reference between those synchronized blocks.
     */
    private volatile ScoutGemmaEngine engine;

    private ScoutModelStore modelStore;

    // On-device generation (and the lazy first-call model load, which takes
    // seconds) must run off the Capacitor thread or it risks an ANR.
    private final ExecutorService inference = Executors.newSingleThreadExecutor();
    // The multi-GB model download runs on its own thread so it never blocks
    // (or is blocked by) generation.
    private final ExecutorService downloads = Executors.newSingleThreadExecutor();
    private volatile ScoutModelDownloader activeDownloader;

    /**
     * Guards lazy creation in {@link #getEngine()} and the engine swap in
     * {@link #startModelDownload} so they cannot double-init or leave a window
     * where a caller sees a partially-initialized engine.
     */
    private final Object engineLock = new Object();

    @Override
    public void load() {
        modelStore = new ScoutModelStore(getContext());
        engine = createEngine();
    }

    /**
     * Cleans up resources when the Capacitor plugin is destroyed (e.g. activity
     * finish, process reclaim). Cancels any in-progress download, shuts down both
     * executor services, and closes the current engine to release native resources.
     */
    @Override
    protected void handleOnDestroy() {
        ScoutModelDownloader downloader = activeDownloader;
        if (downloader != null) {
            downloader.cancel();
        }
        inference.shutdownNow();
        downloads.shutdownNow();
        ScoutGemmaEngine currentEngine;
        synchronized (engineLock) {
            currentEngine = engine;
        }
        if (currentEngine != null) {
            currentEngine.close();
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        ScoutGemmaEngine currentEngine = getEngine();
        JSObject result = new JSObject();
        result.put("available", currentEngine.isAvailable());
        if (!currentEngine.isAvailable()) {
            result.put("modelId", "gemma-4-not-installed");
            result.put("reason", "Gemma 4 LiteRT-LM runtime is not installed in this Android build.");
        }
        call.resolve(result);
    }

    @PluginMethod
    public void describeModel(PluginCall call) {
        ScoutGemmaModelInfo modelInfo = getEngine().describeModel();
        if (modelInfo == null) {
            JSObject result = new JSObject();
            result.put("available", false);
            result.put("modelId", "gemma-4-not-installed");
            result.put("reason", "Gemma 4 LiteRT-LM runtime is not installed in this Android build.");
            call.resolve(result);
            return;
        }

        JSObject result = new JSObject();
        result.put("available", getEngine().isAvailable());
        result.put("tier", modelInfo.tier);
        result.put("modelId", modelInfo.modelId);
        result.put("maxContextTokens", modelInfo.maxContextTokens);
        call.resolve(result);
    }

    @PluginMethod
    public void generate(PluginCall call) {
        String prompt = call.getString("prompt", "");
        String systemContext = call.getString("systemContext", "");
        int maxTokens = call.getInt("maxTokens", 512);

        inference.execute(() -> {
            final StringBuilder buffer = new StringBuilder();
            final long[] lastEmit = { 0L };
            try {
                // Stream to JS via the scoutGenerateToken event, COALESCED into
                // ~60ms batches. One event per raw token floods the bridge
                // (hundreds of crossings + UI re-renders for a single answer);
                // batched updates still read as smooth live typing.
                ScoutGemmaEngine.GenerateResult generated = getEngine().generate(
                        prompt, systemContext, maxTokens,
                        (chunk) -> {
                            synchronized (buffer) {
                                buffer.append(chunk);
                                long now = System.currentTimeMillis();
                                if (now - lastEmit[0] >= 60) {
                                    emitToken(buffer.toString());
                                    buffer.setLength(0);
                                    lastEmit[0] = now;
                                }
                            }
                        });
                synchronized (buffer) {
                    if (buffer.length() > 0) {
                        emitToken(buffer.toString());
                    }
                }
                JSObject result = new JSObject();
                result.put("text", generated.text);
                result.put("truncated", generated.truncated);
                call.resolve(result);
            } catch (ScoutGemmaUnavailableException exception) {
                call.reject(exception.getMessage());
            }
        });
    }

    private void emitToken(String text) {
        JSObject event = new JSObject();
        event.put("text", text);
        notifyListeners("scoutGenerateToken", event);
    }

    @PluginMethod
    public void getModelStatus(PluginCall call) {
        call.resolve(getModelStore().getStatus().toJSObject());
    }

    /**
     * Prepares for a model download: ensures the model directory exists and
     * returns the canonical status shape (same as {@link #getModelStatus}).
     * This is the contract surface that iOS/Android/TypeScript all share.
     */
    @PluginMethod
    public void prepareModelDownload(PluginCall call) {
        call.resolve(getModelStore().prepareDownload().toJSObject());
    }

    /**
     * Downloads + verifies the on-device model, streaming progress to JS via the
     * {@code scoutModelDownloadProgress} event. On success the engine is rebuilt
     * so {@code isAvailable()} flips to true without an app restart.
     *
     * <p>Engine swap is synchronized on {@link #engineLock} to prevent races with
     * concurrent calls to {@link #getEngine()}: the previous engine is captured,
     * the new one is installed, and then the old one is closed outside the lock so
     * close() cannot block inference.
     */
    @PluginMethod
    public void startModelDownload(PluginCall call) {
        downloads.execute(() -> {
            ScoutModelDownloader downloader = new ScoutModelDownloader(getContext());
            activeDownloader = downloader;
            try {
                ScoutModelStatus status = downloader.download((bytesDownloaded, totalBytes) -> {
                    JSObject progress = new JSObject();
                    progress.put("bytesDownloaded", bytesDownloaded);
                    progress.put("totalBytes", totalBytes);
                    notifyListeners("scoutModelDownloadProgress", progress);
                });
                // Model is on device and verified — swap in a fresh engine so the
                // next isAvailable()/generate() picks it up without an app restart.
                ScoutGemmaEngine previous;
                synchronized (engineLock) {
                    previous = engine;
                    engine = createEngine();
                }
                // Close the old engine outside the lock so close() cannot block
                // callers waiting for engineLock in getEngine().
                if (previous != null) {
                    previous.close();
                }
                call.resolve(status.toJSObject());
            } catch (ScoutModelDownloadException exception) {
                call.reject(exception.getMessage());
            } finally {
                activeDownloader = null;
            }
        });
    }

    @PluginMethod
    public void cancelModelDownload(PluginCall call) {
        ScoutModelDownloader downloader = activeDownloader;
        if (downloader != null) {
            downloader.cancel();
        }
        JSObject result = new JSObject();
        result.put("cancelled", downloader != null);
        call.resolve(result);
    }

    ScoutGemmaEngine createEngine() {
        ScoutGemmaEngine onDevice = LiteRtScoutGemmaEngine.tryCreate(getContext());
        return onDevice != null ? onDevice : new UnavailableScoutGemmaEngine();
    }

    /**
     * Returns the current engine, lazily creating it if null. Synchronized on
     * {@link #engineLock} to prevent a double-init race when multiple threads call
     * getEngine() concurrently before the first engine is assigned.
     */
    private ScoutGemmaEngine getEngine() {
        synchronized (engineLock) {
            if (engine == null) {
                engine = createEngine();
            }
            return engine;
        }
    }

    private ScoutModelStore getModelStore() {
        if (modelStore == null) {
            modelStore = new ScoutModelStore(getContext());
        }
        return modelStore;
    }
}
