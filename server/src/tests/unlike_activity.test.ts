
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activitiesTable, activityLikesTable } from '../db/schema';
import { type LikeActivityInput } from '../schema';
import { unlikeActivity } from '../handlers/unlike_activity';
import { eq, and } from 'drizzle-orm';

describe('unlikeActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully unlike an activity', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash('password123');
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create test activity
    const [activity] = await db.insert(activitiesTable)
      .values({
        user_id: user.id,
        type: 'run',
        distance_miles: '5.0',
        duration_hours: 0,
        duration_minutes: 30,
        duration_seconds: 0,
        activity_date: new Date()
      })
      .returning()
      .execute();

    // Create activity like
    await db.insert(activityLikesTable)
      .values({
        activity_id: activity.id,
        user_id: user.id
      })
      .execute();

    const input: LikeActivityInput = {
      activity_id: activity.id,
      user_id: user.id
    };

    const result = await unlikeActivity(input);

    expect(result.success).toBe(true);

    // Verify like was removed from database
    const likes = await db.select()
      .from(activityLikesTable)
      .where(
        and(
          eq(activityLikesTable.activity_id, activity.id),
          eq(activityLikesTable.user_id, user.id)
        )
      )
      .execute();

    expect(likes).toHaveLength(0);
  });

  it('should return false when trying to unlike non-existent like', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash('password123');
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create test activity
    const [activity] = await db.insert(activitiesTable)
      .values({
        user_id: user.id,
        type: 'run',
        distance_miles: '5.0',
        duration_hours: 0,
        duration_minutes: 30,
        duration_seconds: 0,
        activity_date: new Date()
      })
      .returning()
      .execute();

    // Don't create a like - try to unlike non-existent like
    const input: LikeActivityInput = {
      activity_id: activity.id,
      user_id: user.id
    };

    const result = await unlikeActivity(input);

    expect(result.success).toBe(false);
  });

  it('should only remove like for specific user-activity combination', async () => {
    // Create test users
    const hashedPassword = await Bun.password.hash('password123');
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: hashedPassword,
        name: 'User One'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: hashedPassword,
        name: 'User Two'
      })
      .returning()
      .execute();

    // Create test activity
    const [activity] = await db.insert(activitiesTable)
      .values({
        user_id: user1.id,
        type: 'run',
        distance_miles: '5.0',
        duration_hours: 0,
        duration_minutes: 30,
        duration_seconds: 0,
        activity_date: new Date()
      })
      .returning()
      .execute();

    // Both users like the activity
    await db.insert(activityLikesTable)
      .values([
        {
          activity_id: activity.id,
          user_id: user1.id
        },
        {
          activity_id: activity.id,
          user_id: user2.id
        }
      ])
      .execute();

    // User 1 unlikes the activity
    const input: LikeActivityInput = {
      activity_id: activity.id,
      user_id: user1.id
    };

    const result = await unlikeActivity(input);

    expect(result.success).toBe(true);

    // Verify only user1's like was removed
    const user1Likes = await db.select()
      .from(activityLikesTable)
      .where(
        and(
          eq(activityLikesTable.activity_id, activity.id),
          eq(activityLikesTable.user_id, user1.id)
        )
      )
      .execute();

    const user2Likes = await db.select()
      .from(activityLikesTable)
      .where(
        and(
          eq(activityLikesTable.activity_id, activity.id),
          eq(activityLikesTable.user_id, user2.id)
        )
      )
      .execute();

    expect(user1Likes).toHaveLength(0);
    expect(user2Likes).toHaveLength(1);
  });

  it('should handle non-existent activity gracefully', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash('password123');
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User'
      })
      .returning()
      .execute();

    const input: LikeActivityInput = {
      activity_id: 99999, // Non-existent activity ID
      user_id: user.id
    };

    const result = await unlikeActivity(input);

    expect(result.success).toBe(false);
  });

  it('should handle non-existent user gracefully', async () => {
    // Create test user for activity creation
    const hashedPassword = await Bun.password.hash('password123');
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create test activity
    const [activity] = await db.insert(activitiesTable)
      .values({
        user_id: user.id,
        type: 'run',
        distance_miles: '5.0',
        duration_hours: 0,
        duration_minutes: 30,
        duration_seconds: 0,
        activity_date: new Date()
      })
      .returning()
      .execute();

    const input: LikeActivityInput = {
      activity_id: activity.id,
      user_id: 99999 // Non-existent user ID
    };

    const result = await unlikeActivity(input);

    expect(result.success).toBe(false);
  });
});
