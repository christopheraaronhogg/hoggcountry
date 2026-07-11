package com.hoggcountry.trailassistant.scout;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class ScoutModelDownloaderTest {
    private static final long MIB = 1L << 20;
    private static final long GIB = 1L << 30;

    @Test
    public void usesAtLeast512MiBHeadroom() {
        assertEquals(2L * GIB + 512L * MIB, ScoutModelDownloader.requiredFreeBytes(2L * GIB, 0L));
        assertEquals(1L * GIB + 512L * MIB, ScoutModelDownloader.requiredFreeBytes(2L * GIB, 1L * GIB));
    }

    @Test
    public void usesFifteenPercentForLargeModels() {
        long tenGiB = 10L * GIB;
        long fifteenPercent = (long) Math.ceil(tenGiB * 0.15d);
        assertEquals(tenGiB + fifteenPercent, ScoutModelDownloader.requiredFreeBytes(tenGiB, 0L));
    }
}
