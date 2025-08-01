
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activitiesTable, activityLikesTable } from '../db/schema';
import { deleteActivity } from '../handlers/delete_activity';
import { eq } from 'drizzle-orm';

describe('deleteActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an activity that belongs to the user', async () => {
    // Create a test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create a test activity
    const activity = await db.insert(activitiesTable)
      .values({
        user_id: user[0].id,
        type: 'run',
        distance_miles: '5.5',
        duration_hours: 1,
        duration_minutes: 30,
        duration_seconds: 45,
        activity_date: new Date()
      })
      .returning()
      .execute();

    // Delete the activity
    const result = await deleteActivity({
      id: activity[0].id,
      user_id: user[0].id
    });

    expect(result.success).toBe(true);

    // Verify activity was deleted
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activity[0].id))
      .execute();

    expect(activities).toHaveLength(0);
  });

  it('should delete associated likes when deleting activity', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'owner@example.com',
          password_hash: 'hashed_password',
          name: 'Activity Owner'
        },
        {
          email: 'liker@example.com',
          password_hash: 'hashed_password',
          name: 'Activity Liker'
        }
      ])
      .returning()
      .execute();

    const ownerId = users[0].id;
    const likerId = users[1].id;

    // Create a test activity
    const activity = await db.insert(activitiesTable)
      .values({
        user_id: ownerId,
        type: 'walk',
        distance_miles: '3.2',
        duration_hours: 0,
        duration_minutes: 45,
        duration_seconds: 30,
        activity_date: new Date()
      })
      .returning()
      .execute();

    // Create a like for the activity
    await db.insert(activityLikesTable)
      .values({
        activity_id: activity[0].id,
        user_id: likerId
      })
      .execute();

    // Verify like exists before deletion
    const likesBefore = await db.select()
      .from(activityLikesTable)
      .where(eq(activityLikesTable.activity_id, activity[0].id))
      .execute();

    expect(likesBefore).toHaveLength(1);

    // Delete the activity
    const result = await deleteActivity({
      id: activity[0].id,
      user_id: ownerId
    });

    expect(result.success).toBe(true);

    // Verify both activity and likes were deleted
    const activitiesAfter = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activity[0].id))
      .execute();

    const likesAfter = await db.select()
      .from(activityLikesTable)
      .where(eq(activityLikesTable.activity_id, activity[0].id))
      .execute();

    expect(activitiesAfter).toHaveLength(0);
    expect(likesAfter).toHaveLength(0);
  });

  it('should throw error when activity does not exist', async () => {
    // Create a test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Try to delete non-existent activity
    await expect(deleteActivity({
      id: 99999,
      user_id: user[0].id
    })).rejects.toThrow(/activity not found/i);
  });

  it('should throw error when user does not own the activity', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'owner@example.com',
          password_hash: 'hashed_password',
          name: 'Activity Owner'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashed_password',
          name: 'Other User'
        }
      ])
      .returning()
      .execute();

    const ownerId = users[0].id;
    const otherId = users[1].id;

    // Create activity owned by first user
    const activity = await db.insert(activitiesTable)
      .values({
        user_id: ownerId,
        type: 'run',
        distance_miles: '2.1',
        duration_hours: 0,
        duration_minutes: 20,
        duration_seconds: 15,
        activity_date: new Date()
      })
      .returning()
      .execute();

    // Try to delete activity with different user_id
    await expect(deleteActivity({
      id: activity[0].id,
      user_id: otherId
    })).rejects.toThrow(/activity not found.*does not belong to user/i);

    // Verify activity still exists
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activity[0].id))
      .execute();

    expect(activities).toHaveLength(1);
  });
});
