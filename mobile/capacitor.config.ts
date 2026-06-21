import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.hoggcountry.trailassistant',
	appName: 'Hoggcountry',
	webDir: 'build',
	server: {
		androidScheme: 'https'
	}
};

export default config;
