export const GEORGIA_LAT = 34.6;
export const MAINE_LAT = 45.9;
export const TOTAL_AT_MILES = 2198;

export const CHILL_ROWS = Object.freeze([
  [5, 4],
  [10, 8],
  [15, 12],
  [20, 18],
  [25, 25]
]);

export function getTempColor(temp) {
  if (temp <= 10) return '#ef4444';
  if (temp <= 25) return '#f97316';
  if (temp <= 40) return '#fbbf24';
  if (temp <= 55) return '#22c55e';
  return '#059669';
}

export function calculateWindChill(summitTemp, windSpeed) {
  if (windSpeed < 5) return 0;

  const row = CHILL_ROWS.find(([wind]) => windSpeed <= wind);
  const penalty = row?.[1] ?? 25;

  return Math.round(summitTemp - penalty);
}

export function latitudeForMile(mile) {
  return GEORGIA_LAT + (mile / TOTAL_AT_MILES) * (MAINE_LAT - GEORGIA_LAT);
}

export function calculateSunTimes(dateStr, lat) {
  const d = new Date(dateStr);
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
  const latRad = lat * Math.PI / 180;
  const decRad = declination * Math.PI / 180;
  const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

  if (cosHourAngle > 1) return { sunrise: null, sunset: null, daylightHours: 0 };
  if (cosHourAngle < -1) return { sunrise: null, sunset: null, daylightHours: 24 };

  const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
  const daylightHours = 2 * hourAngle / 15;
  const solarNoon = 12;
  const sunriseHours = solarNoon - daylightHours / 2;
  const sunsetHours = solarNoon + daylightHours / 2;

  return {
    sunrise: hoursToTime(sunriseHours),
    sunset: hoursToTime(sunsetHours),
    sunriseHours,
    sunsetHours,
    daylightHours
  };
}

export function hoursToTime(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export function dayQualityFor(daylightHours) {
  if (daylightHours >= 14) return 'Long Day';
  if (daylightHours >= 12) return 'Solid Day';
  if (daylightHours >= 10) return 'Short Day';
  return 'Winter Day';
}

export function dayQualityColorFor(daylightHours) {
  if (daylightHours >= 14) return '#22c55e';
  if (daylightHours >= 12) return '#059669';
  if (daylightHours >= 10) return '#ef4444';
  return '#6b8cae';
}

export function terrainMultiplierFor(mile) {
  return mile > 1750 && mile < 1912 ? 0.6 : 1.0;
}
