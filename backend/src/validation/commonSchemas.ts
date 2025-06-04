import Joi from 'joi';

/**
 * Common validation schemas used across the application
 */

export const coordinatesSchema = Joi.array().items(Joi.number()).length(2);

export const locationSchema = Joi.object({
  city: Joi.string().min(1).max(100).required(),
  state: Joi.string().min(1).max(100).required(),
  country: Joi.string().min(1).max(100).required(),
  coordinates: coordinatesSchema.optional(),
});

export const rangeSchema = Joi.object({
  min: Joi.number().min(0).required(),
  max: Joi.number().min(Joi.ref('min')).required(),
});

export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().min('now').required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  flexibility: Joi.number().integer().min(0).max(30).default(0),
});

export const budgetSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  currency: Joi.string().length(3).uppercase().required(),
  includesAccommodation: Joi.boolean().default(false),
});

export const ratingSchema = Joi.object({
  average: Joi.number().min(1).max(5).required(),
  count: Joi.number().integer().min(0).required(),
  breakdown: Joi.object().pattern(Joi.number().integer().min(1).max(5), Joi.number().integer().min(0)),
});

// Common parameter schemas
export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const userIdParamSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

export const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

// Enum validation helpers
export const fitnessLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
export const difficulties = ['easy', 'moderate', 'difficult', 'expert'];
export const tripStatuses = ['planning', 'confirmed', 'completed', 'cancelled'];
export const trailTypes = ['loop', 'out-and-back', 'point-to-point'];
export const groupSizes = ['solo', 'small', 'large', 'any'];