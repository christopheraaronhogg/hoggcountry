package com.hoggcountry.trailassistant.scout;

/**
 * Thrown when the on-device Gemma engine cannot generate (no runtime / no
 * weights). The plugin maps this to a Capacitor reject. Never swallow this into
 * fabricated model output.
 */
public class ScoutGemmaUnavailableException extends Exception {
    public ScoutGemmaUnavailableException(String message) {
        super(message);
    }
}
