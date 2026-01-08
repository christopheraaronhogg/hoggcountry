import { Room, Client } from "colyseus";
import { 
  GameRoomState, 
  HikerSchema, 
  EventSchema,
  SkillsSchema,
  MoodlesSchema,
  InventorySchema,
  FoodItemSchema,
  GearItemSchema
} from "../schema/GameState";

// Import trail data (we'll inline the key parts for now)
const TRAIL_END_MILE = 30.7;

// Pace configurations
const PACE_CONFIG = {
  slow: { speed: 1.5, fatigue: 0.5, blazeMiss: 0.5 },
  normal: { speed: 2.0, fatigue: 1.0, blazeMiss: 1.0 },
  fast: { speed: 2.5, fatigue: 1.8, blazeMiss: 1.5 },
  rush: { speed: 3.0, fatigue: 3.0, blazeMiss: 2.5 }
};

// Weather effects
const WEATHER_EFFECTS = {
  clear: { visibility: 1.0, moodMod: 1, coldMod: 0 },
  cloudy: { visibility: 0.9, moodMod: 0, coldMod: 5 },
  rain_light: { visibility: 0.7, moodMod: -5, coldMod: 10 },
  rain_heavy: { visibility: 0.5, moodMod: -15, coldMod: 20 },
  fog: { visibility: 0.3, moodMod: -5, coldMod: 5 },
  storm: { visibility: 0.2, moodMod: -25, coldMod: 25 }
};

// Blaze positions (simplified - would come from trailData)
function generateSimpleBlazes(): number[] {
  const blazes: number[] = [];
  for (let m = 0; m < 31; m += 0.1) {
    blazes.push(Math.round(m * 10) / 10);
  }
  return blazes;
}
const BLAZE_POSITIONS = generateSimpleBlazes();

export class TrailRoom extends Room<GameRoomState> {
  maxClients = 8;
  private tickInterval: NodeJS.Timeout | null = null;
  private readonly TICK_RATE = 100; // ms per tick
  private readonly MINUTES_PER_TICK = 1;
  
  onCreate(options: any) {
    console.log("TrailRoom created!", options);
    this.setState(new GameRoomState());
    
    // Set initial time to 6 AM Day 1
    this.state.time.day = 1;
    this.state.time.hour = 6;
    this.state.time.minute = 0;
    this.state.phase = "morning";
    this.state.weather = "clear";
    this.state.temperature = 55;
    
    // Register message handlers
    this.registerMessageHandlers();
    
    // Start game loop
    this.startGameLoop();
  }
  
  registerMessageHandlers() {
    // Join with character info
    this.onMessage("create_hiker", (client, data) => {
      this.createHiker(client, data);
    });
    
    // Movement & hiking
    this.onMessage("set_pace", (client, data) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker && PACE_CONFIG[data.pace as keyof typeof PACE_CONFIG]) {
        hiker.pace = data.pace;
        this.addEvent("pace_change", `${hiker.name} sets pace to ${data.pace}`);
      }
    });
    
    this.onMessage("start_hiking", (client) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker && !hiker.isHiking) {
        hiker.isHiking = true;
        hiker.currentActivity = "hiking";
        this.addEvent("start_hiking", `${hiker.name} begins hiking`);
      }
    });
    
    this.onMessage("stop_hiking", (client) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker && hiker.isHiking) {
        hiker.isHiking = false;
        hiker.currentActivity = "stopped";
        this.addEvent("stop_hiking", `${hiker.name} stops to rest`);
      }
    });
    
    // Camp actions
    this.onMessage("make_camp", (client) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker) {
        hiker.isHiking = false;
        hiker.isResting = true;
        hiker.currentActivity = "camping";
        this.addEvent("make_camp", `${hiker.name} sets up camp at mile ${hiker.mile.toFixed(1)}`);
      }
    });
    
    this.onMessage("break_camp", (client) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker && hiker.isResting) {
        hiker.isResting = false;
        hiker.currentActivity = "idle";
        this.addEvent("break_camp", `${hiker.name} breaks camp`);
      }
    });
    
    // Consumables
    this.onMessage("eat", (client, data) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker) {
        this.eatFood(hiker, data.foodId);
      }
    });
    
    this.onMessage("drink", (client, data) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker) {
        const amount = data.amount || 0.5;
        if (hiker.inventory.water >= amount) {
          hiker.inventory.water -= amount;
          hiker.hydration = Math.min(100, hiker.hydration + amount * 30);
          this.addEvent("drink", `${hiker.name} drinks water`);
        }
      }
    });
    
    this.onMessage("fill_water", (client) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker) {
        // Check if near water source (simplified)
        hiker.inventory.water = hiker.inventory.waterCapacity;
        this.addEvent("fill_water", `${hiker.name} fills water bottles`);
      }
    });
    
    // Navigation
    this.onMessage("search_blaze", (client) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker && hiker.lostState !== "on_trail") {
        this.searchForBlaze(hiker);
      }
    });
    
    this.onMessage("backtrack", (client) => {
      const hiker = this.state.hikers.get(client.sessionId);
      if (hiker && hiker.lostState !== "on_trail") {
        this.backtrack(hiker);
      }
    });
  }
  
  createHiker(client: Client, data: any) {
    const hiker = new HikerSchema();
    hiker.id = client.sessionId;
    hiker.name = data.name || "Hiker";
    hiker.build = data.build || "weekend_warrior";
    
    // Apply build bonuses
    this.applyBuildBonuses(hiker);
    
    // Starting position
    hiker.mile = 0;
    hiker.elevation = 3782;
    hiker.lastBlazeSeenMile = 0;
    
    // Starting inventory
    this.setupStartingInventory(hiker);
    
    this.state.hikers.set(client.sessionId, hiker);
    this.addEvent("join", `${hiker.name} begins their thru-hike at Springer Mountain!`);
    
    // Send confirmation to client
    client.send("hiker_created", { id: hiker.id });
  }
  
  applyBuildBonuses(hiker: HikerSchema) {
    const builds: Record<string, { skills: Partial<Record<string, number>>, money: number, gear: number }> = {
      weekend_warrior: { skills: { trailLegs: 25, navigation: 10, campCraft: 15 }, money: 800, gear: 60 },
      scout_leader: { skills: { campCraft: 35, firstAid: 30, navigation: 25, trailLegs: 15 }, money: 500, gear: 50 },
      ultra_runner: { skills: { trailLegs: 50, mentalFortitude: 30 }, money: 600, gear: 55 },
      gear_head: { skills: { gearMaintenance: 40, trailLegs: 5 }, money: 400, gear: 90 },
      broke_college_kid: { skills: { mentalFortitude: 25, social: 30 }, money: 200, gear: 30 },
      retiree: { skills: { mentalFortitude: 40, weatherReading: 25, trailLegs: 15 }, money: 1200, gear: 70 }
    };
    
    const build = builds[hiker.build] || builds.weekend_warrior;
    
    // Apply skill modifiers
    for (const [skill, value] of Object.entries(build.skills)) {
      (hiker.skills as any)[skill] = (hiker.skills as any)[skill] + value;
    }
    
    hiker.inventory.money = build.money;
  }
  
  setupStartingInventory(hiker: HikerSchema) {
    // Add starting gear
    const startingGear = [
      { id: "backpack", name: "Backpack", weight: 48, category: "misc" },
      { id: "tent", name: "2-Person Tent", weight: 56, category: "shelter" },
      { id: "sleeping_bag", name: "20° Sleeping Bag", weight: 40, category: "sleep" },
      { id: "sleeping_pad", name: "Sleeping Pad", weight: 16, category: "sleep" },
      { id: "stove", name: "Pocket Stove", weight: 4, category: "cook" },
      { id: "pot", name: "Cooking Pot", weight: 8, category: "cook" },
      { id: "filter", name: "Water Filter", weight: 6, category: "water" },
      { id: "headlamp", name: "Headlamp", weight: 3, category: "misc" },
      { id: "first_aid", name: "First Aid Kit", weight: 8, category: "first_aid" }
    ];
    
    for (const g of startingGear) {
      const gear = new GearItemSchema();
      gear.id = g.id;
      gear.name = g.name;
      gear.weight = g.weight;
      gear.condition = 100;
      gear.category = g.category;
      hiker.inventory.gear.push(gear);
    }
    
    // Add starting food (3 days worth)
    const startingFood = [
      { id: "oatmeal_1", name: "Instant Oatmeal", calories: 300, weight: 2, servings: 3 },
      { id: "snickers_1", name: "Snickers Bars", calories: 250, weight: 2, servings: 4 },
      { id: "ramen_1", name: "Ramen Noodles", calories: 400, weight: 3, servings: 3 },
      { id: "peanut_butter", name: "Peanut Butter", calories: 200, weight: 8, servings: 6 },
      { id: "tortillas", name: "Tortillas", calories: 150, weight: 6, servings: 6 },
      { id: "jerky", name: "Beef Jerky", calories: 100, weight: 4, servings: 4 },
      { id: "trail_mix", name: "Trail Mix", calories: 180, weight: 6, servings: 5 }
    ];
    
    for (const f of startingFood) {
      const food = new FoodItemSchema();
      food.id = f.id;
      food.name = f.name;
      food.calories = f.calories;
      food.weight = f.weight;
      food.servings = f.servings;
      hiker.inventory.food.push(food);
    }
    
    // Starting water
    hiker.inventory.water = 2.0;
    hiker.inventory.waterCapacity = 3.0;
  }
  
  startGameLoop() {
    this.tickInterval = setInterval(() => {
      this.gameTick();
    }, this.TICK_RATE);
  }
  
  gameTick() {
    if (this.state.isPaused) return;
    
    this.state.tickCount++;
    
    // Advance time
    this.advanceTime();
    
    // Update phase based on time
    this.updatePhase();
    
    // Process each hiker
    this.state.hikers.forEach((hiker) => {
      if (hiker.isHiking) {
        this.processHiking(hiker);
      }
      
      if (hiker.isResting) {
        this.processResting(hiker);
      }
      
      // Always process status effects
      this.processStatusEffects(hiker);
    });
    
    // Random weather changes (every ~30 game minutes)
    if (this.state.tickCount % 30 === 0) {
      this.maybeChangeWeather();
    }
  }
  
  advanceTime() {
    this.state.time.minute += this.MINUTES_PER_TICK;
    
    if (this.state.time.minute >= 60) {
      this.state.time.minute = 0;
      this.state.time.hour++;
      
      if (this.state.time.hour >= 24) {
        this.state.time.hour = 0;
        this.state.time.day++;
        this.onNewDay();
      }
    }
  }
  
  updatePhase() {
    const hour = this.state.time.hour;
    
    if (hour >= 5 && hour < 8) {
      this.state.phase = "morning";
    } else if (hour >= 8 && hour < 18) {
      this.state.phase = "hiking";
    } else if (hour >= 18 && hour < 21) {
      this.state.phase = "evening";
    } else {
      this.state.phase = "night";
    }
  }
  
  onNewDay() {
    this.state.hikers.forEach((hiker) => {
      hiker.daysOnTrail++;
      hiker.currentDayMiles = 0;
      
      // Recover some energy overnight if resting
      if (hiker.isResting) {
        hiker.energy = Math.min(100, hiker.energy + 30);
        hiker.moodles.fatigue = Math.max(0, hiker.moodles.fatigue - 1);
      }
      
      // Morning hunger
      hiker.moodles.hunger = Math.min(4, hiker.moodles.hunger + 1);
    });
    
    this.addEvent("new_day", `Day ${this.state.time.day} begins`);
  }
  
  processHiking(hiker: HikerSchema) {
    const paceConfig = PACE_CONFIG[hiker.pace as keyof typeof PACE_CONFIG] || PACE_CONFIG.normal;
    
    // Calculate distance moved this tick (speed in mph, tick is 1 minute)
    const milesPerMinute = paceConfig.speed / 60;
    const distanceThisTick = milesPerMinute;
    
    // Check for getting lost
    if (hiker.lostState === "on_trail") {
      if (this.checkBlazeHit(hiker, distanceThisTick)) {
        hiker.lastBlazeSeenMile = hiker.mile;
      } else {
        // Chance to get lost increases with distance from last blaze
        const distFromBlaze = hiker.mile - hiker.lastBlazeSeenMile;
        const lostChance = distFromBlaze * 0.02 * paceConfig.blazeMiss * this.getWeatherBlazePenalty();
        
        if (Math.random() < lostChance) {
          hiker.lostState = "mildly_lost";
          hiker.moodles.anxiety = Math.min(4, hiker.moodles.anxiety + 1);
          this.addEvent("lost", `${hiker.name} has lost sight of the trail blazes!`);
        }
      }
    }
    
    // If lost, movement is slower and random
    if (hiker.lostState !== "on_trail") {
      // Can't make forward progress when lost
      this.processLostState(hiker);
      return;
    }
    
    // Move forward
    hiker.mile = Math.min(TRAIL_END_MILE, hiker.mile + distanceThisTick);
    hiker.currentDayMiles += distanceThisTick;
    hiker.totalMilesHiked += distanceThisTick;
    
    // Update elevation (simplified)
    hiker.elevation = this.getElevationAtMile(hiker.mile);
    
    // Consume resources
    hiker.calories -= 3 * paceConfig.fatigue; // Calories per minute
    hiker.hydration -= 0.5 * paceConfig.fatigue;
    hiker.energy -= 0.1 * paceConfig.fatigue;
    
    // Clamp values
    hiker.calories = Math.max(0, hiker.calories);
    hiker.hydration = Math.max(0, hiker.hydration);
    hiker.energy = Math.max(0, hiker.energy);
    
    // Check for reaching end
    if (hiker.mile >= TRAIL_END_MILE) {
      hiker.isHiking = false;
      this.addEvent("reached_neels", `${hiker.name} has reached Neels Gap! MVP complete!`);
    }
    
    // Skill gain
    this.gainSkillXP(hiker, "trailLegs", 0.01);
    this.gainSkillXP(hiker, "navigation", 0.005);
  }
  
  processLostState(hiker: HikerSchema) {
    // Being lost is stressful
    hiker.energy -= 0.2;
    hiker.moodles.anxiety = Math.min(4, hiker.moodles.anxiety);
    
    // Chance to worsen
    if (Math.random() < 0.01) {
      if (hiker.lostState === "mildly_lost") {
        hiker.lostState = "moderately_lost";
        hiker.moodles.anxiety = Math.min(4, hiker.moodles.anxiety + 1);
        this.addEvent("more_lost", `${hiker.name} is becoming more disoriented!`);
      } else if (hiker.lostState === "moderately_lost") {
        hiker.lostState = "severely_lost";
        hiker.moodles.anxiety = 4;
        this.addEvent("severely_lost", `${hiker.name} is severely lost! This is dangerous!`);
      }
    }
    
    // Small chance to find trail naturally (affected by navigation skill)
    const findChance = 0.005 * (1 + hiker.skills.navigation / 100);
    if (Math.random() < findChance) {
      this.findTrail(hiker);
    }
  }
  
  searchForBlaze(hiker: HikerSchema) {
    // Active searching takes time but better chance
    const baseChance = 0.15 + (hiker.skills.navigation / 200);
    const weatherMod = this.getWeatherBlazePenalty();
    const successChance = baseChance / weatherMod;
    
    if (Math.random() < successChance) {
      this.findTrail(hiker);
      this.gainSkillXP(hiker, "navigation", 0.5);
    } else {
      this.addEvent("search_fail", `${hiker.name} searches but doesn't find the trail yet...`);
    }
  }
  
  backtrack(hiker: HikerSchema) {
    // Backtracking is reliable but costs time
    const backtrackDistance = 0.1;
    hiker.mile = Math.max(0, hiker.mile - backtrackDistance);
    hiker.energy -= 5;
    
    // Higher chance of finding trail when backtracking
    const findChance = 0.3 + (hiker.skills.navigation / 150);
    if (Math.random() < findChance) {
      this.findTrail(hiker);
    }
    
    this.addEvent("backtrack", `${hiker.name} backtracks, looking for the last blaze...`);
  }
  
  findTrail(hiker: HikerSchema) {
    hiker.lostState = "on_trail";
    hiker.lastBlazeSeenMile = hiker.mile;
    hiker.moodles.anxiety = Math.max(0, hiker.moodles.anxiety - 2);
    this.addEvent("found_trail", `${hiker.name} found a white blaze! Back on trail at mile ${hiker.mile.toFixed(1)}`);
    this.gainSkillXP(hiker, "navigation", 1);
  }
  
  checkBlazeHit(hiker: HikerSchema, distance: number): boolean {
    // Check if we pass a blaze in this tick
    const startMile = hiker.mile;
    const endMile = hiker.mile + distance;
    
    for (const blazeMile of BLAZE_POSITIONS) {
      if (blazeMile > startMile && blazeMile <= endMile) {
        // Found a blaze! But might miss it based on conditions
        const missChance = this.getBlazesMissChance(hiker);
        return Math.random() > missChance;
      }
    }
    return false;
  }
  
  getBlazesMissChance(hiker: HikerSchema): number {
    const paceConfig = PACE_CONFIG[hiker.pace as keyof typeof PACE_CONFIG] || PACE_CONFIG.normal;
    let chance = 0.05 * paceConfig.blazeMiss;
    
    // Weather penalty
    chance *= this.getWeatherBlazePenalty();
    
    // Fatigue penalty
    if (hiker.moodles.fatigue >= 2) chance *= 1.5;
    if (hiker.moodles.fatigue >= 3) chance *= 2;
    
    // Skill bonus
    chance *= (1 - hiker.skills.navigation / 200);
    
    // Time of day
    const hour = this.state.time.hour;
    if (hour < 6 || hour > 20) chance *= 2; // Dawn/dusk
    if (hour < 5 || hour > 21) chance *= 3; // Night
    
    return Math.min(0.5, chance);
  }
  
  getWeatherBlazePenalty(): number {
    const effects = WEATHER_EFFECTS[this.state.weather as keyof typeof WEATHER_EFFECTS] || WEATHER_EFFECTS.clear;
    return 1 / effects.visibility;
  }
  
  processResting(hiker: HikerSchema) {
    // Resting recovers energy
    hiker.energy = Math.min(100, hiker.energy + 0.5);
    
    // Reduce fatigue slowly
    if (this.state.tickCount % 10 === 0) {
      hiker.moodles.fatigue = Math.max(0, hiker.moodles.fatigue - 0.1);
    }
    
    // Reduce anxiety
    if (this.state.tickCount % 20 === 0) {
      hiker.moodles.anxiety = Math.max(0, hiker.moodles.anxiety - 0.1);
    }
    
    // Camp craft skill gain
    this.gainSkillXP(hiker, "campCraft", 0.005);
  }
  
  processStatusEffects(hiker: HikerSchema) {
    // Hunger from low calories
    if (hiker.calories < 500) {
      hiker.moodles.hunger = 4;
    } else if (hiker.calories < 1000) {
      hiker.moodles.hunger = 3;
    } else if (hiker.calories < 1500) {
      hiker.moodles.hunger = 2;
    } else if (hiker.calories < 2000) {
      hiker.moodles.hunger = 1;
    } else {
      hiker.moodles.hunger = 0;
    }
    
    // Thirst from low hydration
    if (hiker.hydration < 20) {
      hiker.moodles.thirst = 4;
    } else if (hiker.hydration < 40) {
      hiker.moodles.thirst = 3;
    } else if (hiker.hydration < 60) {
      hiker.moodles.thirst = 2;
    } else if (hiker.hydration < 80) {
      hiker.moodles.thirst = 1;
    } else {
      hiker.moodles.thirst = 0;
    }
    
    // Fatigue from low energy
    if (hiker.energy < 20) {
      hiker.moodles.fatigue = 4;
    } else if (hiker.energy < 40) {
      hiker.moodles.fatigue = 3;
    } else if (hiker.energy < 60) {
      hiker.moodles.fatigue = 2;
    } else if (hiker.energy < 80) {
      hiker.moodles.fatigue = 1;
    }
    
    // Morale effects
    let moraleDelta = 0;
    if (hiker.moodles.hunger >= 3) moraleDelta -= 5;
    if (hiker.moodles.thirst >= 3) moraleDelta -= 5;
    if (hiker.moodles.fatigue >= 3) moraleDelta -= 3;
    if (hiker.moodles.anxiety >= 2) moraleDelta -= 5;
    
    // Weather effects on morale
    const weatherEffect = WEATHER_EFFECTS[this.state.weather as keyof typeof WEATHER_EFFECTS];
    if (weatherEffect) {
      moraleDelta += weatherEffect.moodMod / 100;
    }
    
    // Progress boosts morale
    if (hiker.currentDayMiles > 10) moraleDelta += 1;
    if (hiker.currentDayMiles > 15) moraleDelta += 1;
    
    hiker.moodles.morale = Math.max(-100, Math.min(100, hiker.moodles.morale + moraleDelta / 60));
    
    // Health impacts from severe conditions
    if (hiker.moodles.hunger >= 4 || hiker.moodles.thirst >= 4) {
      hiker.health -= 0.1;
    }
  }
  
  eatFood(hiker: HikerSchema, foodId: string) {
    const foodIndex = hiker.inventory.food.findIndex(f => f.id === foodId);
    if (foodIndex === -1) return;

    const food = hiker.inventory.food[foodIndex];
    if (!food || food.servings <= 0) return;

    // Consume one serving
    hiker.calories += food.calories;
    food.servings--;

    // Remove if empty
    if (food.servings <= 0) {
      hiker.inventory.food.splice(foodIndex, 1);
    }

    this.addEvent("eat", `${hiker.name} eats ${food.name}`);
    this.gainSkillXP(hiker, "trailCooking", 0.1);
  }
  
  maybeChangeWeather() {
    // Simple weather state machine
    const transitions: Record<string, Record<string, number>> = {
      clear: { clear: 0.7, cloudy: 0.25, fog: 0.05 },
      cloudy: { clear: 0.3, cloudy: 0.4, rain_light: 0.2, fog: 0.1 },
      rain_light: { cloudy: 0.3, rain_light: 0.4, rain_heavy: 0.2, clear: 0.1 },
      rain_heavy: { rain_light: 0.4, rain_heavy: 0.3, storm: 0.2, cloudy: 0.1 },
      fog: { fog: 0.5, clear: 0.3, cloudy: 0.2 },
      storm: { rain_heavy: 0.5, storm: 0.3, rain_light: 0.2 }
    };
    
    const currentWeather = this.state.weather;
    const possibleTransitions = transitions[currentWeather] || transitions.clear;
    
    let roll = Math.random();
    for (const [weather, chance] of Object.entries(possibleTransitions)) {
      roll -= chance;
      if (roll <= 0) {
        if (weather !== currentWeather) {
          this.state.weather = weather;
          this.addEvent("weather", `Weather changes to ${weather.replace('_', ' ')}`);
        }
        break;
      }
    }
  }
  
  gainSkillXP(hiker: HikerSchema, skill: string, amount: number) {
    const currentLevel = (hiker.skills as any)[skill] || 0;
    // Logarithmic progression - harder to level at higher skills
    const effectiveAmount = amount * (100 / (currentLevel + 50));
    (hiker.skills as any)[skill] = Math.min(100, currentLevel + effectiveAmount);
  }
  
  getElevationAtMile(mile: number): number {
    // Simplified elevation profile
    const elevations: [number, number][] = [
      [0, 3782], [0.9, 3420], [2.5, 3050], [2.8, 2530],
      [4.5, 2680], [6.0, 3450], [8.0, 3225], [10.5, 2560],
      [13.8, 3580], [15.8, 2784], [17.5, 3480], [20.2, 3173],
      [22.0, 3650], [24.5, 3280], [27.0, 3800], [29.5, 4458],
      [30.7, 3125]
    ];
    
    for (let i = 0; i < elevations.length - 1; i++) {
      if (mile >= elevations[i][0] && mile <= elevations[i + 1][0]) {
        const t = (mile - elevations[i][0]) / (elevations[i + 1][0] - elevations[i][0]);
        return Math.round(elevations[i][1] + t * (elevations[i + 1][1] - elevations[i][1]));
      }
    }
    return 3000;
  }
  
  addEvent(type: string, message: string) {
    const event = new EventSchema();
    event.id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    event.type = type;
    event.message = message;
    event.timestamp = this.state.time.day * 10000 + this.state.time.hour * 100 + this.state.time.minute;
    
    this.state.events.push(event);
    
    // Keep only last 20 events
    while (this.state.events.length > 20) {
      this.state.events.shift();
    }
  }
  
  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    // Client should send create_hiker message with their character info
  }
  
  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.hikers.delete(client.sessionId);
  }
  
  onDispose() {
    console.log("Room disposing...");
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }
}
