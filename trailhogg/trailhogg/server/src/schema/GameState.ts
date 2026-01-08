import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

// ============================================
// COLYSEUS SCHEMA DEFINITIONS
// Synchronized state between server and clients
// ============================================

export class SkillsSchema extends Schema {
  @type("number") trailLegs: number = 10;
  @type("number") navigation: number = 15;
  @type("number") foraging: number = 5;
  @type("number") campCraft: number = 10;
  @type("number") gearMaintenance: number = 10;
  @type("number") firstAid: number = 10;
  @type("number") trailCooking: number = 10;
  @type("number") weatherReading: number = 10;
  @type("number") social: number = 20;
  @type("number") mentalFortitude: number = 20;
}

export class MoodlesSchema extends Schema {
  @type("number") hunger: number = 0;
  @type("number") thirst: number = 0;
  @type("number") fatigue: number = 0;
  @type("number") pain: number = 0;
  @type("number") cold: number = 0;
  @type("number") heat: number = 0;
  @type("number") wetness: number = 0;
  @type("number") morale: number = 50;
  @type("number") loneliness: number = 0;
  @type("number") anxiety: number = 0;
  @type("number") homesickness: number = 0;
}

export class FoodItemSchema extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("number") calories: number = 0;
  @type("number") weight: number = 0;
  @type("number") servings: number = 1;
}

export class GearItemSchema extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("number") weight: number = 0;
  @type("number") condition: number = 100;
  @type("string") category: string = "misc";
}

export class InventorySchema extends Schema {
  @type([GearItemSchema]) gear = new ArraySchema<GearItemSchema>();
  @type([FoodItemSchema]) food = new ArraySchema<FoodItemSchema>();
  @type("number") water: number = 2.0;
  @type("number") waterCapacity: number = 3.0;
  @type("number") money: number = 500;
}

export class HikerSchema extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "Hiker";
  @type("string") trailName: string = "";
  @type("string") build: string = "weekend_warrior";
  
  // Position
  @type("number") mile: number = 0;
  @type("number") elevation: number = 3782;
  
  // Core stats
  @type("number") calories: number = 2000;
  @type("number") hydration: number = 100;
  @type("number") energy: number = 100;
  @type("number") health: number = 100;
  
  // State
  @type("string") pace: string = "normal";
  @type("string") lostState: string = "on_trail";
  @type("number") lastBlazeSeenMile: number = 0;
  @type("boolean") isHiking: boolean = false;
  @type("boolean") isResting: boolean = false;
  @type("string") currentActivity: string = "idle";
  
  // Tracking
  @type("number") totalMilesHiked: number = 0;
  @type("number") daysOnTrail: number = 1;
  @type("number") currentDayMiles: number = 0;
  
  // Systems
  @type(SkillsSchema) skills = new SkillsSchema();
  @type(MoodlesSchema) moodles = new MoodlesSchema();
  @type(InventorySchema) inventory = new InventorySchema();
}

export class GameTimeSchema extends Schema {
  @type("number") day: number = 1;
  @type("number") hour: number = 6;
  @type("number") minute: number = 0;
}

export class EventSchema extends Schema {
  @type("string") id: string = "";
  @type("string") type: string = "";
  @type("string") message: string = "";
  @type("number") timestamp: number = 0;
}

export class GameRoomState extends Schema {
  // Time
  @type(GameTimeSchema) time = new GameTimeSchema();
  @type("string") phase: string = "morning";
  
  // Environment
  @type("string") weather: string = "clear";
  @type("number") temperature: number = 55;
  
  // Players
  @type({ map: HikerSchema }) hikers = new MapSchema<HikerSchema>();
  
  // Events log (last 10)
  @type([EventSchema]) events = new ArraySchema<EventSchema>();
  
  // Game flags
  @type("boolean") isPaused: boolean = false;
  @type("number") tickCount: number = 0;
}
