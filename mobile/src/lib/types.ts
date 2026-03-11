export type Tab = 'Today' | 'Plan' | 'Coach' | 'Town' | 'Safety' | 'Account';

export interface Message {
	id: string;
	role: 'user' | 'coach';
	content: string;
	timestamp: Date;
}

export interface CheckIn {
	timestamp: Date;
	location: string;
	mile: number;
	status: 'safe' | 'tired' | 'emergency';
}

export interface PrivacySettings {
	stealthMode: boolean;
	locationSharing: boolean;
	allowCoachInsights: boolean;
}

export interface TrailSettings {
	autoLogMileage: boolean;
	waterSourceAlerts: boolean;
	batterySaver: boolean;
	offlineRegion: string;
}

export interface TrailState {
	activeTab: Tab;
	messages: Message[];
	lastCheckIn: CheckIn | null;
	privacySettings: PrivacySettings;
	trailSettings: TrailSettings;
	dailyGoal: number;
	completedMiles: number;
	nextWaterMile: number;
	onlineStatus: boolean;
	syncPending: boolean;
	userName: string;
	trailName: string;
}

