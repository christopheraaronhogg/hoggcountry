package com.hoggcountry.trailassistant.scout

import android.content.Context
import android.util.Log
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig

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

    @Volatile
    private var engine: Engine? = null

    override fun isAvailable(): Boolean = true

    override fun describeModel(): ScoutGemmaModelInfo = modelInfo

    @Throws(ScoutGemmaUnavailableException::class)
    override fun generate(
        prompt: String,
        systemContext: String?,
        maxTokens: Int
    ): ScoutGemmaEngine.GenerateResult {
        val input = if (systemContext.isNullOrEmpty()) prompt else "$systemContext\n\n$prompt"
        try {
            val active = ensureEngine()
            // A fresh conversation per call keeps turns independent and releases
            // native resources deterministically (Conversation is Closeable).
            active.createConversation().use { conversation ->
                val message = conversation.sendMessage(input)
                // A LiteRT-LM Message carries a list of Content parts; pull the
                // text parts out and join them. Per-call maxTokens is not yet
                // plumbed, so truncation can't be detected -> truncated is always
                // false. See SCOUT_GEMMA_BRIDGE.md "Known gaps".
                val text = message.contents.contents
                    .filterIsInstance<Content.Text>()
                    .joinToString("") { it.text }
                return ScoutGemmaEngine.GenerateResult(text, false)
            }
        } catch (failure: Throwable) {
            // Never fabricate output: any runtime failure surfaces as unavailable.
            throw ScoutGemmaUnavailableException(
                "On-device Gemma generation failed: ${failure.message}"
            )
        }
    }

    @Synchronized
    private fun ensureEngine(): Engine {
        engine?.let { return it }
        val created = Engine(EngineConfig(modelPath = modelPath))
        created.initialize()
        engine = created
        return created
    }

    companion object {
        private const val TAG = "ScoutGemma"

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
                if (ScoutModelStatus.READY != status.status) {
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
