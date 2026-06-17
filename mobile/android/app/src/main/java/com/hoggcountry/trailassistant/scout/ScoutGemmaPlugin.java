package com.hoggcountry.trailassistant.scout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScoutGemma")
public class ScoutGemmaPlugin extends Plugin {
    private ScoutGemmaEngine engine;

    @Override
    public void load() {
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

        try {
            ScoutGemmaEngine.GenerateResult generated = getEngine().generate(prompt, systemContext, maxTokens);
            JSObject result = new JSObject();
            result.put("text", generated.text);
            result.put("truncated", generated.truncated);
            call.resolve(result);
        } catch (ScoutGemmaUnavailableException exception) {
            call.reject(exception.getMessage());
        }
    }

    ScoutGemmaEngine createEngine() {
        return new UnavailableScoutGemmaEngine();
    }

    private ScoutGemmaEngine getEngine() {
        if (engine == null) {
            engine = createEngine();
        }
        return engine;
    }
}
