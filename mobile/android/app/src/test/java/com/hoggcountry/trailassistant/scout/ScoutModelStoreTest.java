package com.hoggcountry.trailassistant.scout;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.nio.file.Files;
import java.security.MessageDigest;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class ScoutModelStoreTest {
    @Rule public TemporaryFolder temporary = new TemporaryFolder();

    @Test
    public void verifiedMarkerIsBoundToExpectedChecksum() throws Exception {
        File filesDir = temporary.newFolder("files-checksum");
        byte[] modelBytes = "verified-model".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        ScoutModelSpec original = spec("gemma-a", modelBytes.length, sha256(modelBytes));
        ScoutModelStore store = new ScoutModelStore(filesDir, original);
        store.ensureModelDir();
        Files.write(store.modelFile().toPath(), modelBytes);

        assertTrue(store.verify());
        assertEquals(ScoutModelStatus.READY, store.getStatus().state);

        ScoutModelSpec changedManifest = spec(
                "gemma-a", modelBytes.length, "0000000000000000000000000000000000000000000000000000000000000000");
        ScoutModelStore changedStore = new ScoutModelStore(filesDir, changedManifest);
        assertEquals(ScoutModelStatus.PRESENT_UNVERIFIED, changedStore.getStatus().state);
    }

    @Test
    public void verifiedMarkerIsBoundToModelId() throws Exception {
        File filesDir = temporary.newFolder("files-id");
        byte[] modelBytes = "same-file".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String checksum = sha256(modelBytes);
        ScoutModelStore store = new ScoutModelStore(
                filesDir, spec("gemma-original", modelBytes.length, checksum));
        store.ensureModelDir();
        Files.write(store.modelFile().toPath(), modelBytes);

        assertTrue(store.verify());
        ScoutModelStore changedStore = new ScoutModelStore(
                filesDir, spec("gemma-replacement", modelBytes.length, checksum));
        assertEquals(ScoutModelStatus.PRESENT_UNVERIFIED, changedStore.getStatus().state);
    }

    private static ScoutModelSpec spec(String modelId, long bytes, String checksum) {
        return new ScoutModelSpec(modelId, "model.litertlm", bytes, checksum, null);
    }

    private static String sha256(byte[] bytes) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
        StringBuilder result = new StringBuilder(digest.length * 2);
        for (byte value : digest) {
            result.append(String.format(java.util.Locale.ROOT, "%02x", value & 0xff));
        }
        return result.toString();
    }
}
