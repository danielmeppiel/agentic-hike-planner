import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const AIRecommendationSchema = BaseEntitySchema.extend({
  userId: z.string().uuid(),
  tripId: z.string().uuid(),
  trailIds: z.array(z.string().uuid()).min(1),
  reasoning: z.string().min(10).max(1000),
  confidence: z.number().min(0).max(1),
  factors: z.object({
    fitnessMatch: z.number().min(0).max(1),
    preferenceAlignment: z.number().min(0).max(1),
    seasonalSuitability: z.number().min(0).max(1),
    safetyConsiderations: z.number().min(0).max(1)
  }),
  alternatives: z.array(z.object({
    trailId: z.string().uuid(),
    reason: z.string().min(5).max(200),
    confidence: z.number().min(0).max(1)
  })),
  expiresAt: z.date()
});

export const CreateAIRecommendationSchema = z.object({
  userId: z.string().uuid(),
  tripId: z.string().uuid(),
  trailIds: z.array(z.string().uuid()).min(1),
  reasoning: z.string().min(10).max(1000),
  confidence: z.number().min(0).max(1),
  factors: z.object({
    fitnessMatch: z.number().min(0).max(1),
    preferenceAlignment: z.number().min(0).max(1),
    seasonalSuitability: z.number().min(0).max(1),
    safetyConsiderations: z.number().min(0).max(1)
  }),
  alternatives: z.array(z.object({
    trailId: z.string().uuid(),
    reason: z.string().min(5).max(200),
    confidence: z.number().min(0).max(1)
  })).optional(),
  expiresAt: z.date().optional()
});

export const UpdateAIRecommendationSchema = z.object({
  trailIds: z.array(z.string().uuid()).min(1).optional(),
  reasoning: z.string().min(10).max(1000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  factors: z.object({
    fitnessMatch: z.number().min(0).max(1).optional(),
    preferenceAlignment: z.number().min(0).max(1).optional(),
    seasonalSuitability: z.number().min(0).max(1).optional(),
    safetyConsiderations: z.number().min(0).max(1).optional()
  }).optional(),
  alternatives: z.array(z.object({
    trailId: z.string().uuid(),
    reason: z.string().min(5).max(200),
    confidence: z.number().min(0).max(1)
  })).optional(),
  expiresAt: z.date().optional()
});