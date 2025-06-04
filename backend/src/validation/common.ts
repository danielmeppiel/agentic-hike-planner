import { z } from 'zod';

// Common validation schemas
export const CoordinatesSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90)
});

export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date()
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export const NumberRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0)
}).refine(data => data.max >= data.min, {
  message: "Max value must be greater than or equal to min value",
  path: ["max"]
});

export const FitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);
export const DifficultySchema = z.enum(['easy', 'moderate', 'difficult', 'expert']);
export const GroupSizeSchema = z.enum(['solo', 'small', 'large', 'any']);
export const TrailTypeSchema = z.enum(['loop', 'out-and-back', 'point-to-point']);
export const TripStatusSchema = z.enum(['planning', 'confirmed', 'completed', 'cancelled']);

export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  partitionKey: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date()
});