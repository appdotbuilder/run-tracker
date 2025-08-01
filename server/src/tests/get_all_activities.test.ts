
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activitiesTable, activityLikesTable } from '../db/schema';
import { getAllActivities } from '../handlers/get_all_activities';

describe('getAllActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no activities exist', async () => {
    const result = await getAllActivities();
    expect(result).toEqual([]);
  });

  it('should return activities with user names and likes count', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test activity
    const activityResult = await db.insert(activitiesTable)
      .values({
        user_id: userId,
        type: 'run',
        distance_miles: '5.25',
        duration_hours: 0,
        duration_minutes: 30,
        duration_seconds: 45,
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    const result = await getAllActivities();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: activityResult[0].id,
      user_id: userId,
      user_name: 'Test User',
      type: 'run',
      distance_miles: 5.25,
      duration_hours: 0,
      duration_minutes: 30,
      duration_seconds: 45,
      likes_count: 0,
      user_has_liked: false
    });
    expect(result[0].activity_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return activities sorted by created_at descending', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create first activity (older)
    const olderDate = new Date('2024-01-01T10:00:00Z');
    await db.insert(activitiesTable)
      .values({
        user_id: userId,
        type: 'run',
        distance_miles: '3.00',
        duration_hours: 0,
        duration_minutes: 20,
        duration_seconds: 0,
        activity_date: olderDate
      })
      .execute();

    // Wait a bit to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second activity (newer)
    const newerDate = new Date('2024-01-15T10:00:00Z');
    await db.insert(activitiesTable)
      .values({
        user_id: userId,
        type: 'walk',
        distance_miles: '2.50',
        duration_hours: 0,
        duration_minutes: 25,
        duration_seconds: 30,
        activity_date: newerDate
      })
      .execute();

    const result = await getAllActivities();

    expect(result).toHaveLength(2);
    // Most recent activity should be first
    expect(result[0].type).toBe('walk');
    expect(result[0].distance_miles).toBe(2.5);
    expect(result[1].type).toBe('run');
    expect(result[1].distance_miles).toBe(3);
    // Verify ordering by created_at
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should correctly count likes and detect user likes', async () => {
    // Create test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        name: 'User One'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        name: 'User Two'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create activity by user1
    const activityResult = await db.insert(activitiesTable)
      .values({
        user_id: user1Id,
        type: 'run',
        distance_miles: '5.00',
        duration_hours: 0,
        duration_minutes: 30,
        duration_seconds: 0,
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    const activityId = activityResult[0].id;

    // Add likes from both users
    await db.insert(activityLikesTable)
      .values([
        { activity_id: activityId, user_id: user1Id },
        { activity_id: activityId, user_id: user2Id }
      ])
      .execute();

    // Test without current user
    const resultNoUser = await getAllActivities();
    expect(resultNoUser[0].likes_count).toBe(2);
    expect(resultNoUser[0].user_has_liked).toBe(false);

    // Test with current user who has liked
    const resultWithUser1 = await getAllActivities(user1Id);
    expect(resultWithUser1[0].likes_count).toBe(2);
    expect(resultWithUser1[0].user_has_liked).toBe(true);

    // Test with current user who hasn't liked
    const user3Result = await db.insert(usersTable)
      .values({
        email: 'user3@example.com',
        password_hash: 'hashed_password',
        name: 'User Three'
      })
      .returning()
      .execute();

    const resultWithUser3 = await getAllActivities(user3Result[0].id);
    expect(resultWithUser3[0].likes_count).toBe(2);
    expect(resultWithUser3[0].user_has_liked).toBe(false);
  });

  it('should handle multiple activities from different users', async () => {
    // Create multiple users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        name: 'Alice'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        name: 'Bob'
      })
      .returning()
      .execute();

    // Create activities for both users
    await db.insert(activitiesTable)
      .values([
        {
          user_id: user1Result[0].id,
          type: 'run',
          distance_miles: '3.50',
          duration_hours: 0,
          duration_minutes: 25,
          duration_seconds: 15,
          activity_date: new Date('2024-01-10T09:00:00Z')
        },
        {
          user_id: user2Result[0].id,
          type: 'walk',
          distance_miles: '2.00',
          duration_hours: 0,
          duration_minutes: 20,
          duration_seconds: 0,
          activity_date: new Date('2024-01-12T14:30:00Z')
        }
      ])
      .execute();

    const result = await getAllActivities();

    expect(result).toHaveLength(2);
    
    // Find activities by user name
    const aliceActivity = result.find(a => a.user_name === 'Alice');
    const bobActivity = result.find(a => a.user_name === 'Bob');

    expect(aliceActivity).toBeDefined();
    expect(aliceActivity?.type).toBe('run');
    expect(aliceActivity?.distance_miles).toBe(3.5);

    expect(bobActivity).toBeDefined();
    expect(bobActivity?.type).toBe('walk');
    expect(bobActivity?.distance_miles).toBe(2);
  });
});
