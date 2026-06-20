#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const configPath = join(process.cwd(), 'ios', 'App', 'App', 'capacitor.config.json');
const pluginClass = 'ScoutGemmaPlugin';

if (!existsSync(configPath)) {
	console.log('ScoutGemma iOS plugin registration skipped: ios/App/App/capacitor.config.json not found.');
	process.exit(0);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const list = Array.isArray(config.packageClassList) ? config.packageClassList : [];

if (!list.includes(pluginClass)) {
	config.packageClassList = [...list, pluginClass].sort();
	writeFileSync(configPath, `${JSON.stringify(config, null, '\t')}\n`);
	console.log(`Registered ${pluginClass} in ios/App/App/capacitor.config.json`);
} else {
	console.log(`${pluginClass} already registered in ios/App/App/capacitor.config.json`);
}
