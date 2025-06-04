import Joi from 'joi';
import { rangeSchema, ratingSchema, coordinatesSchema, difficulties, trailTypes } from './commonSchemas';

/**
 * Trail validation schemas
 */

export const trailCoordinatesSchema = Joi.object({
  start: coordinatesSchema.required(),
  end: coordinatesSchema.required(),
  waypoints: Joi.array().items(coordinatesSchema).default([]),
});

export const trailLocationSchema = Joi.object({
  region: Joi.string().min(1).max(100).required(),
  park: Joi.string().min(1).max(100).required(),
  country: Joi.string().min(1).max(100).required(),
  coordinates: trailCoordinatesSchema.required(),
});

export const trailSeasonalitySchema = Joi.object({
  bestMonths: Joi.array().items(Joi.number().integer().min(1).max(12)).min(1).required(),
  accessibleMonths: Joi.array().items(Joi.number().integer().min(1).max(12)).min(1).required(),
});

export const trailCharacteristicsSchema = Joi.object({
  difficulty: Joi.string().valid(...difficulties).required(),
  distance: Joi.number().min(0.1).max(1000).required(), // km
  duration: rangeSchema.required(), // hours
  elevationGain: Joi.number().min(0).max(10000).required(), // meters
  elevationProfile: Joi.array().items(Joi.number()).default([]),
  trailType: Joi.string().valid(...trailTypes).required(),
  surface: Joi.array().items(Joi.string().max(50)).min(1).required(),
});

export const trailFeaturesSchema = Joi.object({
  scenicViews: Joi.boolean().required(),
  waterFeatures: Joi.boolean().required(),
  wildlife: Joi.array().items(Joi.string().max(100)).default([]),
  seasonality: trailSeasonalitySchema.required(),
});

export const trailSafetySchema = Joi.object({
  riskLevel: Joi.number().integer().min(1).max(5).required(),
  commonHazards: Joi.array().items(Joi.string().max(200)).default([]),
  requiresPermit: Joi.boolean().required(),
  emergencyContacts: Joi.array().items(Joi.string().max(200)).default([]),
});

export const trailAmenitiesSchema = Joi.object({
  parking: Joi.boolean().required(),
  restrooms: Joi.boolean().required(),
  camping: Joi.boolean().required(),
  drinkingWater: Joi.boolean().required(),
});

export const createTrailSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).required(),
  location: trailLocationSchema.required(),
  characteristics: trailCharacteristicsSchema.required(),
  features: trailFeaturesSchema.required(),
  safety: trailSafetySchema.required(),
  amenities: trailAmenitiesSchema.required(),
});

export const updateTrailSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(2000).optional(),
  location: trailLocationSchema.optional(),
  characteristics: trailCharacteristicsSchema.optional(),
  features: trailFeaturesSchema.optional(),
  safety: trailSafetySchema.optional(),
  amenities: trailAmenitiesSchema.optional(),
  isActive: Joi.boolean().optional(),
});

export const trailSearchSchema = Joi.object({
  region: Joi.string().optional(),
  difficulty: Joi.array().items(Joi.string().valid(...difficulties)).optional(),
  distance: rangeSchema.optional(),
  duration: rangeSchema.optional(),
  elevationGain: rangeSchema.optional(),
  trailType: Joi.array().items(Joi.string().valid(...trailTypes)).optional(),
  surface: Joi.array().items(Joi.string().max(50)).optional(),
  scenicViews: Joi.boolean().optional(),
  waterFeatures: Joi.boolean().optional(),
  wildlife: Joi.array().items(Joi.string().max(100)).optional(),
  bestMonths: Joi.array().items(Joi.number().integer().min(1).max(12)).optional(),
  riskLevel: rangeSchema.optional(),
  requiresPermit: Joi.boolean().optional(),
  parking: Joi.boolean().optional(),
  restrooms: Joi.boolean().optional(),
  camping: Joi.boolean().optional(),
  drinkingWater: Joi.boolean().optional(),
  coordinates: coordinatesSchema.optional(),
  radius: Joi.number().min(1).max(500).optional(), // km
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  sortBy: Joi.string().valid('name', 'difficulty', 'distance', 'rating', 'duration', 'elevationGain').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

export const trailValidationSchemas = {
  createTrail: {
    body: createTrailSchema,
  },
  updateTrail: {
    body: updateTrailSchema,
  },
  getTrail: {
    params: Joi.object({
      trailId: Joi.string().uuid().required(),
    }),
  },
  searchTrails: {
    query: trailSearchSchema,
  },
  getTrailsByRegion: {
    params: Joi.object({
      region: Joi.string().required(),
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(20),
      offset: Joi.number().integer().min(0).default(0),
    }),
  },
};