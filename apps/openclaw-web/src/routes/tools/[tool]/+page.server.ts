import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const toolNames: Record<string, string> = {
  budget: 'Budget Calculator',
  character: 'My Profile',
  emergency: 'Emergency Card',
  food: 'Food Calculator',
  geartrans: 'Gear Swap Planner',
  layers: 'Layering Advisor',
  mail: 'Mail Drop Planner',
  milestone: 'Journey Planner',
  pack: 'Pack Builder',
  power: 'Power Manager',
  resupply: 'Resupply Calculator',
  shelter: 'Shelter Decision',
  training: 'Training Planner',
  water: 'Water Tracker',
  weather: 'Weather Assessor'
};

export const load: PageServerLoad = async ({ params }) => {
  if (params.tool === 'gear') throw redirect(307, '/tools/pack');

  return {
    toolId: params.tool,
    toolName: toolNames[params.tool] ?? 'Trail Tool',
    known: Boolean(toolNames[params.tool])
  };
};
