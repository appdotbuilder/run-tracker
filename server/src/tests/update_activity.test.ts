
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activitiesTable } from '../db/schema';
import { type UpdateActivityInput, type CreateUserInput } from '../schema';
import { updateActivity } from '../handlers/update_activity';
import { eq } from 'drizzle-orm';

const testUser: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

describe('updateActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an activity with all fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        name: testUser.name
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test activity
    const activityResult = await db.insert(activitiesTable)
      .values({
        user_id: user.id,
        type: 'run',
        distance_miles: '5.0',
        duration_hours: 1,
        duration_minutes: 30,
        duration_seconds: 45,
        activity_date: new Date('2024-01-01')
      })
      .returning()
      .execute();
    const originalActivity = activityResult[0];

    // Update the activity
    const updateInput: UpdateActivityInput = {
      id: originalActivity.id,
      type: 'walk',
      distance_miles: 3.5,
      duration_hours: 0,
      duration_minutes: 45,
      duration_seconds: 30,
      activity_date: new Date('2024-01-02')
    };

    const result = await updateActivity(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(originalActivity.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.type).toEqual('walk');
    expect(result.distance_miles).toEqual(3.5);
    expect(typeof result.distance_miles).toEqual('number');
    expect(result.duration_hours).toEqual(0);
    expect(result.duration_minutes).toEqual(45);
    expect(result.duration_seconds).toEqual(30);
    expect(result.activity_date).toEqual(new Date('2024-01-02'));
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        name: testUser.name
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test activity
    const activityResult = await db.insert(activitiesTable)
      .values({
        user_id: user.id,
        type: 'run',
        distance_miles: '5.0',
        duration_hours: 1,
        duration_minutes: 30,
        duration_seconds: 45,
        activity_date: new Date('2024-01-01')
      })
      .returning()
      .execute();
    const originalActivity = activityResult[0];

    // Update only distance and type
    const updateInput: UpdateActivityInput = {
      id: originalActivity.id,
      type: 'walk',
      distance_miles: 2.75
    };

    const result = await updateActivity(updateInput);

    // Verify updated fields
    expect(result.type).toEqual('walk');
    expect(result.distance_miles).toEqual(2.75);
    
    // Verify unchanged fields
    expect(result.duration_hours).toEqual(1);
    expect(result.duration_minutes).toEqual(30);
    expect(result.duration_seconds).toEqual(45);
    expect(result.activity_date).toEqual(new Date('2024-01-01'));
  });

  it('should save updated activity to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        name: testUser.name
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test activity
    const activityResult = await db.insert(activitiesTable)
      .values({
        user_id: user.id,
        type: 'run',
        distance_miles: '5.0',
        duration_hours: 1,
        duration_minutes: 30,
        duration_seconds: 45,
        activity_date: new Date('2024-01-01')
      })
      .returning()
      .execute();
    const originalActivity = activityResult[0];

    // Update the activity
    const updateInput: UpdateActivityInput = {
      id: originalActivity.id,
      distance_miles: 7.25,
      duration_minutes: 45
    };

    const result = await updateActivity(updateInput);

    // Query database to verify changes were saved
    const savedActivity = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(savedActivity).toHaveLength(1);
    expect(parseFloat(savedActivity[0].distance_miles)).toEqual(7.25);
    expect(savedActivity[0].duration_minutes).toEqual(45);
    expect(savedActivity[0].type).toEqual('run'); // Unchanged
  });

  it('should throw error for non-existent activity', async () => {
    const updateInput: UpdateActivityInput = {
      id: 99999,
      distance_miles: 5.0
    };

    await expect(updateActivity(updateInput)).rejects.toThrow(/Activity with id 99999 not found/i);
  });

  it('should handle numeric precision correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        name: testUser.name
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test activity
    const activityResult = await db.insert(activitiesTable)
      .values({
        user_id: user.id,
        type: 'run',
        distance_miles: '5.0',
        duration_hours: 1,
        duration_minutes: 30,
        duration_seconds: 45,
        activity_date: new Date('2024-01-01')
      })
      .returning()
      .execute();
    const originalActivity = activityResult[0];

    // Update with precise decimal - note: numeric(8,2) truncates to 2 decimal places
    const updateInput: UpdateActivityInput = {
      id: originalActivity.id,
      distance_miles: 3.14159
    };

    const result = await updateActivity(updateInput);

    // PostgreSQL numeric(8,2) truncates to 2 decimal places
    expect(result.distance_miles).toEqual(3.14);
    expect(typeof result.distance_miles).toEqual('number');
  });
});
