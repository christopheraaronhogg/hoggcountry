package com.hoggcountry.trailassistant.scout

import android.content.Context
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
import com.google.ai.edge.litertlm.MessageCallback
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * On-device Gemma 4 engine backed by LiteRT-LM
 * ([com.google.ai.edge.litertlm]), Google's cross-platform on-device LLM
 * runtime. Inference runs entirely on the phone — no paid/cloud model APIs.
 *
 * This is the single chosen runtime for the unified (Android + future iOS)
 * Scout engine; the iOS Swift plugin mirrors this same `ScoutGemmaEngine`
 * contract against the LiteRT-LM Swift API and the same `.litertlm` model file.
 *
 * Fail-closed by construction. [tryCreate] returns `null` (never throws) unless
 * [ScoutModelStore] reports a checksum-verified model on the device, so the
 * plugin falls back to [UnavailableScoutGemmaEngine] and Gemma-only builds block
 * chat instead of fabricating output or drifting to a cloud model. The heavy
 * [Engine.initialize] call (seconds) is deferred to the first [generate] so app
 * start is never blocked; [ScoutGemmaPlugin] already runs generation off the
 * main thread.
 */
class LiteRtScoutGemmaEngine private constructor(
    private val modelPath: String,
    private val cacheDir: String,
    private val modelInfo: ScoutGemmaModelInfo
) : ScoutGemmaEngine {

    // Guarded by synchronized(this) for both lazy init and close().
    private var engine: Engine? = null

    override fun isAvailable(): Boolean = true

    override fun describeModel(): ScoutGemmaModelInfo = modelInfo

    /**
     * Eagerly run the costly [Engine.initialize] so the first real chat turn is
     * fast and doesn't risk the cold GPU/CPU-delegate init failing under the
     * user's first message. Best-effort and never throws — if warm-up fails the
     * engine stays null and the next [generate] retries init exactly as before.
     */
    override fun warmUp() {
        try {
            ensureEngine()
        } catch (failure: Throwable) {
            Log.w(TAG, "Engine warm-up failed (will retry on first generate): ${failure.message}")
        }
    }

    @Throws(ScoutGemmaUnavailableException::class)
    override fun generate(
        prompt: String,
        systemContext: String?,
        maxTokens: Int,
        sink: ScoutGemmaEngine.TokenSink?
    ): ScoutGemmaEngine.GenerateResult {
        val input = if (systemContext.isNullOrEmpty()) prompt else "$systemContext\n\n$prompt"
        try {
            val active = ensureEngine()
            // A fresh conversation per call keeps turns independent and releases
            // native resources deterministically (Conversation is Closeable).
            active.createConversation().use { conversation ->
                val full = StringBuilder()
                val failure = arrayOfNulls<Throwable>(1)
                val done = CountDownLatch(1)
                // Stream tokens as they are produced. onMessage delivers
                // incremental Content parts; we forward each text chunk to the
                // sink and accumulate the full answer to return.
                conversation.sendMessageAsync(
                    input,
                    object : MessageCallback {
                        override fun onMessage(message: Message) {
                            val chunk = message.contents.contents
                                .filterIsInstance<Content.Text>()
                                .joinToString("") { it.text }
                            if (chunk.isNotEmpty()) {
                                full.append(chunk)
                                sink?.onToken(chunk)
                            }
                        }

                        override fun onDone() {
                            done.countDown()
                        }

                        override fun onError(t: Throwable) {
                            failure[0] = t
                            done.countDown()
                        }
                    },
                    emptyMap<String, Any>()
                )
                // Bounded wait: if the native runtime wedges and never calls
                // onDone/onError, fail honestly instead of blocking the single
                // inference thread (and every later turn) forever. Exiting the
                // `use` block closes the Conversation, aborting the in-flight call.
                val completed = done.await(GENERATE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                if (!completed) {
                    throw ScoutGemmaUnavailableException(
                        "On-device Gemma timed out after ${GENERATE_TIMEOUT_SECONDS}s — give it a moment and try again."
                    )
                }
                failure[0]?.let { throw it }

                val text = full.toString()
                if (text.isBlank()) {
                    // Diagnostic: engine ran but produced no Content.Text.
                    // `adb logcat -s ScoutGemma:*` surfaces this.
                    Log.w(TAG, "Gemma stream produced no text parts")
                }
                return ScoutGemmaEngine.GenerateResult(text, false)
            }
        } catch (alreadyHonest: ScoutGemmaUnavailableException) {
            // Preserve the specific message (e.g. timeout) — don't re-wrap it.
            throw alreadyHonest
        } catch (oom: OutOfMemoryError) {
            // The model needs substantial RAM. Surface an honest device-capability
            // message and drop the engine so a retry starts clean. Never fabricate.
            Log.w(TAG, "Out of memory running on-device model", oom)
            close()
            throw ScoutGemmaUnavailableException(
                "Not enough free memory to run the on-device model on this device."
            )
        } catch (failure: Throwable) {
            // Never fabricate output: any runtime failure surfaces as unavailable.
            throw ScoutGemmaUnavailableException(
                "On-device Gemma generation failed: ${failure.message}"
            )
        }
    }

    /**
     * Releases the native [Engine] if one has been initialized. Safe to call
     * multiple times; subsequent calls are no-ops. Called by [ScoutGemmaPlugin]
     * when swapping engines or when the plugin is destroyed.
     */
    override fun close() {
        synchronized(this) {
            engine?.close()
            engine = null
        }
    }

    @Synchronized
    private fun ensureEngine(): Engine {
        engine?.let { return it }
        // Auto-select the fastest backend the device supports, silently: try the
        // GPU accelerator first (far faster than CPU on capable chips), fall back
        // to CPU if the GPU delegate can't initialize. Free (no bigger download),
        // so it is never a user choice in the default flow; an advanced override
        // can force a specific backend later.
        var lastError: Throwable? = null
        for (textBackend in listOf(Backend.GPU(), Backend.CPU())) {
            try {
                Log.i(TAG, "Initializing LiteRT-LM engine on ${textBackend.name} backend (can take seconds)")
                // Only the text backend is accelerated. The model constrains its
                // audio backend to CPU (and we use no audio/vision in Scout chat),
                // so forcing GPU on those slots fails engine creation outright.
                val config = EngineConfig(
                    modelPath = modelPath,
                    backend = textBackend,
                    visionBackend = Backend.CPU(),
                    audioBackend = Backend.CPU(),
                    maxNumTokens = minOf(modelInfo.maxContextTokens, RUNTIME_MAX_NUM_TOKENS),
                    maxNumImages = null,
                    cacheDir = cacheDir
                )
                val created = Engine(config)
                created.initialize()
                Log.i(TAG, "LiteRT-LM engine initialized on ${textBackend.name}")
                engine = created
                return created
            } catch (failure: Throwable) {
                lastError = failure
                Log.w(TAG, "Backend ${textBackend.name} unavailable (${failure.message}); trying next.")
            }
        }
        throw lastError ?: IllegalStateException("No usable LiteRT-LM backend available")
    }

    companion object {
        private const val TAG = "ScoutGemma"
        private const val RUNTIME_MAX_NUM_TOKENS = 32_768

        // Upper bound for a single on-device generation. Generous enough for a
        // long answer on a slow device, but bounded so a wedged native callback
        // can't hang the inference thread (and all later turns) indefinitely.
        private const val GENERATE_TIMEOUT_SECONDS = 120L

        /**
         * Loads the LiteRT-LM engine against the verified on-device model, or
         * returns `null` (never throws) so the plugin can fall back to the stub.
         * Cheap: only inspects model status and constructs the engine wrapper —
         * the costly [Engine.initialize] runs lazily on first generate.
         */
        @JvmStatic
        fun tryCreate(context: Context): ScoutGemmaEngine? {
            return try {
                val store = ScoutModelStore(context)
                val status = store.getStatus()
                if (ScoutModelStatus.READY != status.state) {
                    // Fail-closed: never load an unverified or absent model file.
                    return null
                }
                val modelFile = store.modelFile()
                if (!modelFile.isFile) {
                    return null
                }
                LiteRtScoutGemmaEngine(
                    modelFile.absolutePath,
                    context.cacheDir.absolutePath,
                    UnavailableScoutGemmaEngine.TARGET_MODEL
                )
            } catch (failure: Throwable) {
                Log.w(TAG, "LiteRT-LM Gemma engine unavailable: ${failure.message}")
                null
            }
        }
    }
}
