import { z } from 'zod';
import { BaseEntitySchema, CoordinatesSchema, DifficultySchema, NumberRangeSchema, TrailTypeSchema } from './common';

export const TrailSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  location: z.object({
    region: z.string().min(1).max(100),
    park: z.string().min(1).max(200),
    country: z.string().min(1).max(100),
    coordinates: z.object({
      start: CoordinatesSchema,
      end: CoordinatesSchema,
      waypoints: z.array(CoordinatesSchema)
    })
  }),
  characteristics: z.object({
    difficulty: DifficultySchema,
    distance: z.number().min(0).max(1000), // Max 1000km trail
    duration: NumberRangeSchema.refine(data => data.min > 0, {
      message: "Duration min must be greater than 0",
      path: ["min"]
    }),
    elevationGain: z.number().min(0).max(10000), // Max 10,000m elevation gain
    elevationProfile: z.array(z.number()),
    trailType: TrailTypeSchema,
    surface: z.array(z.string()).min(1)
  }),
  features: z.object({
    scenicViews: z.boolean(),
    waterFeatures: z.boolean(),
    wildlife: z.array(z.string()),
    seasonality: z.object({
      bestMonths: z.array(z.number().min(1).max(12)).min(1),
      accessibleMonths: z.array(z.number().min(1).max(12)).min(1)
    })
  }),
  safety: z.object({
    riskLevel: z.number().min(1).max(5),
    commonHazards: z.array(z.string()),
    requiresPermit: z.boolean(),
    emergencyContacts: z.array(z.string())
  }),
  amenities: z.object({
    parking: z.boolean(),
    restrooms: z.boolean(),
    camping: z.boolean(),
    drinkingWater: z.boolean()
  }),
  ratings: z.object({
    average: z.number().min(0).max(5),
    count: z.number().min(0),
    breakdown: z.record(z.string(), z.number().min(0))
  }),
  isActive: z.boolean()
});

export const CreateTrailSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  location: z.object({
    region: z.string().min(1).max(100),
    park: z.string().min(1).max(200),
    country: z.string().min(1).max(100),
    coordinates: z.object({
      start: CoordinatesSchema,
      end: CoordinatesSchema,
      waypoints: z.array(CoordinatesSchema).optional()
    })
  }),
  characteristics: z.object({
    difficulty: DifficultySchema,
    distance: z.number().min(0).max(1000),
    duration: NumberRangeSchema.refine(data => data.min > 0, {
      message: "Duration min must be greater than 0",
      path: ["min"]
    }),
    elevationGain: z.number().min(0).max(10000),
    elevationProfile: z.array(z.number()).optional(),
    trailType: TrailTypeSchema,
    surface: z.array(z.string()).min(1)
  }),
  features: z.object({
    scenicViews: z.boolean(),
    waterFeatures: z.boolean(),
    wildlife: z.array(z.string()).optional(),
    seasonality: z.object({
      bestMonths: z.array(z.number().min(1).max(12)).min(1),
      accessibleMonths: z.array(z.number().min(1).max(12)).min(1)
    })
  }),
  safety: z.object({
    riskLevel: z.number().min(1).max(5),
    commonHazards: z.array(z.string()).optional(),
    requiresPermit: z.boolean(),
    emergencyContacts: z.array(z.string()).optional()
  }),
  amenities: z.object({
    parking: z.boolean(),
    restrooms: z.boolean(),
    camping: z.boolean(),
    drinkingWater: z.boolean()
  })
});

export const UpdateTrailSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  location: z.object({
    region: z.string().min(1).max(100).optional(),
    park: z.string().min(1).max(200).optional(),
    country: z.string().min(1).max(100).optional(),
    coordinates: z.object({
      start: CoordinatesSchema.optional(),
      end: CoordinatesSchema.optional(),
      waypoints: z.array(CoordinatesSchema).optional()
    }).optional()
  }).optional(),
  characteristics: z.object({
    difficulty: DifficultySchema.optional(),
    distance: z.number().min(0).max(1000).optional(),
    duration: NumberRangeSchema.optional(),
    elevationGain: z.number().min(0).max(10000).optional(),
    elevationProfile: z.array(z.number()).optional(),
    trailType: TrailTypeSchema.optional(),
    surface: z.array(z.string()).min(1).optional()
  }).optional(),
  features: z.object({
    scenicViews: z.boolean().optional(),
    waterFeatures: z.boolean().optional(),
    wildlife: z.array(z.string()).optional(),
    seasonality: z.object({
      bestMonths: z.array(z.number().min(1).max(12)).min(1).optional(),
      accessibleMonths: z.array(z.number().min(1).max(12)).min(1).optional()
    }).optional()
  }).optional(),
  safety: z.object({
    riskLevel: z.number().min(1).max(5).optional(),
    commonHazards: z.array(z.string()).optional(),
    requiresPermit: z.boolean().optional(),
    emergencyContacts: z.array(z.string()).optional()
  }).optional(),
  amenities: z.object({
    parking: z.boolean().optional(),
    restrooms: z.boolean().optional(),
    camping: z.boolean().optional(),
    drinkingWater: z.boolean().optional()
  }).optional(),
  isActive: z.boolean().optional()
});

export const TrailSearchCriteriaSchema = z.object({
  region: z.string().optional(),
  difficulty: z.array(DifficultySchema).optional(),
  distance: NumberRangeSchema.optional(),
  duration: NumberRangeSchema.optional(),
  elevationGain: NumberRangeSchema.optional(),
  trailType: z.array(TrailTypeSchema).optional(),
  features: z.object({
    scenicViews: z.boolean().optional(),
    waterFeatures: z.boolean().optional(),
    wildlife: z.array(z.string()).optional()
  }).optional(),
  amenities: z.object({
    parking: z.boolean().optional(),
    restrooms: z.boolean().optional(),
    camping: z.boolean().optional(),
    drinkingWater: z.boolean().optional()
  }).optional(),
  location: z.object({
    center: CoordinatesSchema,
    radius: z.number().min(1).max(1000)
  }).optional()
});