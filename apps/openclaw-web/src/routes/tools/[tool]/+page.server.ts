import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { TRAIL_EMERGENCY_TOOL, TRAIL_TOOL_GROUPS, type TrailTool } from '../../../../../../src/data/trailTools';

type ToolMeta = TrailTool & {
  group: string;
  pageTitle?: string;
  pageDescription?: string;
  intent?: string;
};

const pageCopy: Record<string, Pick<ToolMeta, 'pageTitle' | 'pageDescription' | 'intent'>> = {
  budget: {
    pageTitle: 'Trail Budget',
    pageDescription: 'Keep town spending, recurring costs, and cash runway visible before a town day gets loose.',
    intent: 'Log expenses and check the budget before town stops.'
  },
  character: {
    pageTitle: 'Trail Profile',
    pageDescription: 'Set the hiker defaults every other trail tool should trust: mile, pace, loadout, preferences, and emergency details.',
    intent: 'Fill this in first so every planner starts with the same field context.'
  },
  emergency: {
    pageTitle: 'Emergency Card',
    pageDescription: 'Keep contacts, medical details, and bailout context close when the day stops being normal.',
    intent: 'Review this before service drops.'
  },
  food: {
    pageTitle: 'Food Calculator',
    pageDescription: 'Translate trail days into calories, ounces, and carry weight before a resupply run.',
    intent: 'Set calories and carry days before shopping.'
  },
  geartrans: {
    pageTitle: 'Gear Swap Planner',
    pageDescription: 'Track seasonal gear changes, shipping windows, and the next swap point.',
    intent: 'Plan what leaves or joins the pack next.'
  },
  layers: {
    pageTitle: 'Layering Advisor',
    pageDescription: 'Match weather, wind, and effort to a practical clothing call for the next stretch.',
    intent: 'Make the clothing decision before stepping out.'
  },
  mail: {
    pageTitle: 'Mail Drop Planner',
    pageDescription: 'Plan boxes, lead times, and pickup towns without losing the thread on trail.',
    intent: 'Check what needs shipped and when.'
  },
  milestone: {
    pageTitle: 'Journey Planner',
    pageDescription: 'Project remaining miles, target pace, zeros, and finish timing from the current mile.',
    intent: 'Sanity-check the big timeline.'
  },
  pack: {
    pageTitle: 'Pack Builder',
    pageDescription: 'Build the loadout, watch base weight, and keep consumables honest.',
    intent: 'Tune what is actually in the pack.'
  },
  power: {
    pageTitle: 'Power Manager',
    pageDescription: 'Estimate battery runway for phone, lights, and electronics between charging stops.',
    intent: 'Know whether the battery plan survives the stretch.'
  },
  resupply: {
    pageTitle: 'Resupply Calculator',
    pageDescription: 'Estimate food carry, next town timing, and town-day needs from current pace.',
    intent: 'Plan the next resupply stop.'
  },
  shelter: {
    pageTitle: 'Shelter Decision',
    pageDescription: 'Compare shelter, tent, weather, and crowd pressure before committing to a stop.',
    intent: 'Choose tonight’s sleep setup with fewer guesses.'
  },
  training: {
    pageTitle: 'Training Planner',
    pageDescription: 'Track pre-trail conditioning, weekly workload, and the benchmarks that matter.',
    intent: 'Keep preparation measurable.'
  },
  water: {
    pageTitle: 'Water Tracker',
    pageDescription: 'Estimate water carry and buffer based on heat, distance, and next-source confidence.',
    intent: 'Decide how much water to leave with.'
  },
  weather: {
    pageTitle: 'Weather Assessor',
    pageDescription: 'Turn temperature, rain, daylight, and exposure into a practical trail call.',
    intent: 'Check conditions before the next push.'
  }
};

const allTools: ToolMeta[] = [
  ...TRAIL_TOOL_GROUPS.flatMap((group) =>
    group.tools
      .filter((tool) => tool.id !== 'at-map' && tool.id !== 'at-weather' && tool.id !== 'videohogg')
      .map((tool) => ({ ...tool, group: group.name, ...pageCopy[tool.id] }))
  ),
  { ...TRAIL_EMERGENCY_TOOL, group: 'Emergency', ...pageCopy[TRAIL_EMERGENCY_TOOL.id] }
];

const toolsById = new Map(allTools.map((tool) => [tool.id, tool]));

function relatedFor(tool: ToolMeta): ToolMeta[] {
  const sameGroup = allTools.filter((candidate) => candidate.group === tool.group && candidate.id !== tool.id);
  const planningFallback = allTools.filter((candidate) =>
    ['character', 'pack', 'resupply', 'weather', 'water', 'emergency'].includes(candidate.id) && candidate.id !== tool.id
  );

  return [...sameGroup, ...planningFallback]
    .filter((candidate, index, list) => list.findIndex((item) => item.id === candidate.id) === index)
    .slice(0, 4);
}

export const load: PageServerLoad = async ({ params }) => {
  if (params.tool === 'gear') throw redirect(307, '/tools/pack');
  const tool = toolsById.get(params.tool);

  return {
    toolId: params.tool,
    toolName: tool?.pageTitle ?? tool?.name ?? 'Trail Tool',
    toolIcon: tool?.icon ?? '⌁',
    toolDescription: tool?.pageDescription ?? tool?.desc ?? 'A Hogg Country trail tool.',
    toolIntent: tool?.intent ?? 'Use this tool with the current trail context.',
    toolGroup: tool?.group ?? 'Trail Tools',
    relatedTools: tool ? relatedFor(tool) : [],
    known: Boolean(tool)
  };
};
