
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type GetUserActivitiesInput, type Activity } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserActivities = async (input: GetUserActivitiesInput): Promise<Activity[]> => {
  try {
    // Query activities for the specific user, ordered by activity_date desc
    const results = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.user_id, input.user_id))
      .orderBy(desc(activitiesTable.activity_date))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(activity => ({
      ...activity,
      distance_miles: parseFloat(activity.distance_miles) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to get user activities:', error);
    throw error;
  }
};
