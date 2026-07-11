package com.hoggcountry.trailassistant.scout;

import android.Manifest;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.util.JsonReader;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(
        name = "ScoutGemma",
        permissions = {
                @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
        })
public class ScoutGemmaPlugin extends Plugin {

    /**
     * volatile: the field is read on the Capacitor thread and on the inference
     * executor, and written on the model-download bus callback (worker thread of
     * {@link ScoutModelDownloadService}). The additional synchronization in
     * {@link #getEngine()} and the bus {@code onComplete} swap guards the lazy-init
     * and swap sequences; volatile ensures cross-thread visibility between them.
     */
    private volatile ScoutGemmaEngine engine;

    private ScoutModelStore modelStore;

    // On-device generation (and the lazy first-call model load, which takes
    // seconds) must run off the Capacitor thread or it risks an ANR.
    private final ExecutorService inference = Executors.newSingleThreadExecutor();

    /**
     * Fail-fast single-turn guard. The executor alone only serializes calls, which
     * silently queues duplicate asks and lets their global token listeners overlap.
     * Rejecting the second call keeps one request/one token stream invariant.
     */
    private final AtomicBoolean generationInProgress = new AtomicBoolean(false);

    /**
     * Guards lazy creation in {@link #getEngine()} and the engine swap on download
     * completion so they cannot double-init or leave a window where a caller sees a
     * partially-initialized engine.
     */
    private final Object engineLock = new Object();

    /**
     * Bridges {@link ScoutModelDownloadService} (which owns the transfer and
     * outlives this plugin) to JS while the plugin is alive. The download itself is
     * NOT tied to this plugin's lifecycle — that is the whole point of the
     * foreground service — so terminal state arrives here as events, and on cold
     * start the model is reconciled from {@link ScoutModelStore#getStatus()}.
     */
    private final ScoutModelDownloadBus.Listener downloadListener = new ScoutModelDownloadBus.Listener() {
        @Override
        public void onProgress(long bytesDownloaded, long totalBytes) {
            JSObject progress = new JSObject();
            progress.put("bytesDownloaded", bytesDownloaded);
            progress.put("totalBytes", totalBytes);
            notifyListeners("scoutModelDownloadProgress", progress);
        }

        @Override
        public void onComplete(long totalBytes) {
            // Model is on device and verified — swap in a fresh engine so the next
            // isAvailable()/generate() picks it up without an app restart.
            //
            // Invariant: no engine may be closed while a generate() is using it.
            // We satisfy this by queuing the close() on the same single-thread
            // inference executor that generate() runs on. Because the executor is
            // single-threaded, close() cannot execute until any in-flight generate()
            // has returned — the happens-before relationship is guaranteed by the
            // executor's FIFO ordering. The engineLock swap is still done here (on
            // the download thread) so that getEngine() callers immediately see the
            // new engine; only the teardown of the OLD engine is deferred.
            final ScoutGemmaEngine previous;
            synchronized (engineLock) {
                previous = engine;
                engine = createEngine();
            }
            if (previous != null) {
                inference.execute(previous::close);
            }
            notifyListeners("scoutModelDownloadComplete", getModelStore().getStatus().toJSObject());
        }

        @Override
        public void onError(String message) {
            JSObject error = new JSObject();
            error.put("message", message != null ? message : "Model download failed.");
            notifyListeners("scoutModelDownloadError", error);
        }

        @Override
        public void onCancelled() {
            notifyListeners("scoutModelDownloadCancelled", new JSObject());
        }
    };

    @Override
    public void load() {
        modelStore = new ScoutModelStore(getContext());
        engine = createEngine();
        ScoutModelDownloadBus.get().register(downloadListener);
    }

    /**
     * Cleans up UI-bound resources when the Capacitor plugin is destroyed (activity
     * finish, process reclaim). Critically it does NOT cancel an in-flight model
     * download — that is owned by {@link ScoutModelDownloadService} so it survives
     * the app being backgrounded or the Activity being destroyed.
     */
    @Override
    protected void handleOnDestroy() {
        ScoutModelDownloadBus.get().unregister(downloadListener);
        final ScoutGemmaEngine currentEngine;
        synchronized (engineLock) {
            currentEngine = engine;
            engine = null;
        }
        if (currentEngine != null && generationInProgress.get()) {
            currentEngine.cancelGeneration();
        }
        // Close on the inference executor so teardown happens-AFTER any in-flight
        // generate() (FIFO order), never freeing the native engine mid-call.
        // Use shutdown() (graceful) rather than shutdownNow(): the latter would
        // interrupt a running native call and leak/crash. Queued close still runs.
        if (currentEngine != null) {
            inference.execute(currentEngine::close);
        }
        inference.shutdown();
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        ScoutGemmaEngine currentEngine = getEngine();
        JSObject result = new JSObject();
        result.put("available", currentEngine.isAvailable());
        result.put("runtimeReady", currentEngine.isRuntimeReady());
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
        result.put("runtimeReady", getEngine().isRuntimeReady());
        result.put("tier", modelInfo.tier);
        result.put("modelId", modelInfo.modelId);
        result.put("maxContextTokens", modelInfo.maxContextTokens);
        call.resolve(result);
    }

    @PluginMethod
    public void generate(PluginCall call) {
        String prompt = call.getString("prompt", "");
        String systemContext = call.getString("systemContext", "");
        int maxTokens = Math.max(1, call.getInt("maxTokens", 512));
        String requestId = call.getCallbackId();

        if (prompt == null || prompt.trim().isEmpty()) {
            rejectGeneration(call, "SCOUT_INVALID_PROMPT", "Scout needs a non-empty prompt.", requestId, false);
            return;
        }
        if (!generationInProgress.compareAndSet(false, true)) {
            rejectGeneration(
                    call,
                    "SCOUT_GENERATION_BUSY",
                    "Scout is already answering another question.",
                    requestId,
                    true);
            return;
        }

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
                                    emitToken(requestId, buffer.toString());
                                    buffer.setLength(0);
                                    lastEmit[0] = now;
                                }
                            }
                        });
                synchronized (buffer) {
                    if (buffer.length() > 0) {
                        emitToken(requestId, buffer.toString());
                    }
                }
                JSObject result = new JSObject();
                result.put("text", generated.text);
                result.put("truncated", generated.truncated);
                result.put("requestId", requestId);
                call.resolve(result);
            } catch (ScoutGemmaUnavailableException exception) {
                String message = exception.getMessage() != null
                        ? exception.getMessage()
                        : "On-device Gemma generation failed.";
                String code = message.contains("timed out")
                        ? "SCOUT_GENERATION_TIMEOUT"
                        : message.contains("cancelled")
                                ? "SCOUT_GENERATION_CANCELLED"
                                : "SCOUT_GENERATION_UNAVAILABLE";
                rejectGeneration(call, code, message, requestId, !message.contains("cancelled"));
            } catch (Throwable failure) {
                rejectGeneration(
                        call,
                        "SCOUT_GENERATION_FAILED",
                        "On-device Gemma generation failed: "
                                + (failure.getMessage() != null
                                        ? failure.getMessage()
                                        : failure.getClass().getSimpleName()),
                        requestId,
                        true);
            } finally {
                generationInProgress.set(false);
            }
        });
    }

    private void emitToken(String requestId, String text) {
        JSObject event = new JSObject();
        event.put("requestId", requestId);
        event.put("text", text);
        notifyListeners("scoutGenerateToken", event);
    }

    private void rejectGeneration(
            PluginCall call,
            String code,
            String message,
            String requestId,
            boolean retryable) {
        JSObject data = new JSObject();
        data.put("requestId", requestId);
        data.put("retryable", retryable);
        data.put("runtimeReady", getEngine().isRuntimeReady());
        call.reject(message, code, data);
    }

    /**
     * Eagerly initializes the on-device engine off the Capacitor thread so the
     * first chat turn doesn't carry the heavy (and occasionally flaky) lazy
     * LiteRT init. The promise resolves only after initialization succeeds, so
     * {@code warmed:true} is a real runtime-readiness signal rather than a queued
     * work acknowledgement.
     */
    @PluginMethod
    public void warmUp(PluginCall call) {
        inference.execute(() -> {
            try {
                boolean warmed = getEngine().warmUp();
                JSObject result = new JSObject();
                result.put("warmed", warmed && getEngine().isRuntimeReady());
                result.put("runtimeReady", getEngine().isRuntimeReady());
                result.put("available", getEngine().isAvailable());
                call.resolve(result);
            } catch (ScoutGemmaUnavailableException failure) {
                JSObject data = new JSObject();
                data.put("runtimeReady", getEngine().isRuntimeReady());
                data.put("available", getEngine().isAvailable());
                call.reject(
                        failure.getMessage() != null
                                ? failure.getMessage()
                                : "On-device Gemma warm-up failed.",
                        "SCOUT_WARMUP_FAILED",
                        data);
            }
        });
    }

    /** Cancels the active native generation immediately (never queued behind it). */
    @PluginMethod
    public void cancelGeneration(PluginCall call) {
        boolean active = generationInProgress.get();
        boolean signalled = active && getEngine().cancelGeneration();
        JSObject result = new JSObject();
        result.put("cancelled", signalled);
        result.put("active", active);
        call.resolve(result);
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
     * Starts the model download in a foreground service and resolves immediately —
     * the transfer is deliberately decoupled from this call's lifetime so it
     * survives the user leaving the app. Progress and the terminal outcome arrive
     * as events ({@code scoutModelDownloadProgress} / {@code …Complete} /
     * {@code …Error} / {@code …Cancelled}); JS resolves its own promise on those.
     */
    @PluginMethod
    public void startModelDownload(PluginCall call) {
        ScoutModelStatus status = getModelStore().getStatus();
        if (ScoutModelStatus.READY.equals(status.state)) {
            // Already downloaded + verified; nothing to start.
            JSObject result = status.toJSObject();
            result.put("started", false);
            call.resolve(result);
            return;
        }
        if (!status.downloadConfigured) {
            call.reject("No model download endpoint is configured for this build.");
            return;
        }
        ScoutModelDownloadService.start(getContext());
        JSObject result = status.toJSObject();
        result.put("started", true);
        call.resolve(result);
    }

    @PluginMethod
    public void cancelModelDownload(PluginCall call) {
        boolean wasActive = ScoutModelDownloadBus.get().isActive();
        ScoutModelDownloadService.cancel(getContext());
        JSObject result = new JSObject();
        result.put("cancelled", wasActive);
        call.resolve(result);
    }

    /**
     * Reports whether a download is in flight and its last known progress so the JS
     * layer can re-attach its progress UI after the app returns to the foreground
     * (the transfer may have continued — or finished — while the WebView was gone).
     */
    @PluginMethod
    public void getDownloadState(PluginCall call) {
        ScoutModelDownloadBus bus = ScoutModelDownloadBus.get();
        JSObject result = new JSObject();
        result.put("active", bus.isActive());
        result.put("bytesDownloaded", bus.lastBytes());
        result.put("totalBytes", bus.lastTotal());
        call.resolve(result);
    }

    /**
     * Reports the active network so JS can be Wi-Fi-aware before kicking off a
     * multi-GB download: {@code connected}, {@code metered} (cellular / hotspot),
     * and a coarse {@code type}. No network IO — reads ConnectivityManager state.
     */
    @PluginMethod
    public void getNetworkStatus(PluginCall call) {
        JSObject result = new JSObject();
        boolean connected = false;
        boolean metered = true;
        String type = "none";

        ConnectivityManager cm =
                (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            Network active = cm.getActiveNetwork();
            NetworkCapabilities caps = active != null ? cm.getNetworkCapabilities(active) : null;
            if (caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
                connected = true;
                metered = !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED);
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                    type = "wifi";
                } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                    type = "cellular";
                } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                    type = "ethernet";
                } else {
                    type = "other";
                }
            }
        }
        result.put("connected", connected);
        result.put("metered", metered);
        result.put("type", type);
        call.resolve(result);
    }

    @PluginMethod
    public void getInstallSource(PluginCall call) {
        JSObject result = new JSObject();
        boolean debugBuild =
                (getContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        String installerPackage = null;
        try {
            PackageManager packageManager = getContext().getPackageManager();
            String packageName = getContext().getPackageName();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                installerPackage =
                        packageManager.getInstallSourceInfo(packageName).getInstallingPackageName();
            } else {
                installerPackage = packageManager.getInstallerPackageName(packageName);
            }
        } catch (Exception ignored) {
            installerPackage = null;
        }

        result.put("type", installSourceType(debugBuild, installerPackage));
        result.put("platform", "android");
        result.put("detectedBy", "android-package-manager");
        result.put("installerPackage", installerPackage);
        result.put("debugBuild", debugBuild);
        String sourceBuild = bundledSourceBuild();
        if (sourceBuild != null) {
            result.put("sourceBuild", sourceBuild);
        }
        call.resolve(result);
    }

    /**
     * Reads the fingerprint from the APK asset itself, not through the WebView.
     * A previous service worker can briefly control the first launch after an app
     * update, so fetching /app-version.json from JS is not safe proof identity.
     */
    private String bundledSourceBuild() {
        try (InputStream input = getContext().getAssets().open("public/app-version.json");
                JsonReader reader = new JsonReader(
                        new InputStreamReader(input, StandardCharsets.UTF_8))) {
            reader.beginObject();
            while (reader.hasNext()) {
                String name = reader.nextName();
                if ("sourceBuild".equals(name)) {
                    String value = reader.nextString();
                    return value != null && !value.trim().isEmpty() ? value.trim() : null;
                }
                reader.skipValue();
            }
        } catch (IOException | IllegalStateException ignored) {
            // Fail closed in JS: no native fingerprint means no persisted proof.
        }
        return null;
    }

    /**
     * Reports whether the OS will let us show the download-progress notification.
     * On API &lt; 33 notifications need no runtime grant, so this is always granted.
     */
    @PluginMethod
    public void checkNotificationsPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasNotificationsPermission());
        call.resolve(result);
    }

    /**
     * Requests POST_NOTIFICATIONS (API 33+) so the background download shows a
     * progress notification. Denial is non-fatal — the foreground service still
     * runs and keeps the transfer alive; the user just loses the OS progress chip
     * (in-app progress still updates while the app is open).
     */
    @PluginMethod
    public void requestNotificationsPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || hasNotificationsPermission()) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationsPermissionCallback");
    }

    @PermissionCallback
    private void notificationsPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasNotificationsPermission());
        call.resolve(result);
    }

    private boolean hasNotificationsPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return true;
        }
        return getPermissionState("notifications") == PermissionState.GRANTED;
    }

    private String installSourceType(boolean debugBuild, String installerPackage) {
        if (debugBuild) {
            return "debug";
        }
        if (installerPackage == null || installerPackage.trim().isEmpty()) {
            return "unknown";
        }
        if ("com.android.vending".equals(installerPackage)) {
            return "google-play";
        }
        return "android-installer";
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
