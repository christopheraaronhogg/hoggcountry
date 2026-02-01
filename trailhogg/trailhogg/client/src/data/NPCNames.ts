// ============================================
// TRAILHOGG - NPC Name and Dialogue Data
// Trail names, hometowns, greetings, and gossip
// ============================================

export const TRAIL_NAMES = [
  'Happy Feet',
  'Snickers',
  'Blister Sister',
  'Mountain Goat',
  'Trailblazer',
  'Sherpa',
  'Drip',
  'Moonshine',
  'Gadget',
  'Nalgene',
  'Tortilla',
  'Stretch',
  'Blaze',
  'Hobbit',
  'Gumby',
  'Squirrel',
  'Nighthawk',
  'Spoonman',
  'Wildflower',
  'Rambler',
  'Dusty',
  'Mosey',
  'Bigfoot',
  'Strider',
  'Dirtbag',
  'Sticks',
  'Pitstop',
  'Compass',
  'Sunrise',
  'Thunder',
];

export const REAL_NAMES = [
  'Mike', 'Sarah', 'Dave', 'Emily', 'Tom', 'Jen', 'Chris', 'Katie',
  'Matt', 'Amanda', 'Jake', 'Nicole', 'Ryan', 'Lauren', 'Alex', 'Megan',
  'Dan', 'Rachel', 'Brian', 'Ashley', 'Steve', 'Heather', 'Kevin', 'Lisa',
];

export const HOMETOWNS = [
  'Atlanta, GA',
  'Boston, MA',
  'Denver, CO',
  'Seattle, WA',
  'Austin, TX',
  'Portland, OR',
  'Chicago, IL',
  'Nashville, TN',
  'Asheville, NC',
  'Burlington, VT',
  'San Diego, CA',
  'Philadelphia, PA',
  'Columbus, OH',
  'Minneapolis, MN',
  'Raleigh, NC',
];

export const GREETINGS = {
  first: [
    "Hey! Just started? I'm {trailName}.",
    "Beautiful day for a hike! Name's {trailName}.",
    "Another NOBO! Good to see a friendly face.",
    "Howdy! Where'd you start from?",
  ],
  familiar: [
    "Hey, good to see you again!",
    "We keep running into each other!",
    "There's my trail family!",
    "{trailName} here - missed you on the trail!",
  ],
  friend: [
    "There you are! Was wondering when you'd catch up.",
    "My favorite hiking buddy!",
    "The gang's all here now!",
    "Saved you a spot at the shelter!",
  ],
  tired: [
    "*yawn* Long day...",
    "These miles are rough today.",
    "Need coffee. So much coffee.",
    "Is it zero day yet?",
  ],
  excited: [
    "What a view back there!",
    "Trail magic ahead - don't miss it!",
    "Feeling great today!",
    "Making good time!",
  ],
};

// Companion dialogue - periodic comments when hiking with a buddy
export const COMPANION_DIALOGUE = {
  hiking: [
    "Beautiful day for hiking!",
    "Look at that view!",
    "Only a few more miles to the shelter!",
    "Want to take a break?",
    "I'm so glad we're hiking together.",
    "This section is gorgeous!",
    "You're doing great! Keep it up!",
    "I heard there's a good water source ahead.",
    "Remember to stay hydrated!",
    "I love this part of the trail.",
    "Can you believe we're actually doing this?",
    "The trail provides!",
    "One foot in front of the other!",
    "We're making good time today.",
  ],
  tired: [
    "Need a snack break?",
    "My legs are feeling it today...",
    "Maybe we should slow down a bit?",
    "I could use some water.",
    "These miles are tough!",
    "Ready for a rest when you are.",
    "*huffing* That climb was something!",
  ],
  excited: [
    "This is the life!",
    "I can't believe we get to do this!",
    "Best decision ever, hitting the trail!",
    "Trail family for life!",
    "This view is worth every blister!",
    "We're gonna make it to Katahdin!",
  ],
  weather: {
    rain: [
      "At least the rain is keeping us cool!",
      "Good thing we have rain gear!",
      "Rain makes the forest smell amazing.",
    ],
    clear: [
      "Perfect hiking weather!",
      "Blue skies and good vibes!",
    ],
    fog: [
      "Spooky fog today!",
      "Can't see much, but it's atmospheric.",
    ],
  },
  milestone: [
    "We did it! Another milestone!",
    "Can you believe how far we've come?",
    "This calls for a celebration snack!",
  ],
};

// Get random companion dialogue based on context
export function getCompanionDialogue(
  energy: number,
  morale: number,
  weather?: string
): string {
  // Check for weather-specific dialogue first (30% chance)
  if (weather && Math.random() < 0.3 && COMPANION_DIALOGUE.weather[weather as keyof typeof COMPANION_DIALOGUE.weather]) {
    const weatherLines = COMPANION_DIALOGUE.weather[weather as keyof typeof COMPANION_DIALOGUE.weather];
    return weatherLines[Math.floor(Math.random() * weatherLines.length)];
  }

  // Tired dialogue if low energy
  if (energy < 40) {
    const lines = COMPANION_DIALOGUE.tired;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  // Excited dialogue if high morale
  if (morale > 80) {
    const lines = COMPANION_DIALOGUE.excited;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  // Default hiking dialogue
  const lines = COMPANION_DIALOGUE.hiking;
  return lines[Math.floor(Math.random() * lines.length)];
}

// Encouraging trail tips shared between hikers
export const TRAIL_TIPS = [
  "The sunrise from the next shelter is incredible!",
  "There's a beautiful waterfall about a mile ahead.",
  "I heard the views from the ridge are worth the climb.",
  "The water source at the next shelter is flowing great.",
  "Someone left some trail magic up ahead - so kind!",
  "The wildflowers are blooming on the next section.",
  "I met the nicest trail angel yesterday.",
  "The stars were amazing last night from the shelter.",
  "There's a great campsite with a view just ahead.",
  "The next town has a wonderful little bakery.",
];

export const QUIT_REASONS = [
  'Bad knees',
  'Ran out of money',
  'Family emergency',
  'Got a job offer',
  'Blisters won',
  'Missing home too much',
  'Injured ankle',
  'Just not feeling it anymore',
  'Switching to a section hike',
  'Will try again next year',
];

// Generate a random NPC with consistent traits
export function generateNPCData(id: number, playerStartMile: number): {
  trailName: string;
  realName: string;
  hometown: string;
  trailTips: string[];
} {
  // Use ID as seed for consistent generation
  const trailName = TRAIL_NAMES[id % TRAIL_NAMES.length];
  const realName = REAL_NAMES[id % REAL_NAMES.length];
  const hometown = HOMETOWNS[id % HOMETOWNS.length];

  // Pick 2 random trail tips to share
  const trailTips: string[] = [];
  for (let i = 0; i < 2; i++) {
    const tip = TRAIL_TIPS[(id + i * 7) % TRAIL_TIPS.length];
    trailTips.push(tip);
  }

  return { trailName, realName, hometown, trailTips };
}

export function getGreeting(
  encounters: number,
  energy: number,
  morale: number,
  trailName: string
): string {
  let category: keyof typeof GREETINGS;

  if (encounters === 0) {
    category = 'first';
  } else if (encounters < 3) {
    category = 'familiar';
  } else {
    category = 'friend';
  }

  // Override based on mood
  if (energy < 30) {
    category = 'tired';
  } else if (morale > 80) {
    category = 'excited';
  }

  const greetings = GREETINGS[category];
  const template = greetings[Math.floor(Math.random() * greetings.length)];

  return template.replace('{trailName}', trailName);
}

export function getQuitReason(): string {
  return QUIT_REASONS[Math.floor(Math.random() * QUIT_REASONS.length)];
}
