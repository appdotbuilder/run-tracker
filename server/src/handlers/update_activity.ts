
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type UpdateActivityInput, type Activity } from '../schema';
import { eq } from 'drizzle-orm';

export const updateActivity = async (input: UpdateActivityInput): Promise<Activity> => {
  // Build update object with only provided fields
  const updateData: any = {};
  
  if (input.type !== undefined) {
    updateData.type = input.type;
  }
  if (input.distance_miles !== undefined) {
    updateData.distance_miles = input.distance_miles.toString(); // Convert number to string for numeric column
  }
  if (input.duration_hours !== undefined) {
    updateData.duration_hours = input.duration_hours;
  }
  if (input.duration_minutes !== undefined) {
    updateData.duration_minutes = input.duration_minutes;
  }
  if (input.duration_seconds !== undefined) {
    updateData.duration_seconds = input.duration_seconds;
  }
  if (input.activity_date !== undefined) {
    updateData.activity_date = input.activity_date;
  }

  // Update the activity
  const result = await db.update(activitiesTable)
    .set(updateData)
    .where(eq(activitiesTable.id, input.id))
    .returning()
    .execute();

  if (result.length === 0) {
    throw new Error(`Activity with id ${input.id} not found`);
  }

  // Convert numeric fields back to numbers before returning
  const activity = result[0];
  return {
    ...activity,
    distance_miles: parseFloat(activity.distance_miles) // Convert string back to number
  };
};
