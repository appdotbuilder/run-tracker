
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Activity type enum
export const activityTypeEnum = pgEnum('activity_type', ['run', 'walk']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Activities table
export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  type: activityTypeEnum('type').notNull(),
  distance_miles: numeric('distance_miles', { precision: 8, scale: 2 }).notNull(),
  duration_hours: integer('duration_hours').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  duration_seconds: integer('duration_seconds').notNull(),
  activity_date: timestamp('activity_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Activity likes table
export const activityLikesTable = pgTable('activity_likes', {
  id: serial('id').primaryKey(),
  activity_id: integer('activity_id').notNull().references(() => activitiesTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  activities: many(activitiesTable),
  activityLikes: many(activityLikesTable),
}));

export const activitiesRelations = relations(activitiesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [activitiesTable.user_id],
    references: [usersTable.id],
  }),
  likes: many(activityLikesTable),
}));

export const activityLikesRelations = relations(activityLikesTable, ({ one }) => ({
  activity: one(activitiesTable, {
    fields: [activityLikesTable.activity_id],
    references: [activitiesTable.id],
  }),
  user: one(usersTable, {
    fields: [activityLikesTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Activity = typeof activitiesTable.$inferSelect;
export type NewActivity = typeof activitiesTable.$inferInsert;
export type ActivityLike = typeof activityLikesTable.$inferSelect;
export type NewActivityLike = typeof activityLikesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  activities: activitiesTable,
  activityLikes: activityLikesTable
};
