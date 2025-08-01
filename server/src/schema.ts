
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Activity type enum
export const activityTypeSchema = z.enum(['run', 'walk']);
export type ActivityType = z.infer<typeof activityTypeSchema>;

// Activity schema
export const activitySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: activityTypeSchema,
  distance_miles: z.number(),
  duration_hours: z.number().int(),
  duration_minutes: z.number().int(),
  duration_seconds: z.number().int(),
  activity_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Activity = z.infer<typeof activitySchema>;

// Activity like schema
export const activityLikeSchema = z.object({
  id: z.number(),
  activity_id: z.number(),
  user_id: z.number(),
  created_at: z.coerce.date()
});

export type ActivityLike = z.infer<typeof activityLikeSchema>;

// Input schemas for creating users
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for login
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Input schema for creating activities
export const createActivityInputSchema = z.object({
  user_id: z.number(),
  type: activityTypeSchema,
  distance_miles: z.number().positive(),
  duration_hours: z.number().int().nonnegative(),
  duration_minutes: z.number().int().min(0).max(59),
  duration_seconds: z.number().int().min(0).max(59),
  activity_date: z.coerce.date()
});

export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

// Input schema for updating activities
export const updateActivityInputSchema = z.object({
  id: z.number(),
  type: activityTypeSchema.optional(),
  distance_miles: z.number().positive().optional(),
  duration_hours: z.number().int().nonnegative().optional(),
  duration_minutes: z.number().int().min(0).max(59).optional(),
  duration_seconds: z.number().int().min(0).max(59).optional(),
  activity_date: z.coerce.date().optional()
});

export type UpdateActivityInput = z.infer<typeof updateActivityInputSchema>;

// Input schema for liking activities
export const likeActivityInputSchema = z.object({
  activity_id: z.number(),
  user_id: z.number()
});

export type LikeActivityInput = z.infer<typeof likeActivityInputSchema>;

// Input schema for getting user activities
export const getUserActivitiesInputSchema = z.object({
  user_id: z.number()
});

export type GetUserActivitiesInput = z.infer<typeof getUserActivitiesInputSchema>;

// Activity with likes count for dashboard
export const activityWithLikesSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  user_name: z.string(),
  type: activityTypeSchema,
  distance_miles: z.number(),
  duration_hours: z.number().int(),
  duration_minutes: z.number().int(),
  duration_seconds: z.number().int(),
  activity_date: z.coerce.date(),
  created_at: z.coerce.date(),
  likes_count: z.number(),
  user_has_liked: z.boolean()
});

export type ActivityWithLikes = z.infer<typeof activityWithLikesSchema>;
