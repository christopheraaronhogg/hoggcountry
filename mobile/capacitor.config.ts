import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.hoggcountry.trailassistant',
	appName: 'Trail Assistant',
	webDir: 'build',
	server: {
		androidScheme: 'https'
	}
};

export default config;
