
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activitiesTable } from '../db/schema';
import { type GetUserActivitiesInput } from '../schema';
import { getUserActivities } from '../handlers/get_user_activities';

// Test users
const testUser1 = {
  email: 'user1@example.com',
  password_hash: 'hashedpassword1',
  name: 'User One'
};

const testUser2 = {
  email: 'user2@example.com',
  password_hash: 'hashedpassword2',
  name: 'User Two'
};

// Test activities
const createTestActivity = (userId: number, activityDate: Date, distanceMiles: number) => ({
  user_id: userId,
  type: 'run' as const,
  distance_miles: distanceMiles.toString(),
  duration_hours: 1,
  duration_minutes: 30,
  duration_seconds: 45,
  activity_date: activityDate
});

describe('getUserActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no activities', async () => {
    // Create user but no activities
    const users = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();

    const input: GetUserActivitiesInput = {
      user_id: users[0].id
    };

    const result = await getUserActivities(input);

    expect(result).toEqual([]);
  });

  it('should return activities for specific user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create activities for both users
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(activitiesTable)
      .values([
        createTestActivity(user1Id, today, 5.5),
        createTestActivity(user1Id, yesterday, 3.2),
        createTestActivity(user2Id, today, 4.1) // Different user
      ])
      .execute();

    const input: GetUserActivitiesInput = {
      user_id: user1Id
    };

    const result = await getUserActivities(input);

    // Should only return activities for user1
    expect(result).toHaveLength(2);
    result.forEach(activity => {
      expect(activity.user_id).toEqual(user1Id);
      expect(typeof activity.distance_miles).toBe('number');
    });

    // Check specific activities
    expect(result[0].distance_miles).toEqual(5.5); // Today's activity (first due to desc order)
    expect(result[1].distance_miles).toEqual(3.2); // Yesterday's activity
  });

  it('should return activities sorted by activity_date descending', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();

    const userId = users[0].id;

    // Create activities with different dates
    const dates = [
      new Date('2024-01-01'),
      new Date('2024-01-03'),
      new Date('2024-01-02')
    ];

    await db.insert(activitiesTable)
      .values([
        createTestActivity(userId, dates[0], 1.0), // Oldest
        createTestActivity(userId, dates[1], 3.0), // Newest
        createTestActivity(userId, dates[2], 2.0)  // Middle
      ])
      .execute();

    const input: GetUserActivitiesInput = {
      user_id: userId
    };

    const result = await getUserActivities(input);

    expect(result).toHaveLength(3);
    
    // Should be ordered by activity_date descending (newest first)
    expect(result[0].distance_miles).toEqual(3.0); // 2024-01-03
    expect(result[1].distance_miles).toEqual(2.0); // 2024-01-02
    expect(result[2].distance_miles).toEqual(1.0); // 2024-01-01

    // Verify dates are in descending order
    expect(result[0].activity_date >= result[1].activity_date).toBe(true);
    expect(result[1].activity_date >= result[2].activity_date).toBe(true);
  });

  it('should return activities with all required fields', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();

    const userId = users[0].id;

    // Create activity
    await db.insert(activitiesTable)
      .values(createTestActivity(userId, new Date(), 5.25))
      .execute();

    const input: GetUserActivitiesInput = {
      user_id: userId
    };

    const result = await getUserActivities(input);

    expect(result).toHaveLength(1);
    const activity = result[0];

    // Verify all required fields are present
    expect(activity.id).toBeDefined();
    expect(activity.user_id).toEqual(userId);
    expect(activity.type).toEqual('run');
    expect(activity.distance_miles).toEqual(5.25);
    expect(typeof activity.distance_miles).toBe('number');
    expect(activity.duration_hours).toEqual(1);
    expect(activity.duration_minutes).toEqual(30);
    expect(activity.duration_seconds).toEqual(45);
    expect(activity.activity_date).toBeInstanceOf(Date);
    expect(activity.created_at).toBeInstanceOf(Date);
  });
});
