export type LatLon = readonly [number, number];

export interface TrailMapPoint {
  readonly lat: number;
  readonly lon: number;
  readonly mile: number | null;
  readonly observedAt: string | null;
  readonly label: string;
  readonly source: string;
}

export interface TrailMapRoute {
  readonly segments: LatLon[][];
  readonly measuredMiles: number;
  readonly displayMiles: number;
  readonly sourceLabel: string;
  readonly qualityNotes: string[];
}

export interface TrailMapMilepoint {
  readonly mile: number;
  readonly scaledTrailMiles: number | null;
  readonly lat: number;
  readonly lon: number;
}

export interface TrailMapElevationPoint {
  readonly mile: number;
  readonly lat: number;
  readonly lon: number;
  readonly elevationFt: number;
  readonly state: string;
}

export interface TrailMapTerrainSegment {
  readonly startMile: number;
  readonly endMile: number;
  readonly state: string;
  readonly gainFt: number;
  readonly lossFt: number;
  readonly maxGradePercent: number;
  readonly highestFt: number;
  readonly lowestFt: number;
}

export interface TrailMapRockinessSegment {
  readonly startMile: number;
  readonly endMile: number;
  readonly mile: number;
  readonly score: number;
  readonly label: string;
  readonly confidence: string;
}

export interface TrailMapDifficultySegment {
  readonly startMile: number;
  readonly endMile: number;
  readonly score: number;
  readonly label: string;
  readonly confidence: string;
}

export interface TrailMapSteepSection {
  readonly startMile: number;
  readonly endMile: number;
  readonly direction: 'climb' | 'descent' | 'mixed';
  readonly gradePercent: number;
  readonly verticalFt: number;
  readonly state: string;
}

export interface TrailMapWaypoint {
  readonly id: string;
  readonly type: 'shelter' | 'water' | 'road' | 'town' | 'summit' | 'campsite' | 'vista';
  readonly name: string;
  readonly mile: number;
  readonly lat: number;
  readonly lon: number;
  readonly state: string;
  readonly detail: string;
  readonly confidence: string;
}

export interface TrailMapPack {
  readonly generatedAt: string;
  readonly tracker: {
    readonly label: string;
    readonly source: 'laravel' | 'garmin' | 'laravel+garmin' | 'preview';
    readonly current: TrailMapPoint | null;
    readonly history: TrailMapPoint[];
    readonly staleAfterMinutes: number;
  };
  readonly route: TrailMapRoute;
  readonly milepoints: TrailMapMilepoint[];
  readonly terrain: {
    readonly elevation: TrailMapElevationPoint[];
    readonly segments: TrailMapTerrainSegment[];
    readonly steep: TrailMapSteepSection[];
    readonly rockiness: TrailMapRockinessSegment[];
    readonly difficulty: TrailMapDifficultySegment[];
  };
  readonly waypoints: {
    readonly shelters: TrailMapWaypoint[];
    readonly water: TrailMapWaypoint[];
    readonly roads: TrailMapWaypoint[];
    readonly towns: TrailMapWaypoint[];
    readonly summits: TrailMapWaypoint[];
    readonly campsites: TrailMapWaypoint[];
    readonly vistas: TrailMapWaypoint[];
  };
  readonly sourceNotes: string[];
}
