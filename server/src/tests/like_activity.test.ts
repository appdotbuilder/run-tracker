
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activitiesTable, activityLikesTable } from '../db/schema';
import { type LikeActivityInput } from '../schema';
import { likeActivity } from '../handlers/like_activity';
import { eq, and } from 'drizzle-orm';

describe('likeActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testActivityId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password_123',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test activity
    const activityResult = await db.insert(activitiesTable)
      .values({
        user_id: testUserId,
        type: 'run',
        distance_miles: '5.0',
        duration_hours: 0,
        duration_minutes: 30,
        duration_seconds: 0,
        activity_date: new Date()
      })
      .returning()
      .execute();
    testActivityId = activityResult[0].id;
  });

  const testInput: LikeActivityInput = {
    activity_id: 0, // Will be set in beforeEach
    user_id: 0 // Will be set in beforeEach
  };

  it('should create an activity like', async () => {
    const input = {
      ...testInput,
      activity_id: testActivityId,
      user_id: testUserId
    };

    const result = await likeActivity(input);

    expect(result.activity_id).toEqual(testActivityId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save like to database', async () => {
    const input = {
      ...testInput,
      activity_id: testActivityId,
      user_id: testUserId
    };

    const result = await likeActivity(input);

    const likes = await db.select()
      .from(activityLikesTable)
      .where(eq(activityLikesTable.id, result.id))
      .execute();

    expect(likes).toHaveLength(1);
    expect(likes[0].activity_id).toEqual(testActivityId);
    expect(likes[0].user_id).toEqual(testUserId);
    expect(likes[0].created_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate likes from same user', async () => {
    const input = {
      ...testInput,
      activity_id: testActivityId,
      user_id: testUserId
    };

    // Create first like
    await likeActivity(input);

    // Attempt to create duplicate like
    await expect(likeActivity(input)).rejects.toThrow(/already liked/i);
  });

  it('should throw error for non-existent activity', async () => {
    const input = {
      ...testInput,
      activity_id: 99999,
      user_id: testUserId
    };

    await expect(likeActivity(input)).rejects.toThrow(/activity not found/i);
  });

  it('should throw error for non-existent user', async () => {
    const input = {
      ...testInput,
      activity_id: testActivityId,
      user_id: 99999
    };

    await expect(likeActivity(input)).rejects.toThrow(/user not found/i);
  });

  it('should allow different users to like same activity', async () => {
    // Create second user
    const secondUserResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        password_hash: 'hashed_password_456',
        name: 'Test User 2'
      })
      .returning()
      .execute();
    const secondUserId = secondUserResult[0].id;

    const firstInput = {
      ...testInput,
      activity_id: testActivityId,
      user_id: testUserId
    };

    const secondInput = {
      ...testInput,
      activity_id: testActivityId,
      user_id: secondUserId
    };

    // Both likes should succeed
    const firstLike = await likeActivity(firstInput);
    const secondLike = await likeActivity(secondInput);

    expect(firstLike.user_id).toEqual(testUserId);
    expect(secondLike.user_id).toEqual(secondUserId);

    // Verify both likes exist in database
    const likes = await db.select()
      .from(activityLikesTable)
      .where(eq(activityLikesTable.activity_id, testActivityId))
      .execute();

    expect(likes).toHaveLength(2);
  });
});
