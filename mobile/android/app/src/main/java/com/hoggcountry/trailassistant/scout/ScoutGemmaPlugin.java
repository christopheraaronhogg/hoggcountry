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
    private ScoutGemmaEngine engine;
    private ScoutModelStore modelStore;
    // On-device generation (and the lazy first-call model load, which takes
    // seconds) must run off the Capacitor thread or it risks an ANR.
    private final ExecutorService inference = Executors.newSingleThreadExecutor();
    // The multi-GB model download runs on its own thread so it never blocks
    // (or is blocked by) generation.
    private final ExecutorService downloads = Executors.newSingleThreadExecutor();
    private volatile ScoutModelDownloader activeDownloader;

    @Override
    public void load() {
        modelStore = new ScoutModelStore(getContext());
        engine = createEngine();
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
            try {
                ScoutGemmaEngine.GenerateResult generated = getEngine().generate(prompt, systemContext, maxTokens);
                JSObject result = new JSObject();
                result.put("text", generated.text);
                result.put("truncated", generated.truncated);
                call.resolve(result);
            } catch (ScoutGemmaUnavailableException exception) {
                call.reject(exception.getMessage());
            }
        });
    }

    @PluginMethod
    public void getModelStatus(PluginCall call) {
        call.resolve(getModelStore().getStatus().toJSObject());
    }

    @PluginMethod
    public void prepareModelDownload(PluginCall call) {
        call.resolve(getModelStore().prepareDownload().toJSObject());
    }

    /**
     * Downloads + verifies the on-device model, streaming progress to JS via the
     * {@code scoutModelDownloadProgress} event. On success the engine is rebuilt
     * so {@code isAvailable()} flips to true without an app restart.
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
                // Model is on device and verified — rebuild the engine so the
                // next isAvailable()/generate() picks it up.
                engine = createEngine();
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

    private ScoutGemmaEngine getEngine() {
        if (engine == null) {
            engine = createEngine();
        }
        return engine;
    }

    private ScoutModelStore getModelStore() {
        if (modelStore == null) {
            modelStore = new ScoutModelStore(getContext());
        }
        return modelStore;
    }
}
