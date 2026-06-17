package com.hoggcountry.trailassistant;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.hoggcountry.trailassistant.scout.ScoutGemmaPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ScoutGemmaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
