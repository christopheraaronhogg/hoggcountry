package com.hoggcountry.trailassistant.scout;

/**
 * Raised by {@link ScoutModelDownloader} for any precondition, transfer, or
 * verification failure (including user cancellation). Mapped to a Capacitor
 * reject so the UI can surface an honest error and the model stays not-ready.
 */
public final class ScoutModelDownloadException extends Exception {
    public ScoutModelDownloadException(String message) {
        super(message);
    }

    public ScoutModelDownloadException(String message, Throwable cause) {
        super(message, cause);
    }
}
