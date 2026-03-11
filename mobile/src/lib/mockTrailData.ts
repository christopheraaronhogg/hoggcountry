import type { ItineraryDay, TownSnapshot, UpcomingStop, WaterSource, WeatherSnapshot } from './types';

export const quickPrompts = [
	'Can I push mileage today?',
	'What is the next reliable water?',
	'Should I keep Bland as my town stop?',
	'Give me the safest next move.'
];

export const weatherSnapshot: WeatherSnapshot = {
	highF: 46,
	lowF: 28,
	windMph: 17,
	summary: 'Cold ridge wind with dry afternoon skies',
	riskNote: 'Crosswinds plus a soft recovery day make this a poor time to chase lost miles.'
};

export const waterSources: WaterSource[] = [
	{
		name: 'Lick Creek',
		mile: 586.6,
		distanceMiles: 4.2,
		reliability: 'reliable',
		note: 'Best fill before the exposed ridge section.'
	},
	{
		name: 'Spring below Chestnut Knob',
		mile: 589.9,
		distanceMiles: 7.5,
		reliability: 'seasonal',
		note: 'Usable, but not the source to gamble the day on.'
	}
];

export const upcomingStops: UpcomingStop[] = [
	{
		kind: 'view',
		title: 'High Ledge',
		mile: 583.7,
		distanceMiles: 1.3,
		detail: 'Fast morale stop, but windy enough to cool you quickly.'
	},
	{
		kind: 'water',
		title: 'Lick Creek',
		mile: 586.6,
		distanceMiles: 4.2,
		detail: 'Last easy water before camp.'
	},
	{
		kind: 'shelter',
		title: 'Chestnut Knob Shelter',
		mile: 589.7,
		distanceMiles: 7.3,
		detail: 'Current best camp if you keep the day controlled.'
	},
	{
		kind: 'town',
		title: 'Bland, VA',
		mile: 596.0,
		distanceMiles: 13.6,
		detail: 'Clean resupply and reset option if you do not force extra mileage.'
	}
];

export const itinerary: ItineraryDay[] = [
	{
		dayLabel: 'Wed',
		dateLabel: 'Mar 11',
		status: 'today',
		destination: 'Chestnut Knob Shelter',
		mileage: 13.8,
		elevationGain: 2600,
		weather: 'Windy and cold',
		note: 'Hold day. Protect recovery and hit water on schedule.'
	},
	{
		dayLabel: 'Thu',
		dateLabel: 'Mar 12',
		status: 'town',
		destination: 'Bland, VA',
		mileage: 10.4,
		elevationGain: 900,
		weather: 'Clearing skies',
		note: 'Town stop for laundry, calories, and a pace reset.'
	},
	{
		dayLabel: 'Fri',
		dateLabel: 'Mar 13',
		status: 'recovery',
		destination: 'Jenny Knob',
		mileage: 8.6,
		elevationGain: 1800,
		weather: 'Cool and dry',
		note: 'Nero out of town. Let the body absorb the reset.'
	},
	{
		dayLabel: 'Sat',
		dateLabel: 'Mar 14',
		status: 'planned',
		destination: 'Helveys Mill Shelter',
		mileage: 15.2,
		elevationGain: 2400,
		weather: 'Stable',
		note: 'Best push opportunity if recovery markers rebound.'
	},
	{
		dayLabel: 'Sun',
		dateLabel: 'Mar 15',
		status: 'planned',
		destination: 'Dismal Falls side trail camp',
		mileage: 13.4,
		elevationGain: 1900,
		weather: 'Mixed clouds',
		note: 'Good photo and water day. Do not turn it into a race.'
	},
	{
		dayLabel: 'Mon',
		dateLabel: 'Mar 16',
		status: 'planned',
		destination: 'Pearisburg',
		mileage: 14.1,
		elevationGain: 2100,
		weather: 'Warming',
		note: 'Stay ahead of the weather window and town before dark.'
	},
	{
		dayLabel: 'Tue',
		dateLabel: 'Mar 17',
		status: 'planned',
		destination: 'Rice Field Shelter',
		mileage: 12.9,
		elevationGain: 3000,
		weather: 'Wind returning',
		note: 'Respect the climb and keep the first half conservative.'
	}
];

export const townSnapshot: TownSnapshot = {
	name: 'Bland, VA',
	mile: 596.0,
	eta: 'Tomorrow by 2:30 PM if you keep today controlled',
	hitchNote: 'US-52 crossing still looks clean. Best pickup window is late morning through early afternoon.',
	services: [
		{
			name: 'Big Walker Motel',
			category: 'hostel',
			status: 'Beds likely available',
			detail: 'Showers, laundry, and a solid breakfast window.'
		},
		{
			name: 'Bland Post Office',
			category: 'resupply',
			status: 'Open until 4:30 PM',
			detail: 'Good for a box retrieval, but do not cut it close.'
		},
		{
			name: 'Bland Shuttle Board',
			category: 'shuttle',
			status: 'Two drivers active today',
			detail: 'Most reliable pickup is from the bridge lot.'
		},
		{
			name: 'NAPA / fuel stop',
			category: 'gear',
			status: 'Canister fuel confirmed',
			detail: 'Use it as a backup gear lane, not primary resupply.'
		},
		{
			name: 'Main Street Market',
			category: 'food',
			status: 'Open',
			detail: 'Best for immediate calories, weak for deep trail resupply.'
		},
		{
			name: 'Town Laundry',
			category: 'laundry',
			status: 'Open',
			detail: 'Low wait if you arrive before the evening bubble.'
		}
	]
};
