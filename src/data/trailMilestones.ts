export interface TrailMilestone {
    mile: number;
    name: string;
    emoji: string;
}

export const MILESTONES: TrailMilestone[] = [
    { mile: 100, name: 'First Century', emoji: '💯' },
    { mile: 500, name: 'Quarter Done', emoji: '🎉' },
    { mile: 1000, name: 'Thousand Miles', emoji: '🏆' },
    { mile: 1099, name: 'Halfway!', emoji: '⚡' },
    { mile: 2000, name: 'Almost Home', emoji: '🔥' },
    { mile: 2197.4, name: 'Summit!', emoji: '🎊' },
];

export function getNextMilestone(mile: number): TrailMilestone | undefined {
    return MILESTONES.find(m => m.mile > mile);
}
