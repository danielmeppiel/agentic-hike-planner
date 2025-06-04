import { v4 as uuidv4 } from 'uuid';
import { 
  UserProfile, 
  TripPlan, 
  Trail, 
  AIRecommendation,
  FitnessLevel,
  Difficulty,
  GroupSize,
  TrailType,
  TripStatus,
  Coordinates
} from '../types';

/**
 * Mock data generator for development and testing
 */
export class MockDataGenerator {
  private readonly regions = [
    'California-North', 'California-South', 'Colorado', 'Utah', 'Washington',
    'Oregon', 'Montana', 'Wyoming', 'Arizona', 'New Mexico'
  ];

  private readonly cities = [
    { name: 'San Francisco', state: 'California', country: 'USA', coords: { longitude: -122.4194, latitude: 37.7749 } },
    { name: 'Los Angeles', state: 'California', country: 'USA', coords: { longitude: -118.2437, latitude: 34.0522 } },
    { name: 'Denver', state: 'Colorado', country: 'USA', coords: { longitude: -104.9903, latitude: 39.7392 } },
    { name: 'Salt Lake City', state: 'Utah', country: 'USA', coords: { longitude: -111.8910, latitude: 40.7608 } },
    { name: 'Seattle', state: 'Washington', country: 'USA', coords: { longitude: -122.3321, latitude: 47.6062 } },
    { name: 'Portland', state: 'Oregon', country: 'USA', coords: { longitude: -122.6784, latitude: 45.5152 } },
    { name: 'Bozeman', state: 'Montana', country: 'USA', coords: { longitude: -111.0429, latitude: 45.6770 } },
    { name: 'Jackson', state: 'Wyoming', country: 'USA', coords: { longitude: -110.7624, latitude: 43.4799 } },
    { name: 'Flagstaff', state: 'Arizona', country: 'USA', coords: { longitude: -111.6513, latitude: 35.1983 } },
    { name: 'Santa Fe', state: 'New Mexico', country: 'USA', coords: { longitude: -105.9378, latitude: 35.6870 } }
  ];

  private readonly trailNames = [
    'Mist Trail', 'Half Dome', 'Angels Landing', 'Mount Whitney', 'Mount Washington',
    'Cascade Falls', 'Eagle Peak', 'Bear Lake', 'Emerald Lake', 'Crystal Lake',
    'Thunder Ridge', 'Sunset Point', 'Vista Trail', 'Canyon Loop', 'Forest Path',
    'River Walk', 'Mountain View', 'Valley Trail', 'Summit Ridge', 'Hidden Falls'
  ];

  private readonly parks = [
    'Yosemite National Park', 'Zion National Park', 'Rocky Mountain National Park',
    'Grand Canyon National Park', 'Olympic National Park', 'Glacier National Park',
    'Yellowstone National Park', 'Arches National Park', 'Bryce Canyon National Park',
    'Mount Rainier National Park', 'Sequoia National Park', 'Joshua Tree National Park'
  ];

  private readonly terrainTypes = [
    'rocky', 'dirt', 'paved', 'gravel', 'sand', 'snow', 'ice', 'grass', 'forest', 'desert'
  ];

  private readonly wildlife = [
    'deer', 'elk', 'bear', 'mountain lion', 'coyote', 'eagle', 'hawk', 'marmot',
    'pika', 'chipmunk', 'squirrel', 'rabbit', 'fox', 'owl', 'woodpecker'
  ];

  private readonly hazards = [
    'steep drops', 'loose rock', 'river crossings', 'snow/ice', 'wildlife encounters',
    'weather exposure', 'narrow ledges', 'flash flood risk', 'altitude sickness'
  ];

  private readonly equipment = [
    'hiking boots', 'backpack', 'water bottles', 'rain jacket', 'warm layers',
    'hat', 'sunglasses', 'sunscreen', 'first aid kit', 'map', 'compass',
    'headlamp', 'snacks', 'trekking poles', 'emergency whistle'
  ];

  /**
   * Generate mock user profiles
   */
  generateUsers(count: number = 10): Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>[] {
    const users: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (let i = 0; i < count; i++) {
      const city = this.getRandomItem(this.cities);
      const fitnessLevel = this.getRandomItem(['beginner', 'intermediate', 'advanced', 'expert'] as FitnessLevel[]);
      
      users.push({
        partitionKey: `user${i}@example.com`,
        email: `user${i}@example.com`,
        displayName: `User ${i + 1}`,
        fitnessLevel,
        preferences: {
          preferredDifficulty: this.getRandomItems(['easy', 'moderate', 'difficult'], 1, 3),
          maxHikingDistance: this.getRandomNumber(5, 50),
          terrainTypes: this.getRandomItems(this.terrainTypes, 2, 5),
          groupSize: this.getRandomItem(['solo', 'small', 'large', 'any'] as GroupSize[])
        },
        location: {
          city: city.name,
          state: city.state,
          country: city.country,
          coordinates: city.coords
        },
        isActive: true
      });
    }
    
    return users;
  }

  /**
   * Generate mock trails
   */
  generateTrails(count: number = 50): Omit<Trail, 'id' | 'createdAt' | 'updatedAt'>[] {
    const trails: Omit<Trail, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (let i = 0; i < count; i++) {
      const region = this.getRandomItem(this.regions);
      const park = this.getRandomItem(this.parks);
      const difficulty = this.getRandomItem(['easy', 'moderate', 'difficult', 'expert'] as Difficulty[]);
      const trailType = this.getRandomItem(['loop', 'out-and-back', 'point-to-point'] as TrailType[]);
      const distance = this.getRandomNumber(1, 30);
      const elevationGain = this.getRandomNumber(0, 3000);
      
      // Generate realistic coordinates based on region
      const baseCoords = this.getRegionCoordinates(region);
      const startCoords = this.offsetCoordinates(baseCoords, 0.1);
      const endCoords = trailType === 'loop' ? startCoords : this.offsetCoordinates(startCoords, 0.05);
      
      trails.push({
        partitionKey: region,
        name: `${this.getRandomItem(this.trailNames)} ${i + 1}`,
        description: `A ${difficulty} ${trailType} trail offering ${distance}km of hiking through beautiful ${this.getRandomItem(['mountain', 'forest', 'desert', 'canyon'])} terrain.`,
        location: {
          region,
          park,
          country: 'USA',
          coordinates: {
            start: startCoords,
            end: endCoords,
            waypoints: this.generateWaypoints(startCoords, endCoords, Math.floor(distance / 5))
          }
        },
        characteristics: {
          difficulty,
          distance,
          duration: {
            min: Math.floor(distance * 0.5),
            max: Math.floor(distance * 1.5)
          },
          elevationGain,
          elevationProfile: this.generateElevationProfile(elevationGain),
          trailType,
          surface: this.getRandomItems(this.terrainTypes, 1, 3)
        },
        features: {
          scenicViews: Math.random() > 0.3,
          waterFeatures: Math.random() > 0.6,
          wildlife: this.getRandomItems(this.wildlife, 0, 5),
          seasonality: {
            bestMonths: this.generateBestMonths(),
            accessibleMonths: this.generateAccessibleMonths()
          }
        },
        safety: {
          riskLevel: this.getRiskLevelForDifficulty(difficulty),
          commonHazards: this.getRandomItems(this.hazards, 0, 4),
          requiresPermit: Math.random() > 0.8,
          emergencyContacts: ['Park Ranger: (555) 123-4567']
        },
        amenities: {
          parking: Math.random() > 0.2,
          restrooms: Math.random() > 0.5,
          camping: Math.random() > 0.7,
          drinkingWater: Math.random() > 0.6
        },
        ratings: {
          average: this.getRandomNumber(2.5, 5, 1),
          count: this.getRandomNumber(5, 200),
          breakdown: this.generateRatingBreakdown()
        },
        isActive: true
      });
    }
    
    return trails;
  }

  /**
   * Generate mock trip plans
   */
  generateTrips(userIds: string[], count: number = 20): Omit<TripPlan, 'id' | 'createdAt' | 'updatedAt'>[] {
    const trips: Omit<TripPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (let i = 0; i < count; i++) {
      const userId = this.getRandomItem(userIds);
      const region = this.getRandomItem(this.regions);
      const status = this.getRandomItem(['planning', 'confirmed', 'completed', 'cancelled'] as TripStatus[]);
      const startDate = this.getRandomFutureDate(0, 365);
      const endDate = new Date(startDate.getTime() + this.getRandomNumber(1, 14) * 24 * 60 * 60 * 1000);
      const coords = this.getRegionCoordinates(region);
      
      trips.push({
        partitionKey: userId,
        userId,
        title: `${region} Adventure ${i + 1}`,
        description: `Exploring the beautiful trails of ${region} with friends and family.`,
        status,
        dates: {
          startDate,
          endDate,
          flexibility: this.getRandomNumber(0, 7)
        },
        location: {
          region,
          coordinates: coords,
          radius: this.getRandomNumber(10, 100)
        },
        participants: {
          count: this.getRandomNumber(1, 8),
          fitnessLevels: this.getRandomItems(['beginner', 'intermediate', 'advanced', 'expert'], 1, 3),
          specialRequirements: Math.random() > 0.8 ? ['wheelchair accessible'] : []
        },
        preferences: {
          difficulty: this.getRandomItems(['easy', 'moderate', 'difficult', 'expert'], 1, 3),
          duration: {
            min: this.getRandomNumber(1, 4),
            max: this.getRandomNumber(4, 12)
          },
          distance: {
            min: this.getRandomNumber(1, 5),
            max: this.getRandomNumber(5, 25)
          },
          elevationGain: {
            min: 0,
            max: this.getRandomNumber(500, 2000)
          },
          trailTypes: this.getRandomItems(['loop', 'out-and-back', 'point-to-point'], 1, 3)
        },
        selectedTrails: [], // Will be populated separately
        equipment: this.getRandomItems(this.equipment, 5, 10),
        budget: {
          amount: this.getRandomNumber(100, 2000),
          currency: 'USD',
          includesAccommodation: Math.random() > 0.5
        }
      });
    }
    
    return trips;
  }

  /**
   * Generate mock AI recommendations
   */
  generateRecommendations(
    userIds: string[], 
    tripIds: string[], 
    trailIds: string[], 
    count: number = 30
  ): Omit<AIRecommendation, 'id' | 'createdAt' | 'updatedAt'>[] {
    const recommendations: Omit<AIRecommendation, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (let i = 0; i < count; i++) {
      const userId = this.getRandomItem(userIds);
      const tripId = this.getRandomItem(tripIds);
      const selectedTrails = this.getRandomItems(trailIds, 1, 5);
      const confidence = this.getRandomNumber(0.3, 0.95, 2);
      
      const now = new Date();
      const expiryDate = new Date(now.getTime() + this.getRandomNumber(1, 14) * 24 * 60 * 60 * 1000);
      
      recommendations.push({
        partitionKey: userId,
        userId,
        tripId,
        trailIds: selectedTrails,
        reasoning: `Based on your fitness level and preferences, these trails offer the perfect balance of challenge and scenic beauty. The ${selectedTrails.length} recommended trails match your preferred difficulty levels and distance requirements.`,
        confidence,
        factors: {
          fitnessMatch: this.getRandomNumber(0.4, 1.0, 2),
          preferenceAlignment: this.getRandomNumber(0.3, 1.0, 2),
          seasonalSuitability: this.getRandomNumber(0.5, 1.0, 2),
          safetyConsiderations: this.getRandomNumber(0.6, 1.0, 2)
        },
        alternatives: this.generateAlternatives(trailIds.filter(id => !selectedTrails.includes(id)), 2, 4),
        expiresAt: expiryDate
      });
    }
    
    return recommendations;
  }

  // Helper methods

  private getRandomItem<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot get random item from empty array');
    }
    const item = array[Math.floor(Math.random() * array.length)];
    if (item === undefined) {
      throw new Error('Selected item is undefined');
    }
    return item;
  }

  private getRandomItems<T>(array: T[], min: number, max: number): T[] {
    const count = this.getRandomNumber(min, max);
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private getRandomNumber(min: number, max: number, decimals: number = 0): number {
    const num = Math.random() * (max - min) + min;
    return decimals === 0 ? Math.floor(num) : Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private getRandomFutureDate(minDays: number, maxDays: number): Date {
    const now = new Date();
    const futureMs = now.getTime() + this.getRandomNumber(minDays, maxDays) * 24 * 60 * 60 * 1000;
    return new Date(futureMs);
  }

  private getRegionCoordinates(region: string): Coordinates {
    const regionCoords: { [key: string]: Coordinates } = {
      'California-North': { longitude: -122.4194, latitude: 37.7749 },
      'California-South': { longitude: -118.2437, latitude: 34.0522 },
      'Colorado': { longitude: -104.9903, latitude: 39.7392 },
      'Utah': { longitude: -111.8910, latitude: 40.7608 },
      'Washington': { longitude: -122.3321, latitude: 47.6062 },
      'Oregon': { longitude: -122.6784, latitude: 45.5152 },
      'Montana': { longitude: -111.0429, latitude: 45.6770 },
      'Wyoming': { longitude: -110.7624, latitude: 43.4799 },
      'Arizona': { longitude: -111.6513, latitude: 35.1983 },
      'New Mexico': { longitude: -105.9378, latitude: 35.6870 }
    };
    
    return regionCoords[region] || { longitude: -105.0, latitude: 40.0 };
  }

  private offsetCoordinates(coords: Coordinates, maxOffset: number): Coordinates {
    return {
      longitude: coords.longitude + (Math.random() - 0.5) * maxOffset,
      latitude: coords.latitude + (Math.random() - 0.5) * maxOffset
    };
  }

  private generateWaypoints(start: Coordinates, end: Coordinates, count: number): Coordinates[] {
    const waypoints: Coordinates[] = [];
    
    for (let i = 1; i <= count; i++) {
      const ratio = i / (count + 1);
      waypoints.push({
        longitude: start.longitude + (end.longitude - start.longitude) * ratio + (Math.random() - 0.5) * 0.01,
        latitude: start.latitude + (end.latitude - start.latitude) * ratio + (Math.random() - 0.5) * 0.01
      });
    }
    
    return waypoints;
  }

  private generateElevationProfile(maxElevation: number): number[] {
    const points = this.getRandomNumber(5, 20);
    const profile: number[] = [];
    
    for (let i = 0; i <= points; i++) {
      const baseElevation = (maxElevation * i) / points;
      const variation = maxElevation * 0.2 * (Math.random() - 0.5);
      profile.push(Math.max(0, baseElevation + variation));
    }
    
    return profile;
  }

  private generateBestMonths(): number[] {
    const seasonStart = this.getRandomNumber(3, 7); // March to July
    const seasonLength = this.getRandomNumber(3, 6);
    const months: number[] = [];
    
    for (let i = 0; i < seasonLength; i++) {
      const month = ((seasonStart + i - 1) % 12) + 1;
      months.push(month);
    }
    
    return months;
  }

  private generateAccessibleMonths(): number[] {
    const accessible: number[] = [];
    const bestMonths = this.generateBestMonths();
    
    // Add best months
    accessible.push(...bestMonths);
    
    // Add some additional accessible months
    for (let month = 1; month <= 12; month++) {
      if (!accessible.includes(month) && Math.random() > 0.6) {
        accessible.push(month);
      }
    }
    
    return accessible.sort((a, b) => a - b);
  }

  private getRiskLevelForDifficulty(difficulty: Difficulty): number {
    const riskMap: { [key in Difficulty]: number } = {
      'easy': this.getRandomNumber(1, 2),
      'moderate': this.getRandomNumber(2, 3),
      'difficult': this.getRandomNumber(3, 4),
      'expert': this.getRandomNumber(4, 5)
    };
    
    return riskMap[difficulty];
  }

  private generateRatingBreakdown(): { [key: number]: number } {
    const breakdown: { [key: number]: number } = {};
    const totalRatings = this.getRandomNumber(5, 200);
    
    // Generate realistic rating distribution (skewed towards higher ratings)
    const weights = [0.05, 0.1, 0.15, 0.3, 0.4]; // 1-star to 5-star weights
    let remaining = totalRatings;
    
    for (let rating = 1; rating <= 5; rating++) {
      if (rating === 5) {
        breakdown[rating] = remaining;
      } else {
        const weight = weights[rating - 1];
        if (weight !== undefined) {
          const count = Math.floor(totalRatings * weight);
          breakdown[rating] = count;
          remaining -= count;
        }
      }
    }
    
    return breakdown;
  }

  private generateAlternatives(availableTrailIds: string[], min: number, max: number): Array<{
    trailId: string;
    reason: string;
    confidence: number;
  }> {
    const count = this.getRandomNumber(min, max);
    const selectedTrails = this.getRandomItems(availableTrailIds, count, count);
    
    const reasons = [
      'Similar difficulty but shorter distance',
      'Better seasonal conditions',
      'Lower risk level for safety',
      'More scenic viewpoints',
      'Better amenities available',
      'Less crowded alternative'
    ];
    
    return selectedTrails.map(trailId => ({
      trailId,
      reason: this.getRandomItem(reasons),
      confidence: this.getRandomNumber(0.3, 0.8, 2)
    }));
  }
}