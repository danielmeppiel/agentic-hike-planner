import { z } from 'zod';
import { BaseEntitySchema, CoordinatesSchema, NumberRangeSchema, TripStatusSchema } from './common';

export const TripPlanSchema = BaseEntitySchema.extend({
  userId: z.string().uuid(),
  title: z.string().min(3).max(100),
  description: z.string().max(500),
  status: TripStatusSchema,
  dates: z.object({
    startDate: z.date(),
    endDate: z.date(),
    flexibility: z.number().min(0).max(30) // Max 30 days flexibility
  }).refine(data => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"]
  }),
  location: z.object({
    region: z.string().min(1).max(100),
    coordinates: CoordinatesSchema,
    radius: z.number().min(1).max(1000) // Max 1000km radius
  }),
  participants: z.object({
    count: z.number().min(1).max(50), // Reasonable group size limit
    fitnessLevels: z.array(z.string()).min(1),
    specialRequirements: z.array(z.string())
  }),
  preferences: z.object({
    difficulty: z.array(z.string()).min(1),
    duration: NumberRangeSchema,
    distance: NumberRangeSchema,
    elevationGain: NumberRangeSchema,
    trailTypes: z.array(z.string()).min(1)
  }),
  selectedTrails: z.array(z.string().uuid()),
  equipment: z.array(z.string()),
  budget: z.object({
    amount: z.number().min(0),
    currency: z.string().length(3), // ISO currency codes
    includesAccommodation: z.boolean()
  })
});

export const CreateTripPlanSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(3).max(100),
  description: z.string().max(500),
  dates: z.object({
    startDate: z.date(),
    endDate: z.date(),
    flexibility: z.number().min(0).max(30)
  }).refine(data => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"]
  }),
  location: z.object({
    region: z.string().min(1).max(100),
    coordinates: CoordinatesSchema,
    radius: z.number().min(1).max(1000)
  }),
  participants: z.object({
    count: z.number().min(1).max(50),
    fitnessLevels: z.array(z.string()).min(1),
    specialRequirements: z.array(z.string())
  }),
  preferences: z.object({
    difficulty: z.array(z.string()).min(1),
    duration: NumberRangeSchema,
    distance: NumberRangeSchema,
    elevationGain: NumberRangeSchema,
    trailTypes: z.array(z.string()).min(1)
  }),
  equipment: z.array(z.string()).optional(),
  budget: z.object({
    amount: z.number().min(0),
    currency: z.string().length(3),
    includesAccommodation: z.boolean()
  }).optional()
});

export const UpdateTripPlanSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  status: TripStatusSchema.optional(),
  dates: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    flexibility: z.number().min(0).max(30).optional()
  }).optional(),
  location: z.object({
    region: z.string().min(1).max(100).optional(),
    coordinates: CoordinatesSchema.optional(),
    radius: z.number().min(1).max(1000).optional()
  }).optional(),
  participants: z.object({
    count: z.number().min(1).max(50).optional(),
    fitnessLevels: z.array(z.string()).min(1).optional(),
    specialRequirements: z.array(z.string()).optional()
  }).optional(),
  preferences: z.object({
    difficulty: z.array(z.string()).min(1).optional(),
    duration: NumberRangeSchema.optional(),
    distance: NumberRangeSchema.optional(),
    elevationGain: NumberRangeSchema.optional(),
    trailTypes: z.array(z.string()).min(1).optional()
  }).optional(),
  selectedTrails: z.array(z.string().uuid()).optional(),
  equipment: z.array(z.string()).optional(),
  budget: z.object({
    amount: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    includesAccommodation: z.boolean().optional()
  }).optional()
});