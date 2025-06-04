import { z } from 'zod';
import { BaseEntitySchema, CoordinatesSchema, FitnessLevelSchema, GroupSizeSchema } from './common';

export const UserProfileSchema = BaseEntitySchema.extend({
  email: z.string().email(),
  displayName: z.string().min(2).max(50),
  fitnessLevel: FitnessLevelSchema,
  preferences: z.object({
    preferredDifficulty: z.array(z.string()).min(1),
    maxHikingDistance: z.number().min(0).max(500), // Max 500km seems reasonable
    terrainTypes: z.array(z.string()).min(1),
    groupSize: GroupSizeSchema
  }),
  location: z.object({
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    country: z.string().min(1).max(100),
    coordinates: CoordinatesSchema.optional()
  }),
  isActive: z.boolean()
});

export const CreateUserProfileSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(50),
  fitnessLevel: FitnessLevelSchema,
  preferences: z.object({
    preferredDifficulty: z.array(z.string()).min(1),
    maxHikingDistance: z.number().min(0).max(500),
    terrainTypes: z.array(z.string()).min(1),
    groupSize: GroupSizeSchema
  }),
  location: z.object({
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    country: z.string().min(1).max(100),
    coordinates: CoordinatesSchema.optional()
  })
});

export const UpdateUserProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  fitnessLevel: FitnessLevelSchema.optional(),
  preferences: z.object({
    preferredDifficulty: z.array(z.string()).min(1).optional(),
    maxHikingDistance: z.number().min(0).max(500).optional(),
    terrainTypes: z.array(z.string()).min(1).optional(),
    groupSize: GroupSizeSchema.optional()
  }).optional(),
  location: z.object({
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    country: z.string().min(1).max(100).optional(),
    coordinates: CoordinatesSchema.optional()
  }).optional()
});