import Joi from 'joi';

/**
 * AI Recommendation validation schemas
 */

export const recommendationFactorsSchema = Joi.object({
  fitnessMatch: Joi.number().min(0).max(1).required(),
  preferenceAlignment: Joi.number().min(0).max(1).required(),
  seasonalSuitability: Joi.number().min(0).max(1).required(),
  safetyConsiderations: Joi.number().min(0).max(1).required(),
});

export const alternativeRecommendationSchema = Joi.object({
  trailId: Joi.string().uuid().required(),
  reason: Joi.string().max(500).required(),
  confidence: Joi.number().min(0).max(1).required(),
});

export const createAIRecommendationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  tripId: Joi.string().uuid().required(),
  trailIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  reasoning: Joi.string().max(2000).required(),
  confidence: Joi.number().min(0).max(1).required(),
  factors: recommendationFactorsSchema.required(),
  alternatives: Joi.array().items(alternativeRecommendationSchema).default([]),
  expiresAt: Joi.date().iso().min('now').required(),
});

export const updateAIRecommendationSchema = Joi.object({
  trailIds: Joi.array().items(Joi.string().uuid()).min(1).optional(),
  reasoning: Joi.string().max(2000).optional(),
  confidence: Joi.number().min(0).max(1).optional(),
  factors: recommendationFactorsSchema.optional(),
  alternatives: Joi.array().items(alternativeRecommendationSchema).optional(),
  expiresAt: Joi.date().iso().min('now').optional(),
});

export const generateRecommendationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  tripId: Joi.string().uuid().required(),
  maxRecommendations: Joi.number().integer().min(1).max(20).default(5),
  includeAlternatives: Joi.boolean().default(true),
});

export const recommendationQuerySchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  tripId: Joi.string().uuid().optional(),
  confidence: Joi.number().min(0).max(1).optional(),
  isExpired: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  sortBy: Joi.string().valid('confidence', 'createdAt', 'expiresAt').default('confidence'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const recommendationValidationSchemas = {
  createAIRecommendation: {
    body: createAIRecommendationSchema,
  },
  updateAIRecommendation: {
    body: updateAIRecommendationSchema,
  },
  getAIRecommendation: {
    params: Joi.object({
      recommendationId: Joi.string().uuid().required(),
    }),
  },
  generateRecommendation: {
    body: generateRecommendationSchema,
  },
  getUserRecommendations: {
    params: Joi.object({
      userId: Joi.string().uuid().required(),
    }),
    query: recommendationQuerySchema,
  },
  getTripRecommendations: {
    params: Joi.object({
      tripId: Joi.string().uuid().required(),
    }),
    query: recommendationQuerySchema,
  },
  queryRecommendations: {
    query: recommendationQuerySchema,
  },
};