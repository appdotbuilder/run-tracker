
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activitiesTable, usersTable } from '../db/schema';
import { type CreateActivityInput } from '../schema';
import { createActivity } from '../handlers/create_activity';
import { eq } from 'drizzle-orm';

describe('createActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password_123',
        name: 'Test User'
      })
      .returning()
      .execute();
    return result[0];
  };

  const testInput: CreateActivityInput = {
    user_id: 1, // Will be updated with actual user ID
    type: 'run',
    distance_miles: 3.5,
    duration_hours: 0,
    duration_minutes: 25,
    duration_seconds: 30,
    activity_date: new Date('2024-01-15T08:00:00Z')
  };

  it('should create an activity', async () => {
    // Create prerequisite user
    const user = await createTestUser();
    const input = { ...testInput, user_id: user.id };

    const result = await createActivity(input);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.type).toEqual('run');
    expect(result.distance_miles).toEqual(3.5);
    expect(typeof result.distance_miles).toBe('number');
    expect(result.duration_hours).toEqual(0);
    expect(result.duration_minutes).toEqual(25);
    expect(result.duration_seconds).toEqual(30);
    expect(result.activity_date).toEqual(new Date('2024-01-15T08:00:00Z'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save activity to database', async () => {
    // Create prerequisite user
    const user = await createTestUser();
    const input = { ...testInput, user_id: user.id };

    const result = await createActivity(input);

    // Query using proper drizzle syntax
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    const activity = activities[0];
    expect(activity.user_id).toEqual(user.id);
    expect(activity.type).toEqual('run');
    expect(parseFloat(activity.distance_miles)).toEqual(3.5);
    expect(activity.duration_hours).toEqual(0);
    expect(activity.duration_minutes).toEqual(25);
    expect(activity.duration_seconds).toEqual(30);
    expect(activity.activity_date).toEqual(new Date('2024-01-15T08:00:00Z'));
    expect(activity.created_at).toBeInstanceOf(Date);
  });

  it('should handle walk activity type', async () => {
    // Create prerequisite user
    const user = await createTestUser();
    const walkInput: CreateActivityInput = {
      ...testInput,
      user_id: user.id,
      type: 'walk',
      distance_miles: 2.0,
      duration_hours: 1,
      duration_minutes: 15,
      duration_seconds: 0
    };

    const result = await createActivity(walkInput);

    expect(result.type).toEqual('walk');
    expect(result.distance_miles).toEqual(2.0);
    expect(result.duration_hours).toEqual(1);
    expect(result.duration_minutes).toEqual(15);
    expect(result.duration_seconds).toEqual(0);
  });

  it('should throw error when user does not exist', async () => {
    const input = { ...testInput, user_id: 999 }; // Non-existent user ID

    await expect(createActivity(input)).rejects.toThrow(/user with id 999 does not exist/i);
  });

  it('should handle decimal distance values correctly', async () => {
    // Create prerequisite user
    const user = await createTestUser();
    const input = {
      ...testInput,
      user_id: user.id,
      distance_miles: 5.75 // Test decimal precision
    };

    const result = await createActivity(input);

    expect(result.distance_miles).toEqual(5.75);
    expect(typeof result.distance_miles).toBe('number');

    // Verify it was stored and retrieved correctly
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(parseFloat(activities[0].distance_miles)).toEqual(5.75);
  });
});
