import type { ItineraryDay, TownSnapshot, UpcomingStop, WaterSource, WeatherSnapshot } from './types';

export const quickPrompts = [
	'Can I push mileage today?',
	'What is the next reliable water?',
	'What needs verifying before the next town?',
	'Give me the safest next move.'
];

export const weatherSnapshot: WeatherSnapshot = {
	highF: 82,
	lowF: 63,
	windMph: 9,
	summary: 'Cached pilot weather: warm, humid ridge walking with scattered showers possible',
	riskNote: 'Mapped water is candidate-grade, so confirm flow before committing to a longer push.'
};

export const waterSources: WaterSource[] = [
	{
		name: 'Unnamed mapped stream',
		mile: 1438.4,
		distanceMiles: 0.4,
		reliability: 'thin',
		note: 'Open-reference candidate only. Confirm flow and potability.'
	},
	{
		name: 'Stump Pond Stream',
		mile: 1442.0,
		distanceMiles: 4.0,
		reliability: 'thin',
		note: 'Mapped water candidate. Do not treat as guaranteed reliable.'
	}
];

export const upcomingStops: UpcomingStop[] = [
	{
		kind: 'water',
		title: 'Unnamed mapped stream',
		mile: 1438.4,
		distanceMiles: 0.4,
		detail: 'Closest water candidate. Verify before relying on it.'
	},
	{
		kind: 'shelter',
		title: 'Morgan Stewart Memorial Shelter',
		mile: 1442.6,
		distanceMiles: 4.6,
		detail: 'Open-data shelter candidate. Confirm current access/rules.'
	},
	{
		kind: 'town',
		title: 'Kent Hills',
		mile: 1440.0,
		distanceMiles: 2.0,
		detail: 'Mapped town candidate. Services are not confirmed.'
	}
];

export const itinerary: ItineraryDay[] = [
	{
		dayLabel: 'Wed',
		dateLabel: 'Jun 17',
		status: 'today',
		destination: 'Morgan Stewart Memorial Shelter',
		mileage: 8.2,
		elevationGain: 1700,
		weather: 'Humid, showers possible',
		note: 'Hold discipline. Confirm mapped water before stretching the day.'
	},
	{
		dayLabel: 'Thu',
		dateLabel: 'Jun 18',
		status: 'town',
		destination: 'Pawling corridor',
		mileage: 11.1,
		elevationGain: 1400,
		weather: 'Warm, lower precip',
		note: 'Candidate town/services day. Verify hours and access before counting on it.'
	},
	{
		dayLabel: 'Fri',
		dateLabel: 'Jun 19',
		status: 'recovery',
		destination: 'Wiley Shelter window',
		mileage: 9.4,
		elevationGain: 1300,
		weather: 'Mild, verify water',
		note: 'Keep the plan flexible until field reports confirm water.'
	},
	{
		dayLabel: 'Sat',
		dateLabel: 'Jun 20',
		status: 'planned',
		destination: 'Pine Swamp Brook Lean-to',
		mileage: 12.7,
		elevationGain: 1900,
		weather: 'Storm chance',
		note: 'Do not spend safety margin unless the morning check is clean.'
	},
	{
		dayLabel: 'Sun',
		dateLabel: 'Jun 21',
		status: 'planned',
		destination: 'CT line approach',
		mileage: 10.5,
		elevationGain: 1500,
		weather: 'Wet footing risk',
		note: 'Father\'s Day target: make the app useful, not the day aggressive.'
	},
	{
		dayLabel: 'Mon',
		dateLabel: 'Jun 22',
		status: 'planned',
		destination: 'CT ridge window',
		mileage: 12.2,
		elevationGain: 2100,
		weather: 'Warm',
		note: 'Re-plan from confirmed water and service intel.'
	},
	{
		dayLabel: 'Tue',
		dateLabel: 'Jun 23',
		status: 'planned',
		destination: 'Next confirmed stop',
		mileage: 11.8,
		elevationGain: 1800,
		weather: 'Unknown',
		note: 'Treat this as draft until a fresh field pack or guide source confirms it.'
	}
];

export const townSnapshot: TownSnapshot = {
	name: 'Pawling corridor',
	mile: 1457.9,
	eta: 'Candidate stop after the NY/CT forward window; verify before relying on it',
	hitchNote: 'Open-data town candidate only. Confirm access, transit, and service hours from a current source.',
	services: [
		{
			name: 'Lodging candidate',
			category: 'hostel',
			status: 'Unverified',
			detail: 'Do not assume availability without a current listing or call.'
		},
		{
			name: 'Resupply candidate',
			category: 'resupply',
			status: 'Unverified',
			detail: 'Open-data town signal only; confirm store and hours.'
		},
		{
			name: 'Transit/access candidate',
			category: 'shuttle',
			status: 'Unverified',
			detail: 'Confirm pickup/access before planning the day around it.'
		},
		{
			name: 'Fuel/gear candidate',
			category: 'gear',
			status: 'Unknown',
			detail: 'No current fuel confirmation in the pilot pack.'
		},
		{
			name: 'Food candidate',
			category: 'food',
			status: 'Unknown',
			detail: 'Treat as a search target, not a confirmed service.'
		},
		{
			name: 'Laundry candidate',
			category: 'laundry',
			status: 'Unknown',
			detail: 'Confirm locally if this matters.'
		}
	]
};
