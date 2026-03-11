import { browser } from '$app/environment';
import type { TrailState, Tab, Message, CheckIn, PrivacySettings } from './types';

const STORAGE_KEY = 'hoggcountry_trail_state';

const defaultState: TrailState = {
	activeTab: 'Today',
	messages: [
		{
			id: '1',
			role: 'coach',
			content: 'Welcome back, hiker. I’m your local Coach. Need help with today’s mileage or checking the next water source?',
			timestamp: new Date()
		}
	],
	lastCheckIn: null,
	privacySettings: {
		stealthMode: false,
		locationSharing: true,
		allowCoachInsights: true
	},
	dailyGoal: 15.5,
	completedMiles: 8.2,
	nextWaterMile: 12.4,
	onlineStatus: true,
	syncPending: false
};

class TrailAssistantStore {
	#state = $state<TrailState>(defaultState);

	constructor() {
		if (browser) {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					// Convert timestamps back to Dates
					parsed.messages.forEach((m: any) => m.timestamp = new Date(m.timestamp));
					if (parsed.lastCheckIn) parsed.lastCheckIn.timestamp = new Date(parsed.lastCheckIn.timestamp);
					this.#state = { ...defaultState, ...parsed };
				} catch (e) {
					console.error('Failed to parse stored state', e);
				}
			}

			// Online/Offline detection
			window.addEventListener('online', () => this.#state.onlineStatus = true);
			window.addEventListener('offline', () => this.#state.onlineStatus = false);
			this.#state.onlineStatus = navigator.onLine;

			$effect.root(() => {
				$effect(() => {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#state));
				});
			});
		}
	}

	get activeTab() { return this.#state.activeTab; }
	set activeTab(tab: Tab) { this.#state.activeTab = tab; }

	get messages() { return this.#state.messages; }
	get lastCheckIn() { return this.#state.lastCheckIn; }
	get privacySettings() { return this.#state.privacySettings; }
	get dailyGoal() { return this.#state.dailyGoal; }
	get completedMiles() { return this.#state.completedMiles; }
	get nextWaterMile() { return this.#state.nextWaterMile; }
	get onlineStatus() { return this.#state.onlineStatus; }
	get syncPending() { return this.#state.syncPending; }

	addMessage(role: 'user' | 'coach', content: string) {
		const id = Math.random().toString(36).substring(7);
		this.#state.messages.push({ id, role, content, timestamp: new Date() });
		
		if (role === 'user') {
			this.generateCoachReply(content);
		}
	}

	private generateCoachReply(content: string) {
		const lower = content.toLowerCase();
		let reply = "I'm analyzing your data. Did you need anything else?";
		
		if (lower.includes('water')) {
			reply = `The next reliable source is at mile 12.4. Flow was reported moderate yesterday.`;
		} else if (lower.includes('miles') || lower.includes('goal')) {
			reply = `You’ve done 8.2 miles today. You’re 7.3 miles from your 15.5 mile daily target. Keep moving, you’ve got about 3 hours of daylight left.`;
		} else if (lower.includes('town') || lower.includes('resupply')) {
			reply = `The next resupply is in Damascus (mile 469). You have about 3 days of food left based on your log.`;
		} else if (lower.includes('hello') || lower.includes('hi')) {
			reply = `Hey! Ready for the climb ahead? The elevation profile shows a 1,200ft gain in the next 2 miles.`;
		}

		setTimeout(() => {
			this.addMessage('coach', reply);
		}, 1000);
	}

	checkIn(location: string, mile: number, status: CheckIn['status']) {
		this.#state.lastCheckIn = { timestamp: new Date(), location, mile, status };
		this.#state.syncPending = true;
		
		// Simulate sync
		setTimeout(() => {
			this.#state.syncPending = false;
		}, 2000);
	}

	updatePrivacy(settings: Partial<PrivacySettings>) {
		this.#state.privacySettings = { ...this.#state.privacySettings, ...settings };
	}
}

export const trailAssistant = new TrailAssistantStore();
