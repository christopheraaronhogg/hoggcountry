package com.hoggcountry.trailassistant.scout;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.hoggcountry.trailassistant.BuildConfig;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class ScoutGemmaModelStore {
    public static final String MODEL_ID = "gemma-4-E2B-it-litert-lm";
    private static final String MODEL_FILE_NAME = MODEL_ID + ".litertlm";

    private final Context context;

    public ScoutGemmaModelStore(Context context) {
        this.context = context.getApplicationContext();
    }

    public File modelFile() {
        return new File(new File(context.getFilesDir(), "models"), MODEL_FILE_NAME);
    }

    public JSObject getStatus() {
        File file = modelFile();
        boolean downloadConfigured = !BuildConfig.SCOUT_GEMMA_MODEL_URL.isEmpty();
        boolean checksumConfigured = !BuildConfig.SCOUT_GEMMA_MODEL_SHA256.isEmpty();
        long expectedBytes = BuildConfig.SCOUT_GEMMA_MODEL_BYTES;
        long bytesOnDevice = file.exists() ? file.length() : 0;

        JSObject status = baseStatus(file, downloadConfigured, checksumConfigured, expectedBytes, bytesOnDevice);

        if (!downloadConfigured) {
            status.put("state", "unconfigured");
            status.put("reason", "SCOUT_GEMMA_MODEL_URL is not configured for this build.");
            return status;
        }

        if (!file.exists()) {
            status.put("state", "needs_download");
            status.put("reason", "Gemma model file is not present on this device.");
            return status;
        }

        if (expectedBytes > 0 && bytesOnDevice != expectedBytes) {
            status.put("state", "invalid_size");
            status.put("reason", "Gemma model file size does not match the configured byte count.");
            return status;
        }

        if (checksumConfigured) {
            try {
                String actualSha256 = sha256(file);
                status.put("actualSha256", actualSha256);
                if (!actualSha256.equalsIgnoreCase(BuildConfig.SCOUT_GEMMA_MODEL_SHA256)) {
                    status.put("state", "invalid_checksum");
                    status.put("reason", "Gemma model SHA-256 does not match the configured checksum.");
                    return status;
                }
            } catch (IOException | NoSuchAlgorithmException exception) {
                status.put("state", "verification_failed");
                status.put("reason", exception.getMessage());
                return status;
            }

            status.put("state", "ready");
            return status;
        }

        status.put("state", "downloaded_unverified");
        status.put("reason", "Gemma model file exists, but SCOUT_GEMMA_MODEL_SHA256 is not configured.");
        return status;
    }

    public JSObject prepareDownload() {
        File modelDir = modelFile().getParentFile();
        if (modelDir != null && !modelDir.exists()) {
            modelDir.mkdirs();
        }
        return getStatus();
    }

    private JSObject baseStatus(
            File file,
            boolean downloadConfigured,
            boolean checksumConfigured,
            long expectedBytes,
            long bytesOnDevice) {
        JSObject status = new JSObject();
        status.put("modelId", MODEL_ID);
        status.put("fileName", MODEL_FILE_NAME);
        status.put("filePath", file.getAbsolutePath());
        status.put("downloadConfigured", downloadConfigured);
        status.put("checksumConfigured", checksumConfigured);
        status.put("expectedBytes", expectedBytes);
        status.put("bytesOnDevice", bytesOnDevice);
        return status;
    }

    private static String sha256(File file) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[1024 * 1024];
        try (DigestInputStream input = new DigestInputStream(new FileInputStream(file), digest)) {
            while (input.read(buffer) != -1) {
                // DigestInputStream updates the digest as bytes are read.
            }
        }

        StringBuilder hex = new StringBuilder();
        for (byte b : digest.digest()) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }
}
