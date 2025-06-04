import Joi from 'joi';
import { dateRangeSchema, budgetSchema, rangeSchema, tripStatuses, coordinatesSchema } from './commonSchemas';

/**
 * Trip plan validation schemas
 */

export const tripLocationSchema = Joi.object({
  region: Joi.string().min(1).max(100).required(),
  coordinates: coordinatesSchema.required(),
  radius: Joi.number().min(1).max(500).required(), // km
});

export const tripParticipantsSchema = Joi.object({
  count: Joi.number().integer().min(1).max(50).required(),
  fitnessLevels: Joi.array().items(Joi.string().valid(...['beginner', 'intermediate', 'advanced', 'expert'])).min(1).required(),
  specialRequirements: Joi.array().items(Joi.string().max(200)).default([]),
});

export const tripPreferencesSchema = Joi.object({
  difficulty: Joi.array().items(Joi.string().valid(...['easy', 'moderate', 'difficult', 'expert'])).min(1).required(),
  duration: rangeSchema.required(), // hours
  distance: rangeSchema.required(), // km
  elevationGain: rangeSchema.required(), // meters
  trailTypes: Joi.array().items(Joi.string().valid(...['loop', 'out-and-back', 'point-to-point'])).min(1).required(),
});

export const createTripPlanSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).default(''),
  dates: dateRangeSchema.required(),
  location: tripLocationSchema.required(),
  participants: tripParticipantsSchema.required(),
  preferences: tripPreferencesSchema.required(),
  equipment: Joi.array().items(Joi.string().max(100)).default([]),
  budget: budgetSchema.required(),
});

export const updateTripPlanSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid(...tripStatuses).optional(),
  dates: dateRangeSchema.optional(),
  location: tripLocationSchema.optional(),
  participants: tripParticipantsSchema.optional(),
  preferences: tripPreferencesSchema.optional(),
  selectedTrails: Joi.array().items(Joi.string().uuid()).optional(),
  equipment: Joi.array().items(Joi.string().max(100)).optional(),
  budget: budgetSchema.optional(),
});

export const tripQuerySchema = Joi.object({
  status: Joi.string().valid(...tripStatuses).optional(),
  region: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  difficulty: Joi.string().valid(...['easy', 'moderate', 'difficult', 'expert']).optional(),
  participantCount: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  sortBy: Joi.string().valid('title', 'createdAt', 'startDate', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const tripValidationSchemas = {
  createTripPlan: {
    body: createTripPlanSchema,
  },
  updateTripPlan: {
    body: updateTripPlanSchema,
  },
  getTripPlan: {
    params: Joi.object({
      tripId: Joi.string().uuid().required(),
    }),
  },
  getUserTrips: {
    params: Joi.object({
      userId: Joi.string().uuid().required(),
    }),
    query: tripQuerySchema,
  },
  queryTrips: {
    query: tripQuerySchema,
  },
};