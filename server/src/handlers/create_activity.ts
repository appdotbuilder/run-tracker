
import { db } from '../db';
import { activitiesTable, usersTable } from '../db/schema';
import { type CreateActivityInput, type Activity } from '../schema';
import { eq } from 'drizzle-orm';

export const createActivity = async (input: CreateActivityInput): Promise<Activity> => {
  try {
    // Verify that the user exists first to prevent foreign key constraint violations
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert activity record
    const result = await db.insert(activitiesTable)
      .values({
        user_id: input.user_id,
        type: input.type,
        distance_miles: input.distance_miles.toString(), // Convert number to string for numeric column
        duration_hours: input.duration_hours,
        duration_minutes: input.duration_minutes,
        duration_seconds: input.duration_seconds,
        activity_date: input.activity_date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const activity = result[0];
    return {
      ...activity,
      distance_miles: parseFloat(activity.distance_miles) // Convert string back to number
    };
  } catch (error) {
    console.error('Activity creation failed:', error);
    throw error;
  }
};
