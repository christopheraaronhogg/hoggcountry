import { describe, it, expect } from 'vitest';
import { WeatherSystem } from '../WeatherSystem';
import { GameTimeSchema } from '../../schema/GameState';

describe('WeatherSystem', () => {
  describe('maybeChangeWeather', () => {
    it('should return a valid weather type', () => {
      const validWeathers = ['clear', 'cloudy', 'rain_light', 'rain_heavy', 'fog', 'storm'];
      const result = WeatherSystem.maybeChangeWeather('clear');
      expect(validWeathers).toContain(result);
    });

    it('should mostly return the same weather (low transition chance)', () => {
      // Run multiple times and check that most stay the same
      let sameCount = 0;
      const runs = 100;
      for (let i = 0; i < runs; i++) {
        if (WeatherSystem.maybeChangeWeather('clear') === 'clear') {
          sameCount++;
        }
      }
      // Expect at least 60% to stay the same (transition chance is 10%)
      expect(sameCount).toBeGreaterThan(60);
    });
  });

  describe('calculateTemperature', () => {
    it('should return warmer temps during midday', () => {
      const time = new GameTimeSchema();
      time.hour = 14; // 2 PM

      const midday = WeatherSystem.calculateTemperature(time, 'clear', 3500);

      time.hour = 4; // 4 AM
      const night = WeatherSystem.calculateTemperature(time, 'clear', 3500);

      // Midday should generally be warmer than night
      // Using average over multiple runs due to random variation
      let middayTotal = 0;
      let nightTotal = 0;
      for (let i = 0; i < 20; i++) {
        time.hour = 14;
        middayTotal += WeatherSystem.calculateTemperature(time, 'clear', 3500);
        time.hour = 4;
        nightTotal += WeatherSystem.calculateTemperature(time, 'clear', 3500);
      }
      expect(middayTotal / 20).toBeGreaterThan(nightTotal / 20);
    });

    it('should be colder at higher elevations', () => {
      const time = new GameTimeSchema();
      time.hour = 12;

      let lowElevTotal = 0;
      let highElevTotal = 0;
      for (let i = 0; i < 20; i++) {
        lowElevTotal += WeatherSystem.calculateTemperature(time, 'clear', 3000);
        highElevTotal += WeatherSystem.calculateTemperature(time, 'clear', 5000);
      }

      expect(lowElevTotal / 20).toBeGreaterThan(highElevTotal / 20);
    });

    it('should be colder during rain', () => {
      const time = new GameTimeSchema();
      time.hour = 12;

      let clearTotal = 0;
      let rainTotal = 0;
      for (let i = 0; i < 20; i++) {
        clearTotal += WeatherSystem.calculateTemperature(time, 'clear', 3500);
        rainTotal += WeatherSystem.calculateTemperature(time, 'rain_heavy', 3500);
      }

      expect(clearTotal / 20).toBeGreaterThan(rainTotal / 20);
    });
  });

  describe('isDangerous', () => {
    it('should flag storm as dangerous', () => {
      expect(WeatherSystem.isDangerous('storm', 60)).toBe(true);
    });

    it('should flag cold rain as dangerous', () => {
      expect(WeatherSystem.isDangerous('rain_heavy', 30)).toBe(true);
    });

    it('should not flag clear weather as dangerous', () => {
      expect(WeatherSystem.isDangerous('clear', 60)).toBe(false);
    });
  });

  describe('getHikingModifier', () => {
    it('should return 1.0 for clear weather', () => {
      expect(WeatherSystem.getHikingModifier('clear')).toBe(1.0);
    });

    it('should return lower modifier for storms', () => {
      expect(WeatherSystem.getHikingModifier('storm')).toBeLessThan(1.0);
    });
  });
});
