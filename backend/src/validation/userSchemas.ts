import Joi from 'joi';
import { locationSchema, fitnessLevels, groupSizes } from './commonSchemas';

/**
 * User profile validation schemas
 */

export const userPreferencesSchema = Joi.object({
  preferredDifficulty: Joi.array().items(Joi.string().valid(...['easy', 'moderate', 'difficult', 'expert'])).min(1).required(),
  maxHikingDistance: Joi.number().min(1).max(1000).required(), // km
  terrainTypes: Joi.array().items(Joi.string().min(1).max(50)).min(1).required(),
  groupSize: Joi.string().valid(...groupSizes).required(),
});

export const createUserProfileSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  displayName: Joi.string().min(1).max(100).required(),
  fitnessLevel: Joi.string().valid(...fitnessLevels).required(),
  preferences: userPreferencesSchema.required(),
  location: locationSchema.required(),
});

export const updateUserProfileSchema = Joi.object({
  displayName: Joi.string().min(1).max(100).optional(),
  fitnessLevel: Joi.string().valid(...fitnessLevels).optional(),
  preferences: userPreferencesSchema.optional(),
  location: locationSchema.optional(),
  isActive: Joi.boolean().optional(),
});

export const userQuerySchema = Joi.object({
  email: Joi.string().email().optional(),
  fitnessLevel: Joi.string().valid(...fitnessLevels).optional(),
  isActive: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

export const userValidationSchemas = {
  createUserProfile: {
    body: createUserProfileSchema,
  },
  updateUserProfile: {
    body: updateUserProfileSchema,
  },
  getUserProfile: {
    params: Joi.object({
      userId: Joi.string().uuid().required(),
    }),
  },
  queryUsers: {
    query: userQuerySchema,
  },
};