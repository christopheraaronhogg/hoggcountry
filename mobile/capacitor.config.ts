import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.hoggcountry.trailassistant',
	appName: 'Hoggcountry',
	webDir: 'build',
	server: {
		androidScheme: 'https',
		// Allow the offline-aware map to fetch OpenTopoMap basemap tiles when online.
		allowNavigation: ['*.tile.opentopomap.org', 'tile.opentopomap.org', '*.opentopomap.org']
	}
};

export default config;
