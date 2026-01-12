// ============================================
// TRAILHOGG + HOGGCOUNTRY - Comprehensive AT Gear Database
// Used by: Game inventory system + Site budget recommender
// ============================================

// Weight is in OUNCES (hikers think in oz, not lbs)
// Price is MSRP in USD
// Durability is estimated miles before replacement needed

export type GearCategory =
  | 'pack'
  | 'shelter'
  | 'sleep_bag'
  | 'sleep_pad'
  | 'cook_stove'
  | 'cook_pot'
  | 'cook_misc'
  | 'water_filter'
  | 'water_storage'
  | 'clothing_base'
  | 'clothing_insulation'
  | 'clothing_rain'
  | 'clothing_hiking'
  | 'footwear'
  | 'electronics'
  | 'navigation'
  | 'safety'
  | 'hygiene'
  | 'accessories';

export type BudgetTier = 'ultrabudget' | 'budget' | 'midrange' | 'lightweight' | 'ultralight';

export interface GearItem {
  id: string;
  name: string;
  brand: string;
  category: GearCategory;
  weightOz: number;          // Weight in ounces
  price: number;             // MSRP in USD
  budgetTier: BudgetTier;
  durabilityMiles: number;   // Estimated miles before replacement
  warmthRating?: number;     // For sleep items: degrees F
  capacity?: number;         // Liters for packs/water, watts for power banks
  description: string;
  amazonLink?: string;       // Affiliate link for site
  isEssential: boolean;      // Required for thru-hike?
  gameEffect?: {             // Effects in game
    energyRecovery?: number; // Bonus to energy recovery when resting
    speedMod?: number;       // Movement speed modifier
    weatherProtection?: number; // Protection from weather (0-100)
    comfortBonus?: number;   // Morale bonus
  };
}

// ============================================
// BACKPACKS
// ============================================
export const PACKS: GearItem[] = [
  // Ultrabudget
  {
    id: 'pack_amazon_basic',
    name: '60L Hiking Backpack',
    brand: 'Amazon Basics',
    category: 'pack',
    weightOz: 58,
    price: 45,
    budgetTier: 'ultrabudget',
    durabilityMiles: 800,
    capacity: 60,
    description: 'Heavy but cheap. Will get you there.',
    isEssential: true,
    gameEffect: { speedMod: 0.95 }
  },
  {
    id: 'pack_teton_scout',
    name: 'Scout 55L',
    brand: 'Teton Sports',
    category: 'pack',
    weightOz: 64,
    price: 70,
    budgetTier: 'ultrabudget',
    durabilityMiles: 1000,
    capacity: 55,
    description: 'Popular budget option. Decent comfort for the price.',
    isEssential: true,
    gameEffect: { speedMod: 0.96 }
  },
  // Budget
  {
    id: 'pack_osprey_atmos',
    name: 'Atmos AG 65',
    brand: 'Osprey',
    category: 'pack',
    weightOz: 72,
    price: 290,
    budgetTier: 'budget',
    durabilityMiles: 2500,
    capacity: 65,
    description: 'Legendary comfort. Anti-Gravity suspension. Lifetime warranty.',
    isEssential: true,
    gameEffect: { speedMod: 0.98, comfortBonus: 5 }
  },
  {
    id: 'pack_gregory_baltoro',
    name: 'Baltoro 65',
    brand: 'Gregory',
    category: 'pack',
    weightOz: 76,
    price: 300,
    budgetTier: 'budget',
    durabilityMiles: 2500,
    capacity: 65,
    description: 'Premium comfort pack. Great for heavy loads.',
    isEssential: true,
    gameEffect: { speedMod: 0.97, comfortBonus: 5 }
  },
  // Midrange
  {
    id: 'pack_osprey_exos',
    name: 'Exos 58',
    brand: 'Osprey',
    category: 'pack',
    weightOz: 38,
    price: 250,
    budgetTier: 'midrange',
    durabilityMiles: 2000,
    capacity: 58,
    description: 'Lightweight but still comfortable. Popular AT choice.',
    isEssential: true,
    gameEffect: { speedMod: 1.02 }
  },
  {
    id: 'pack_granite_crown2',
    name: 'Crown2 60',
    brand: 'Granite Gear',
    category: 'pack',
    weightOz: 38,
    price: 200,
    budgetTier: 'midrange',
    durabilityMiles: 2000,
    capacity: 60,
    description: 'Great value lightweight pack. Roll-top design.',
    isEssential: true,
    gameEffect: { speedMod: 1.02 }
  },
  // Lightweight
  {
    id: 'pack_ula_circuit',
    name: 'Circuit',
    brand: 'ULA',
    category: 'pack',
    weightOz: 39,
    price: 265,
    budgetTier: 'lightweight',
    durabilityMiles: 2500,
    capacity: 68,
    description: 'Cottage brand favorite. Great hipbelt. Made in USA.',
    isEssential: true,
    gameEffect: { speedMod: 1.03, comfortBonus: 3 }
  },
  {
    id: 'pack_gossamer_mariposa',
    name: 'Mariposa 60',
    brand: 'Gossamer Gear',
    category: 'pack',
    weightOz: 26,
    price: 270,
    budgetTier: 'lightweight',
    durabilityMiles: 2000,
    capacity: 60,
    description: 'Ultralight but can carry real loads. Sitpad included.',
    isEssential: true,
    gameEffect: { speedMod: 1.05 }
  },
  // Ultralight
  {
    id: 'pack_pa_v2',
    name: 'V2',
    brand: "Pa'lante",
    category: 'pack',
    weightOz: 16,
    price: 300,
    budgetTier: 'ultralight',
    durabilityMiles: 1500,
    capacity: 45,
    description: 'Minimalist cottage pack. For dialed-in UL hikers.',
    isEssential: true,
    gameEffect: { speedMod: 1.08 }
  },
  {
    id: 'pack_zpacks_arc',
    name: 'Arc Blast 55L',
    brand: 'Zpacks',
    category: 'pack',
    weightOz: 21,
    price: 399,
    budgetTier: 'ultralight',
    durabilityMiles: 2000,
    capacity: 55,
    description: 'DCF construction. Curved frame for airflow.',
    isEssential: true,
    gameEffect: { speedMod: 1.07, comfortBonus: 2 }
  },
];

// ============================================
// SHELTERS
// ============================================
export const SHELTERS: GearItem[] = [
  // Ultrabudget
  {
    id: 'shelter_amazon_tent',
    name: '2-Person Backpacking Tent',
    brand: 'Amazon Basics',
    category: 'shelter',
    weightOz: 72,
    price: 50,
    budgetTier: 'ultrabudget',
    durabilityMiles: 500,
    description: 'Will leak after heavy rain. Emergency backup only.',
    isEssential: true,
    gameEffect: { weatherProtection: 50, comfortBonus: -5 }
  },
  {
    id: 'shelter_kelty_late',
    name: 'Late Start 2',
    brand: 'Kelty',
    category: 'shelter',
    weightOz: 56,
    price: 100,
    budgetTier: 'ultrabudget',
    durabilityMiles: 1000,
    description: 'Decent budget tent. QuickCorner setup.',
    isEssential: true,
    gameEffect: { weatherProtection: 70 }
  },
  // Budget
  {
    id: 'shelter_rei_passage',
    name: 'Passage 2',
    brand: 'REI Co-op',
    category: 'shelter',
    weightOz: 82,
    price: 179,
    budgetTier: 'budget',
    durabilityMiles: 1500,
    description: 'Reliable entry-level tent. Great for beginners.',
    isEssential: true,
    gameEffect: { weatherProtection: 80 }
  },
  {
    id: 'shelter_msr_hubba',
    name: 'Hubba Hubba 2',
    brand: 'MSR',
    category: 'shelter',
    weightOz: 54,
    price: 450,
    budgetTier: 'budget',
    durabilityMiles: 2500,
    description: 'Classic backpacking tent. Bomber in storms.',
    isEssential: true,
    gameEffect: { weatherProtection: 95, comfortBonus: 5 }
  },
  // Midrange
  {
    id: 'shelter_ba_copper',
    name: 'Copper Spur HV UL2',
    brand: 'Big Agnes',
    category: 'shelter',
    weightOz: 44,
    price: 500,
    budgetTier: 'midrange',
    durabilityMiles: 2000,
    description: 'Best-selling UL tent. Roomy interior.',
    isEssential: true,
    gameEffect: { weatherProtection: 90, comfortBonus: 5, speedMod: 1.01 }
  },
  {
    id: 'shelter_nemo_hornet',
    name: 'Hornet Elite 2P',
    brand: 'Nemo',
    category: 'shelter',
    weightOz: 32,
    price: 480,
    budgetTier: 'midrange',
    durabilityMiles: 1800,
    description: 'Ultra-ultralight freestanding. Tight squeeze.',
    isEssential: true,
    gameEffect: { weatherProtection: 85, speedMod: 1.02 }
  },
  // Lightweight (Tarps/Hammocks)
  {
    id: 'shelter_mld_grace',
    name: 'Grace Duo Tarp',
    brand: 'MLD',
    category: 'shelter',
    weightOz: 13,
    price: 195,
    budgetTier: 'lightweight',
    durabilityMiles: 2500,
    description: 'Silnylon A-frame tarp. Requires skills to pitch.',
    isEssential: true,
    gameEffect: { weatherProtection: 70, speedMod: 1.04 }
  },
  {
    id: 'shelter_ee_revolt',
    name: 'Revolt Hammock',
    brand: 'Enlightened Equipment',
    category: 'shelter',
    weightOz: 19,
    price: 165,
    budgetTier: 'lightweight',
    durabilityMiles: 3000,
    description: 'Full hammock system. Need trees and underquilt.',
    isEssential: true,
    gameEffect: { weatherProtection: 60, comfortBonus: 10 }
  },
  // Ultralight
  {
    id: 'shelter_zpacks_duplex',
    name: 'Duplex',
    brand: 'Zpacks',
    category: 'shelter',
    weightOz: 19,
    price: 699,
    budgetTier: 'ultralight',
    durabilityMiles: 2000,
    description: 'DCF trekking pole tent. The UL gold standard.',
    isEssential: true,
    gameEffect: { weatherProtection: 85, speedMod: 1.05, comfortBonus: 3 }
  },
  {
    id: 'shelter_tarptent_notch',
    name: 'Notch Li',
    brand: 'Tarptent',
    category: 'shelter',
    weightOz: 18,
    price: 429,
    budgetTier: 'ultralight',
    durabilityMiles: 2000,
    description: 'DCF single-wall. Great value UL shelter.',
    isEssential: true,
    gameEffect: { weatherProtection: 82, speedMod: 1.05 }
  },
];

// ============================================
// SLEEP SYSTEM - BAGS/QUILTS
// ============================================
export const SLEEP_BAGS: GearItem[] = [
  // Ultrabudget
  {
    id: 'sleep_hyke_20',
    name: 'Eolus 20°F',
    brand: 'Hyke & Byke',
    category: 'sleep_bag',
    weightOz: 48,
    price: 165,
    budgetTier: 'ultrabudget',
    durabilityMiles: 1500,
    warmthRating: 20,
    description: 'Best budget down bag. 800FP down.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.0 }
  },
  {
    id: 'sleep_kelty_cosmic',
    name: 'Cosmic 20',
    brand: 'Kelty',
    category: 'sleep_bag',
    weightOz: 46,
    price: 150,
    budgetTier: 'ultrabudget',
    durabilityMiles: 1500,
    warmthRating: 20,
    description: 'DriDown fill. Solid budget choice.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.0 }
  },
  // Budget
  {
    id: 'sleep_rei_magma',
    name: 'Magma 15',
    brand: 'REI Co-op',
    category: 'sleep_bag',
    weightOz: 32,
    price: 369,
    budgetTier: 'budget',
    durabilityMiles: 2500,
    warmthRating: 15,
    description: '850FP down. Great warmth-to-weight.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.1, comfortBonus: 3 }
  },
  {
    id: 'sleep_marmot_phase',
    name: 'Phase 20',
    brand: 'Marmot',
    category: 'sleep_bag',
    weightOz: 37,
    price: 279,
    budgetTier: 'budget',
    durabilityMiles: 2000,
    warmthRating: 20,
    description: '850FP down. Trusted brand.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.05 }
  },
  // Midrange (Quilts!)
  {
    id: 'sleep_ee_enigma',
    name: 'Enigma 20°F',
    brand: 'Enlightened Equipment',
    category: 'sleep_bag',
    weightOz: 22,
    price: 310,
    budgetTier: 'midrange',
    durabilityMiles: 2500,
    warmthRating: 20,
    description: 'Popular quilt choice. Custom colors and fill.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.1, speedMod: 1.01 }
  },
  {
    id: 'sleep_hammock_econ',
    name: 'Econ Burrow 20',
    brand: 'Hammock Gear',
    category: 'sleep_bag',
    weightOz: 24,
    price: 200,
    budgetTier: 'midrange',
    durabilityMiles: 2500,
    warmthRating: 20,
    description: 'Best value quilt. 850FP down.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.1 }
  },
  // Lightweight
  {
    id: 'sleep_wm_ultralite',
    name: 'UltraLite 20',
    brand: 'Western Mountaineering',
    category: 'sleep_bag',
    weightOz: 28,
    price: 530,
    budgetTier: 'lightweight',
    durabilityMiles: 3000,
    warmthRating: 20,
    description: 'Legendary quality. Made in USA. Lasts forever.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.15, comfortBonus: 5 }
  },
  {
    id: 'sleep_ff_tanager',
    name: 'Tanager 20 CFL',
    brand: 'Feathered Friends',
    category: 'sleep_bag',
    weightOz: 27,
    price: 459,
    budgetTier: 'lightweight',
    durabilityMiles: 3000,
    warmthRating: 20,
    description: 'Seattle-made. 950FP down. Incredible loft.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.15, comfortBonus: 5 }
  },
  // Ultralight
  {
    id: 'sleep_nunatak_arc',
    name: 'Arc UL 20',
    brand: 'Nunatak',
    category: 'sleep_bag',
    weightOz: 18,
    price: 485,
    budgetTier: 'ultralight',
    durabilityMiles: 2500,
    warmthRating: 20,
    description: 'Premium custom quilt. Differential cut.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.15, speedMod: 1.02 }
  },
  {
    id: 'sleep_katabatic_palisade',
    name: 'Palisade 15',
    brand: 'Katabatic',
    category: 'sleep_bag',
    weightOz: 22,
    price: 400,
    budgetTier: 'ultralight',
    durabilityMiles: 2500,
    warmthRating: 15,
    description: 'Pad attachment system. No drafts.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.2, speedMod: 1.02 }
  },
];

// ============================================
// SLEEP SYSTEM - PADS
// ============================================
export const SLEEP_PADS: GearItem[] = [
  // Ultrabudget
  {
    id: 'pad_klymit_static',
    name: 'Static V',
    brand: 'Klymit',
    category: 'sleep_pad',
    weightOz: 18,
    price: 45,
    budgetTier: 'ultrabudget',
    durabilityMiles: 1000,
    description: 'Best cheap pad. V-chamber design.',
    isEssential: true,
    gameEffect: { energyRecovery: 0.95 }
  },
  {
    id: 'pad_foam_zlite',
    name: 'Z Lite Sol',
    brand: 'Therm-a-Rest',
    category: 'sleep_pad',
    weightOz: 14,
    price: 50,
    budgetTier: 'ultrabudget',
    durabilityMiles: 3000,
    description: 'Indestructible CCF. No punctures ever.',
    isEssential: true,
    gameEffect: { energyRecovery: 0.9, comfortBonus: -3 }
  },
  // Budget
  {
    id: 'pad_nemo_tensor',
    name: 'Tensor Insulated',
    brand: 'Nemo',
    category: 'sleep_pad',
    weightOz: 15,
    price: 200,
    budgetTier: 'budget',
    durabilityMiles: 1500,
    description: 'Quiet fabric. Great 3-season warmth.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.05, comfortBonus: 3 }
  },
  {
    id: 'pad_tar_neoair',
    name: 'NeoAir XLite',
    brand: 'Therm-a-Rest',
    category: 'sleep_pad',
    weightOz: 12,
    price: 200,
    budgetTier: 'budget',
    durabilityMiles: 2000,
    description: 'Classic UL pad. Crinkly but warm.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.05, speedMod: 1.01 }
  },
  // Midrange
  {
    id: 'pad_sea_ether',
    name: 'Ether Light XT Insulated',
    brand: 'Sea to Summit',
    category: 'sleep_pad',
    weightOz: 15,
    price: 220,
    budgetTier: 'midrange',
    durabilityMiles: 1500,
    description: 'Air Sprung Cells. Most comfortable inflatable.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.1, comfortBonus: 5 }
  },
  // Lightweight
  {
    id: 'pad_tar_uberlite',
    name: 'NeoAir UberLite',
    brand: 'Therm-a-Rest',
    category: 'sleep_pad',
    weightOz: 8.8,
    price: 200,
    budgetTier: 'lightweight',
    durabilityMiles: 1000,
    description: 'Featherlight. Fragile but amazing weight.',
    isEssential: true,
    gameEffect: { energyRecovery: 1.0, speedMod: 1.02 }
  },
  // Ultralight
  {
    id: 'pad_gossamer_thinlight',
    name: 'Thinlight + 1/8" CCF',
    brand: 'Gossamer Gear',
    category: 'sleep_pad',
    weightOz: 4,
    price: 25,
    budgetTier: 'ultralight',
    durabilityMiles: 5000,
    description: 'Gram counter special. Use with quilt.',
    isEssential: true,
    gameEffect: { energyRecovery: 0.85, speedMod: 1.03 }
  },
];

// ============================================
// COOK SYSTEM
// ============================================
export const COOK_STOVES: GearItem[] = [
  // Ultrabudget
  {
    id: 'stove_brs_3000',
    name: 'BRS-3000T',
    brand: 'BRS',
    category: 'cook_stove',
    weightOz: 0.9,
    price: 20,
    budgetTier: 'ultrabudget',
    durabilityMiles: 1000,
    description: 'Gram-counter favorite. Fragile but works.',
    isEssential: false,
    gameEffect: {}
  },
  // Budget
  {
    id: 'stove_msr_pocket',
    name: 'PocketRocket 2',
    brand: 'MSR',
    category: 'cook_stove',
    weightOz: 2.6,
    price: 50,
    budgetTier: 'budget',
    durabilityMiles: 3000,
    description: 'Reliable classic. Will outlast your hike.',
    isEssential: false,
    gameEffect: {}
  },
  {
    id: 'stove_jetboil_flash',
    name: 'Flash',
    brand: 'Jetboil',
    category: 'cook_stove',
    weightOz: 13.1,
    price: 120,
    budgetTier: 'budget',
    durabilityMiles: 3000,
    description: 'All-in-one system. Boils water crazy fast.',
    isEssential: false,
    gameEffect: { comfortBonus: 2 }
  },
  // Midrange
  {
    id: 'stove_soto_windmaster',
    name: 'WindMaster',
    brand: 'Soto',
    category: 'cook_stove',
    weightOz: 2.3,
    price: 80,
    budgetTier: 'midrange',
    durabilityMiles: 3000,
    description: 'Best wind resistance. Works in any conditions.',
    isEssential: false,
    gameEffect: {}
  },
  // Ultralight (alcohol/cold soak)
  {
    id: 'stove_trail_designs',
    name: 'Caldera Cone Ti-Tri',
    brand: 'Trail Designs',
    category: 'cook_stove',
    weightOz: 3.2,
    price: 90,
    budgetTier: 'ultralight',
    durabilityMiles: 5000,
    description: 'Alcohol + Esbit + wood. Versatile system.',
    isEssential: false,
    gameEffect: { speedMod: 1.01 }
  },
  {
    id: 'stove_cold_soak',
    name: 'Cold Soak Jar',
    brand: 'Talenti',
    category: 'cook_stove',
    weightOz: 2.2,
    price: 8,
    budgetTier: 'ultralight',
    durabilityMiles: 10000,
    description: 'No cook life. Just add cold water and wait.',
    isEssential: false,
    gameEffect: { speedMod: 1.02, comfortBonus: -5 }
  },
];

export const COOK_POTS: GearItem[] = [
  {
    id: 'pot_toaks_750',
    name: '750ml Titanium Pot',
    brand: 'Toaks',
    category: 'cook_pot',
    weightOz: 3.6,
    price: 40,
    budgetTier: 'budget',
    durabilityMiles: 5000,
    capacity: 0.75,
    description: 'Perfect solo pot. Fits 110g canister.',
    isEssential: false,
  },
  {
    id: 'pot_msr_titan',
    name: 'Titan Kettle',
    brand: 'MSR',
    category: 'cook_pot',
    weightOz: 4.2,
    price: 60,
    budgetTier: 'midrange',
    durabilityMiles: 5000,
    capacity: 0.85,
    description: 'Pour spout and strainer lid.',
    isEssential: false,
  },
];

// ============================================
// WATER SYSTEM
// ============================================
export const WATER_FILTERS: GearItem[] = [
  // Ultrabudget
  {
    id: 'filter_sawyer_mini',
    name: 'Sawyer Mini',
    brand: 'Sawyer',
    category: 'water_filter',
    weightOz: 2,
    price: 25,
    budgetTier: 'ultrabudget',
    durabilityMiles: 2000,
    description: 'Filters 100k gallons. Slow flow rate.',
    isEssential: true,
  },
  // Budget
  {
    id: 'filter_sawyer_squeeze',
    name: 'Sawyer Squeeze',
    brand: 'Sawyer',
    category: 'water_filter',
    weightOz: 3,
    price: 37,
    budgetTier: 'budget',
    durabilityMiles: 3000,
    description: 'THE thru-hiker filter. Fast flow, reliable.',
    isEssential: true,
  },
  {
    id: 'filter_katadyn_befree',
    name: 'BeFree 1L',
    brand: 'Katadyn',
    category: 'water_filter',
    weightOz: 2,
    price: 45,
    budgetTier: 'budget',
    durabilityMiles: 1500,
    description: 'Fastest flow. Soft flask integration.',
    isEssential: true,
  },
  // Midrange
  {
    id: 'filter_platypus_quick',
    name: 'QuickDraw Micro',
    brand: 'Platypus',
    category: 'water_filter',
    weightOz: 2.3,
    price: 45,
    budgetTier: 'midrange',
    durabilityMiles: 2500,
    description: 'Best of both worlds. Reliable + fast.',
    isEssential: true,
  },
  // Ultralight (chemical)
  {
    id: 'filter_aquamira',
    name: 'Aquamira Drops',
    brand: 'Aquamira',
    category: 'water_filter',
    weightOz: 3,
    price: 15,
    budgetTier: 'ultralight',
    durabilityMiles: 500,
    description: 'Chemical treatment. 30 min wait time.',
    isEssential: true,
  },
];

export const WATER_STORAGE: GearItem[] = [
  {
    id: 'bottle_smart_1l',
    name: 'Smart Water 1L',
    brand: 'Glaceau',
    category: 'water_storage',
    weightOz: 1.4,
    price: 3,
    budgetTier: 'ultrabudget',
    durabilityMiles: 500,
    capacity: 1,
    description: 'Hiker trash special. Sawyer threads.',
    isEssential: true,
  },
  {
    id: 'bladder_cnoc_vecto',
    name: 'Vecto 3L',
    brand: 'CNOC',
    category: 'water_storage',
    weightOz: 3.4,
    price: 35,
    budgetTier: 'budget',
    durabilityMiles: 2000,
    capacity: 3,
    description: 'Wide mouth dirty water bag. Sawyer compatible.',
    isEssential: true,
  },
];

// ============================================
// CLOTHING
// ============================================
export const CLOTHING_BASE: GearItem[] = [
  {
    id: 'base_walmart_athletic',
    name: 'Athletic Works Tee',
    brand: 'Walmart',
    category: 'clothing_base',
    weightOz: 5,
    price: 8,
    budgetTier: 'ultrabudget',
    durabilityMiles: 500,
    description: 'Cheap polyester. Gets stinky fast.',
    isEssential: true,
  },
  {
    id: 'base_patagonia_cap',
    name: 'Capilene Cool Daily',
    brand: 'Patagonia',
    category: 'clothing_base',
    weightOz: 4,
    price: 49,
    budgetTier: 'budget',
    durabilityMiles: 2000,
    description: 'Polygiene odor control. Sun hoody popular.',
    isEssential: true,
  },
  {
    id: 'base_wool_150',
    name: '150 Merino Tee',
    brand: 'Smartwool',
    category: 'clothing_base',
    weightOz: 5,
    price: 75,
    budgetTier: 'midrange',
    durabilityMiles: 1500,
    description: 'Merino wool. Natural odor resistance.',
    isEssential: true,
  },
];

export const CLOTHING_INSULATION: GearItem[] = [
  {
    id: 'puffy_amazon_down',
    name: 'Packable Down Jacket',
    brand: 'Amazon Essentials',
    category: 'clothing_insulation',
    weightOz: 13,
    price: 40,
    budgetTier: 'ultrabudget',
    durabilityMiles: 500,
    warmthRating: 40,
    description: 'Cheap warmth. Not very durable.',
    isEssential: true,
    gameEffect: { weatherProtection: 30 }
  },
  {
    id: 'puffy_decathlon_trek',
    name: 'Trek 100 Down',
    brand: 'Decathlon',
    category: 'clothing_insulation',
    weightOz: 10,
    price: 60,
    budgetTier: 'budget',
    durabilityMiles: 1000,
    warmthRating: 35,
    description: 'Best value puffy. Surprising quality.',
    isEssential: true,
    gameEffect: { weatherProtection: 40 }
  },
  {
    id: 'puffy_ghost_whisperer',
    name: 'Ghost Whisperer/2',
    brand: 'Mountain Hardwear',
    category: 'clothing_insulation',
    weightOz: 7.6,
    price: 325,
    budgetTier: 'midrange',
    durabilityMiles: 2000,
    warmthRating: 35,
    description: 'Iconic UL puffy. 1000FP down.',
    isEssential: true,
    gameEffect: { weatherProtection: 45, speedMod: 1.01 }
  },
  {
    id: 'puffy_arcteryx_cerium',
    name: 'Cerium LT',
    brand: "Arc'teryx",
    category: 'clothing_insulation',
    weightOz: 9.9,
    price: 400,
    budgetTier: 'lightweight',
    durabilityMiles: 3000,
    warmthRating: 30,
    description: 'Premium down/synthetic blend. Durable.',
    isEssential: true,
    gameEffect: { weatherProtection: 50, comfortBonus: 3 }
  },
];

export const CLOTHING_RAIN: GearItem[] = [
  {
    id: 'rain_frogg_toggs',
    name: 'Ultra-Lite2 Jacket',
    brand: 'Frogg Toggs',
    category: 'clothing_rain',
    weightOz: 5.5,
    price: 20,
    budgetTier: 'ultrabudget',
    durabilityMiles: 500,
    description: 'Tear it up, buy another. Dirt cheap.',
    isEssential: true,
    gameEffect: { weatherProtection: 60 }
  },
  {
    id: 'rain_marmot_precip',
    name: 'PreCip Eco',
    brand: 'Marmot',
    category: 'clothing_rain',
    weightOz: 10,
    price: 100,
    budgetTier: 'budget',
    durabilityMiles: 1500,
    description: 'Reliable budget rain jacket.',
    isEssential: true,
    gameEffect: { weatherProtection: 75 }
  },
  {
    id: 'rain_outdoor_research',
    name: 'Helium Rain Jacket',
    brand: 'Outdoor Research',
    category: 'clothing_rain',
    weightOz: 6.4,
    price: 169,
    budgetTier: 'midrange',
    durabilityMiles: 2000,
    description: 'Lightweight and packable. Pertex Shield.',
    isEssential: true,
    gameEffect: { weatherProtection: 80, speedMod: 1.01 }
  },
  {
    id: 'rain_montbell_versalite',
    name: 'Versalite Jacket',
    brand: 'Montbell',
    category: 'clothing_rain',
    weightOz: 6.4,
    price: 225,
    budgetTier: 'lightweight',
    durabilityMiles: 2000,
    description: 'Japanese engineering. Lightest 3L.',
    isEssential: true,
    gameEffect: { weatherProtection: 85, speedMod: 1.02 }
  },
  {
    id: 'rain_arcteryx_norvan',
    name: 'Norvan LT',
    brand: "Arc'teryx",
    category: 'clothing_rain',
    weightOz: 4.2,
    price: 350,
    budgetTier: 'ultralight',
    durabilityMiles: 1500,
    description: 'Trail running rain shell. Barely there.',
    isEssential: true,
    gameEffect: { weatherProtection: 75, speedMod: 1.03 }
  },
];

// ============================================
// FOOTWEAR
// ============================================
export const FOOTWEAR: GearItem[] = [
  {
    id: 'shoe_merrell_moab',
    name: 'Moab 3',
    brand: 'Merrell',
    category: 'footwear',
    weightOz: 34,
    price: 135,
    budgetTier: 'budget',
    durabilityMiles: 500,
    description: 'Entry-level trail runner. Reliable.',
    isEssential: true,
    gameEffect: { speedMod: 1.0 }
  },
  {
    id: 'shoe_brooks_cascadia',
    name: 'Cascadia 17',
    brand: 'Brooks',
    category: 'footwear',
    weightOz: 22,
    price: 140,
    budgetTier: 'budget',
    durabilityMiles: 400,
    description: 'Popular AT choice. Good grip.',
    isEssential: true,
    gameEffect: { speedMod: 1.02 }
  },
  {
    id: 'shoe_altra_lone',
    name: 'Lone Peak 8',
    brand: 'Altra',
    category: 'footwear',
    weightOz: 21,
    price: 150,
    budgetTier: 'midrange',
    durabilityMiles: 400,
    description: 'Zero drop, wide toe box. Cult following.',
    isEssential: true,
    gameEffect: { speedMod: 1.03, comfortBonus: 3 }
  },
  {
    id: 'shoe_hoka_speedgoat',
    name: 'Speedgoat 5',
    brand: 'Hoka',
    category: 'footwear',
    weightOz: 21,
    price: 155,
    budgetTier: 'midrange',
    durabilityMiles: 400,
    description: 'Max cushion. Great for rocky terrain.',
    isEssential: true,
    gameEffect: { speedMod: 1.02, comfortBonus: 5 }
  },
  {
    id: 'shoe_salomon_sense',
    name: 'Sense Ride 5',
    brand: 'Salomon',
    category: 'footwear',
    weightOz: 19,
    price: 140,
    budgetTier: 'midrange',
    durabilityMiles: 500,
    description: 'Fast and nimble. Good all-rounder.',
    isEssential: true,
    gameEffect: { speedMod: 1.04 }
  },
];

// ============================================
// ELECTRONICS
// ============================================
export const ELECTRONICS: GearItem[] = [
  // Headlamps
  {
    id: 'headlamp_petzl_e_lite',
    name: 'e+LITE',
    brand: 'Petzl',
    category: 'electronics',
    weightOz: 0.9,
    price: 35,
    budgetTier: 'ultralight',
    durabilityMiles: 5000,
    description: 'Emergency backup. 50 lumens.',
    isEssential: true,
  },
  {
    id: 'headlamp_nitecore_nu25',
    name: 'NU25',
    brand: 'Nitecore',
    category: 'electronics',
    weightOz: 1.1,
    price: 36,
    budgetTier: 'ultralight',
    durabilityMiles: 5000,
    description: 'UL favorite. USB rechargeable.',
    isEssential: true,
  },
  {
    id: 'headlamp_petzl_actik',
    name: 'Actik Core',
    brand: 'Petzl',
    category: 'electronics',
    weightOz: 2.9,
    price: 60,
    budgetTier: 'budget',
    durabilityMiles: 5000,
    description: 'Great all-around. 600 lumens.',
    isEssential: true,
  },
  // Power banks
  {
    id: 'power_anker_10k',
    name: 'PowerCore 10000',
    brand: 'Anker',
    category: 'electronics',
    weightOz: 6.4,
    price: 26,
    budgetTier: 'budget',
    durabilityMiles: 5000,
    capacity: 10000,
    description: 'Reliable, affordable. 3 phone charges.',
    isEssential: false,
  },
  {
    id: 'power_nitecore_10k',
    name: 'NB10000',
    brand: 'Nitecore',
    category: 'electronics',
    weightOz: 5.3,
    price: 50,
    budgetTier: 'midrange',
    durabilityMiles: 5000,
    capacity: 10000,
    description: 'Lighter with same capacity. PD fast charge.',
    isEssential: false,
  },
];

// ============================================
// SAFETY
// ============================================
export const SAFETY: GearItem[] = [
  {
    id: 'plb_acr_resqlink',
    name: 'ResQLink 400',
    brand: 'ACR',
    category: 'safety',
    weightOz: 5.4,
    price: 290,
    budgetTier: 'midrange',
    durabilityMiles: 10000,
    description: 'PLB. One-time use SOS. No subscription.',
    isEssential: false,
    gameEffect: {}
  },
  {
    id: 'plb_garmin_inreach',
    name: 'InReach Mini 2',
    brand: 'Garmin',
    category: 'safety',
    weightOz: 3.5,
    price: 400,
    budgetTier: 'lightweight',
    durabilityMiles: 10000,
    description: 'Two-way messaging + SOS. Requires subscription.',
    isEssential: false,
    gameEffect: {}
  },
  {
    id: 'firstaid_litesmith',
    name: 'Custom First Aid Kit',
    brand: 'LiteSmith',
    category: 'safety',
    weightOz: 4,
    price: 30,
    budgetTier: 'ultralight',
    durabilityMiles: 2000,
    description: 'DIY kit. Leukotape, ibuprofen, bandages.',
    isEssential: true,
  },
];

// ============================================
// ACCESSORIES
// ============================================
export const ACCESSORIES: GearItem[] = [
  // Trekking poles
  {
    id: 'poles_cascade_carbon',
    name: 'Carbon Fiber Quick Lock',
    brand: 'Cascade Mountain Tech',
    category: 'accessories',
    weightOz: 16,
    price: 45,
    budgetTier: 'ultrabudget',
    durabilityMiles: 1500,
    description: 'Costco special. Great value.',
    isEssential: false,
    gameEffect: { speedMod: 1.05 }
  },
  {
    id: 'poles_bd_distance',
    name: 'Distance Carbon FLZ',
    brand: 'Black Diamond',
    category: 'accessories',
    weightOz: 17,
    price: 180,
    budgetTier: 'midrange',
    durabilityMiles: 2500,
    description: 'Z-fold. Great for UL tent setup.',
    isEssential: false,
    gameEffect: { speedMod: 1.07 }
  },
  {
    id: 'poles_gossamer_lt5',
    name: 'LT5 Carbon',
    brand: 'Gossamer Gear',
    category: 'accessories',
    weightOz: 10.4,
    price: 195,
    budgetTier: 'lightweight',
    durabilityMiles: 2000,
    description: 'Ultralight carbon. Tent-height compatible.',
    isEssential: false,
    gameEffect: { speedMod: 1.08 }
  },
  // Misc
  {
    id: 'knife_opinel',
    name: 'No.6 Carbon',
    brand: 'Opinel',
    category: 'accessories',
    weightOz: 1.1,
    price: 16,
    budgetTier: 'budget',
    durabilityMiles: 10000,
    description: 'Simple folding knife. Classic.',
    isEssential: false,
  },
  {
    id: 'hygiene_trowel',
    name: 'Deuce #3',
    brand: 'TheTentLab',
    category: 'hygiene',
    weightOz: 0.6,
    price: 25,
    budgetTier: 'ultralight',
    durabilityMiles: 10000,
    description: 'UL trowel. Leave No Trace.',
    isEssential: true,
  },
];

// ============================================
// BUDGET LOADOUTS
// ============================================
export interface GearLoadout {
  name: string;
  budgetTier: BudgetTier;
  targetBudget: { min: number; max: number };
  baseWeight: number;  // In ounces (without food/water)
  items: string[];     // Array of gear IDs
  description: string;
}

export const BUDGET_LOADOUTS: GearLoadout[] = [
  {
    name: 'Broke College Kid',
    budgetTier: 'ultrabudget',
    targetBudget: { min: 300, max: 500 },
    baseWeight: 320, // 20 lbs
    items: [
      'pack_teton_scout',
      'shelter_kelty_late',
      'sleep_hyke_20',
      'pad_klymit_static',
      'stove_brs_3000',
      'pot_toaks_750',
      'filter_sawyer_mini',
      'bottle_smart_1l',
      'base_walmart_athletic',
      'puffy_amazon_down',
      'rain_frogg_toggs',
      'shoe_merrell_moab',
      'headlamp_petzl_actik',
      'poles_cascade_carbon',
      'firstaid_litesmith',
      'hygiene_trowel',
    ],
    description: 'Heavy but functional. Proves you dont need money to thru-hike.',
  },
  {
    name: 'Smart Starter',
    budgetTier: 'budget',
    targetBudget: { min: 800, max: 1200 },
    baseWeight: 256, // 16 lbs
    items: [
      'pack_osprey_exos',
      'shelter_ba_copper',
      'sleep_rei_magma',
      'pad_tar_neoair',
      'stove_msr_pocket',
      'pot_toaks_750',
      'filter_sawyer_squeeze',
      'bottle_smart_1l',
      'bladder_cnoc_vecto',
      'base_patagonia_cap',
      'puffy_decathlon_trek',
      'rain_marmot_precip',
      'shoe_altra_lone',
      'headlamp_nitecore_nu25',
      'power_anker_10k',
      'poles_cascade_carbon',
      'firstaid_litesmith',
      'hygiene_trowel',
    ],
    description: 'Best bang for buck. Quality where it matters.',
  },
  {
    name: 'Balanced Hiker',
    budgetTier: 'midrange',
    targetBudget: { min: 1500, max: 2200 },
    baseWeight: 192, // 12 lbs
    items: [
      'pack_ula_circuit',
      'shelter_ba_copper',
      'sleep_ee_enigma',
      'pad_nemo_tensor',
      'stove_soto_windmaster',
      'pot_msr_titan',
      'filter_platypus_quick',
      'bottle_smart_1l',
      'bladder_cnoc_vecto',
      'base_wool_150',
      'puffy_ghost_whisperer',
      'rain_outdoor_research',
      'shoe_altra_lone',
      'headlamp_nitecore_nu25',
      'power_nitecore_10k',
      'poles_bd_distance',
      'plb_acr_resqlink',
      'firstaid_litesmith',
      'hygiene_trowel',
    ],
    description: 'Comfort meets weight savings. Great all-around kit.',
  },
  {
    name: 'Gram Weenie',
    budgetTier: 'lightweight',
    targetBudget: { min: 2500, max: 3500 },
    baseWeight: 144, // 9 lbs
    items: [
      'pack_gossamer_mariposa',
      'shelter_zpacks_duplex',
      'sleep_wm_ultralite',
      'pad_tar_uberlite',
      'stove_trail_designs',
      'pot_toaks_750',
      'filter_katadyn_befree',
      'bottle_smart_1l',
      'base_patagonia_cap',
      'puffy_arcteryx_cerium',
      'rain_montbell_versalite',
      'shoe_altra_lone',
      'headlamp_nitecore_nu25',
      'power_nitecore_10k',
      'poles_gossamer_lt5',
      'plb_garmin_inreach',
      'firstaid_litesmith',
      'hygiene_trowel',
    ],
    description: 'Sub-10lb base weight. Cottage gear and optimized choices.',
  },
  {
    name: 'Ultralight Dream',
    budgetTier: 'ultralight',
    targetBudget: { min: 4000, max: 5500 },
    baseWeight: 112, // 7 lbs
    items: [
      'pack_zpacks_arc',
      'shelter_zpacks_duplex',
      'sleep_katabatic_palisade',
      'pad_gossamer_thinlight',
      'stove_cold_soak',
      'filter_aquamira',
      'bottle_smart_1l',
      'base_patagonia_cap',
      'puffy_ghost_whisperer',
      'rain_arcteryx_norvan',
      'shoe_altra_lone',
      'headlamp_petzl_e_lite',
      'poles_gossamer_lt5',
      'plb_garmin_inreach',
      'firstaid_litesmith',
      'hygiene_trowel',
    ],
    description: 'Every gram counts. DCF and titanium everything. Cold soak life.',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get all gear items as a flat array
export function getAllGear(): GearItem[] {
  return [
    ...PACKS,
    ...SHELTERS,
    ...SLEEP_BAGS,
    ...SLEEP_PADS,
    ...COOK_STOVES,
    ...COOK_POTS,
    ...WATER_FILTERS,
    ...WATER_STORAGE,
    ...CLOTHING_BASE,
    ...CLOTHING_INSULATION,
    ...CLOTHING_RAIN,
    ...FOOTWEAR,
    ...ELECTRONICS,
    ...SAFETY,
    ...ACCESSORIES,
  ];
}

// Get gear item by ID
export function getGearById(id: string): GearItem | undefined {
  return getAllGear().find(item => item.id === id);
}

// Get gear for a specific loadout
export function getLoadoutGear(loadout: GearLoadout): GearItem[] {
  return loadout.items
    .map(id => getGearById(id))
    .filter((item): item is GearItem => item !== undefined);
}

// Calculate total weight (in oz) for a list of gear IDs
export function calculateWeight(gearIds: string[]): number {
  return gearIds.reduce((total, id) => {
    const item = getGearById(id);
    return total + (item?.weightOz || 0);
  }, 0);
}

// Calculate total price for a list of gear IDs
export function calculatePrice(gearIds: string[]): number {
  return gearIds.reduce((total, id) => {
    const item = getGearById(id);
    return total + (item?.price || 0);
  }, 0);
}

// Convert oz to lbs with decimal
export function ozToLbs(oz: number): number {
  return Math.round((oz / 16) * 10) / 10;
}

// Get loadout by budget
export function getLoadoutForBudget(budget: number): GearLoadout {
  // Find the best loadout that fits the budget
  const sorted = [...BUDGET_LOADOUTS].sort((a, b) =>
    b.targetBudget.max - a.targetBudget.max
  );

  for (const loadout of sorted) {
    if (budget >= loadout.targetBudget.min) {
      return loadout;
    }
  }

  return BUDGET_LOADOUTS[0]; // Return cheapest if nothing fits
}

// Convert loadout to game inventory format
export function loadoutToGameInventory(loadout: GearLoadout): any[] {
  return getLoadoutGear(loadout).map(item => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    weight: ozToLbs(item.weightOz),
    weightOz: item.weightOz,
    condition: 100,
    category: item.category,
    price: item.price,
    durabilityMiles: item.durabilityMiles,
    gameEffect: item.gameEffect,
  }));
}
