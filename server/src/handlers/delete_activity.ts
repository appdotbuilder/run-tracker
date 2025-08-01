
import { db } from '../db';
import { activitiesTable, activityLikesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const deleteActivityInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

type DeleteActivityInput = z.infer<typeof deleteActivityInputSchema>;

export const deleteActivity = async (input: DeleteActivityInput): Promise<{ success: boolean }> => {
  try {
    // First verify the activity exists and belongs to the user
    const existingActivity = await db.select()
      .from(activitiesTable)
      .where(and(
        eq(activitiesTable.id, input.id),
        eq(activitiesTable.user_id, input.user_id)
      ))
      .execute();

    if (existingActivity.length === 0) {
      throw new Error('Activity not found or does not belong to user');
    }

    // Delete associated likes first (due to foreign key constraints)
    await db.delete(activityLikesTable)
      .where(eq(activityLikesTable.activity_id, input.id))
      .execute();

    // Delete the activity
    await db.delete(activitiesTable)
      .where(and(
        eq(activitiesTable.id, input.id),
        eq(activitiesTable.user_id, input.user_id)
      ))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Activity deletion failed:', error);
    throw error;
  }
};
