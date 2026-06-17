package com.hoggcountry.trailassistant.scout;

import android.content.Context;
import android.util.Log;
import java.io.File;
import java.lang.reflect.Method;

/**
 * On-device Gemma engine backed by MediaPipe LLM Inference (tasks-genai), which
 * runs Gemma .task/.litertlm weights locally via LiteRT. No paid/cloud APIs:
 * inference happens entirely on the phone.
 *
 * <p>This class talks to the runtime by reflection rather than direct imports, so
 * it compiles whether or not {@code com.google.mediapipe:tasks-genai} is on the
 * classpath. That keeps {@code npm run android:debug-apk} green while the
 * dependency stays commented out in {@code app/build.gradle}, yet leaves a real
 * swap point ready. The engine only goes live when BOTH are true:
 *
 * <ol>
 *   <li>the tasks-genai dependency is enabled (so the runtime classes resolve), and</li>
 *   <li>a checksum-verified model file is present on the device
 *       ({@link ScoutModelStore} reports {@code state == "ready"}).</li>
 * </ol>
 *
 * <p>Otherwise {@link #tryCreate(Context)} returns {@code null} and
 * {@link ScoutGemmaPlugin} falls back to the fail-closed
 * {@link UnavailableScoutGemmaEngine}. Generation never fabricates output: any
 * runtime failure surfaces as {@link ScoutGemmaUnavailableException}.
 *
 * <p>The MediaPipe API surface is version-dependent; the reflected names below
 * match tasks-genai 0.10.x. If a future version renames them, reflection fails
 * fast and the engine degrades to the stub rather than crashing.
 */
public final class MediaPipeScoutGemmaEngine implements ScoutGemmaEngine {
    private static final String TAG = "ScoutGemma";
    private static final String LLM_INFERENCE =
            "com.google.mediapipe.tasks.genai.llminference.LlmInference";
    private static final String LLM_INFERENCE_OPTIONS =
            "com.google.mediapipe.tasks.genai.llminference.LlmInference$LlmInferenceOptions";

    private final Object llmInference;
    private final Method generateResponse;
    private final ScoutGemmaModelInfo modelInfo;

    private MediaPipeScoutGemmaEngine(
            Object llmInference, Method generateResponse, ScoutGemmaModelInfo modelInfo) {
        this.llmInference = llmInference;
        this.generateResponse = generateResponse;
        this.modelInfo = modelInfo;
    }

    /**
     * Loads the MediaPipe runtime against the verified on-device model, or returns
     * {@code null} (never throws) so the plugin can fall back to the stub.
     */
    static ScoutGemmaEngine tryCreate(Context context) {
        try {
            ScoutModelStore store = new ScoutModelStore(context);
            ScoutModelStatus status = store.getStatus();
            if (!ScoutModelStatus.READY.equals(status.status)) {
                // Fail-closed: never load an unverified or absent model file.
                return null;
            }
            File modelFile = store.modelFile();
            if (!modelFile.isFile()) {
                return null;
            }

            Class<?> optionsClass = Class.forName(LLM_INFERENCE_OPTIONS);
            Class<?> inferenceClass = Class.forName(LLM_INFERENCE);

            Object builder = optionsClass.getMethod("builder").invoke(null);
            builder = builder.getClass()
                    .getMethod("setModelPath", String.class)
                    .invoke(builder, modelFile.getAbsolutePath());
            try {
                builder = builder.getClass()
                        .getMethod("setMaxTokens", int.class)
                        .invoke(builder, UnavailableScoutGemmaEngine.TARGET_MODEL.maxContextTokens);
            } catch (NoSuchMethodException versionDependent) {
                // setMaxTokens is optional / renamed in some versions — engine still loads.
            }
            Object options = builder.getClass().getMethod("build").invoke(builder);

            Object llm = inferenceClass
                    .getMethod("createFromOptions", Context.class, optionsClass)
                    .invoke(null, context, options);

            Method generate = inferenceClass.getMethod("generateResponse", String.class);

            return new MediaPipeScoutGemmaEngine(
                    llm, generate, UnavailableScoutGemmaEngine.TARGET_MODEL);
        } catch (ClassNotFoundException dependencyDisabled) {
            // Expected in the default build: tasks-genai is commented out.
            return null;
        } catch (Throwable failure) {
            Log.w(TAG, "MediaPipe Gemma engine unavailable: " + failure.getMessage());
            return null;
        }
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public ScoutGemmaModelInfo describeModel() {
        return modelInfo;
    }

    @Override
    public GenerateResult generate(String prompt, String systemContext, int maxTokens)
            throws ScoutGemmaUnavailableException {
        // Per-call maxTokens is not yet plumbed: tasks-genai caps tokens once via
        // setMaxTokens at creation, and generateResponse(String) exposes no truncation
        // flag, so truncated is always false. See SCOUT_GEMMA_BRIDGE.md "Known gaps".
        String input = (systemContext == null || systemContext.isEmpty())
                ? prompt
                : systemContext + "\n\n" + prompt;
        try {
            Object output = generateResponse.invoke(llmInference, input);
            String text = output == null ? "" : output.toString();
            return new GenerateResult(text, false);
        } catch (Throwable failure) {
            throw new ScoutGemmaUnavailableException(
                    "On-device Gemma generation failed: " + failure.getMessage());
        }
    }
}
