package com.hoggcountry.trailassistant.scout;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class ScoutOutputBudgetTest {
    @Test
    public void approximatesFourUtf8BytesPerRequestedToken() {
        ScoutOutputBudget budget = new ScoutOutputBudget(2);

        assertEquals("abc", budget.take("abc"));
        assertFalse(budget.isTruncated());
        assertEquals("defgh", budget.take("defghij"));
        assertTrue(budget.isTruncated());
        assertEquals(8, budget.usedBytes());
        assertEquals("", budget.take("ignored"));
    }

    @Test
    public void neverSplitsAMultibyteCodePoint() {
        ScoutOutputBudget budget = new ScoutOutputBudget(1);

        assertEquals("éé", budget.take("ééé")); // two UTF-8 bytes each
        assertTrue(budget.isTruncated());
        assertEquals(4, budget.usedBytes());
    }

    @Test
    public void exactBoundaryIsNotCalledTruncatedUntilMoreOutputArrives() {
        ScoutOutputBudget budget = new ScoutOutputBudget(1);

        assertEquals("abcd", budget.take("abcd"));
        assertFalse(budget.isTruncated());
        assertEquals("", budget.take("e"));
        assertTrue(budget.isTruncated());
    }
}
