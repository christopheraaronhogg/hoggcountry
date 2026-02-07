export type TrailTool = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  href: string;
};

export type TrailToolGroup = {
  name: string;
  tools: TrailTool[];
};

export const TRAIL_TOOL_GROUPS: TrailToolGroup[] = [
  {
    name: "Planning",
    tools: [
      { id: "character", name: "My Profile", icon: "👤", desc: "Set your hiker defaults (drives every tool)", href: "/tools/character/" },
      { id: "pack", name: "Pack", icon: "🎒", desc: "Build & weigh your kit", href: "/tools/pack/" },
      { id: "resupply", name: "Resupply", icon: "🍽️", desc: "Towns, food & mail drops", href: "/tools/resupply/" },
      { id: "food", name: "Food", icon: "🍽️", desc: "Calorie & weight calculator", href: "/tools/food/" },
      { id: "training", name: "Train", icon: "🏋️", desc: "Pre-trail preparation", href: "/tools/training/" },
    ],
  },
  {
    name: "On Trail",
    tools: [
      { id: "weather", name: "Weather", icon: "🌤️", desc: "Weather, heat zones & daylight", href: "/tools/weather/" },
      { id: "at-map", name: "AT Map", icon: "🗺️", desc: "Trail map + your live location", href: "/at-map/" },
      { id: "at-weather", name: "AT Weather", icon: "🌦️", desc: "Weather along the trail", href: "/at-weather/" },
      { id: "water", name: "Water", icon: "💧", desc: "Water sources & carry calc", href: "/tools/water/" },
      { id: "shelter", name: "Shelter", icon: "🏠", desc: "Tent vs shelter decision", href: "/tools/shelter/" },
      { id: "layers", name: "Layers", icon: "🧥", desc: "What to wear for conditions", href: "/tools/layers/" },
    ],
  },
  {
    name: "Town Days",
    tools: [
      { id: "budget", name: "Budget", icon: "💰", desc: "Track trail spending", href: "/tools/budget/" },
      { id: "mail", name: "Mail", icon: "📬", desc: "Plan resupply mail drops", href: "/tools/mail/" },
      { id: "power", name: "Power", icon: "🔋", desc: "Manage battery & devices", href: "/tools/power/" },
      { id: "geartrans", name: "Swap", icon: "🔄", desc: "Gear transition planner", href: "/tools/geartrans/" },
    ],
  },
  {
    name: "Always",
    tools: [{ id: "milestone", name: "Journey", icon: "🗺️", desc: "Plan your timeline & track progress", href: "/tools/milestone/" }],
  },
];

export const TRAIL_EMERGENCY_TOOL: TrailTool = {
  id: "emergency",
  name: "Emergency",
  icon: "🆘",
  desc: "Emergency info & bailouts",
  href: "/tools/emergency/",
};
