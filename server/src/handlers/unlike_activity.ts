
import { db } from '../db';
import { activityLikesTable } from '../db/schema';
import { type LikeActivityInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const unlikeActivity = async (input: LikeActivityInput): Promise<{ success: boolean }> => {
  try {
    // Remove the like record for the specific activity and user combination
    const result = await db.delete(activityLikesTable)
      .where(
        and(
          eq(activityLikesTable.activity_id, input.activity_id),
          eq(activityLikesTable.user_id, input.user_id)
        )
      )
      .execute();

    // Return success based on whether a record was actually deleted
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Activity unlike failed:', error);
    throw error;
  }
};
