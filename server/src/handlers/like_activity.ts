
import { db } from '../db';
import { activityLikesTable, activitiesTable, usersTable } from '../db/schema';
import { type LikeActivityInput, type ActivityLike } from '../schema';
import { eq, and } from 'drizzle-orm';

export const likeActivity = async (input: LikeActivityInput): Promise<ActivityLike> => {
  try {
    // Check if activity exists
    const activity = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, input.activity_id))
      .execute();
    
    if (activity.length === 0) {
      throw new Error('Activity not found');
    }

    // Check if user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();
    
    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Check if like already exists
    const existingLike = await db.select()
      .from(activityLikesTable)
      .where(
        and(
          eq(activityLikesTable.activity_id, input.activity_id),
          eq(activityLikesTable.user_id, input.user_id)
        )
      )
      .execute();

    if (existingLike.length > 0) {
      throw new Error('User has already liked this activity');
    }

    // Create the like
    const result = await db.insert(activityLikesTable)
      .values({
        activity_id: input.activity_id,
        user_id: input.user_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Activity like creation failed:', error);
    throw error;
  }
};
