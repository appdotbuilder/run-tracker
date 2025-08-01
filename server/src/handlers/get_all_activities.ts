
import { db } from '../db';
import { activitiesTable, usersTable, activityLikesTable } from '../db/schema';
import { type ActivityWithLikes } from '../schema';
import { eq, desc, count, sql } from 'drizzle-orm';

export const getAllActivities = async (currentUserId?: number): Promise<ActivityWithLikes[]> => {
  try {
    // Build the query with joins to get user names and likes count
    const results = await db
      .select({
        id: activitiesTable.id,
        user_id: activitiesTable.user_id,
        user_name: usersTable.name,
        type: activitiesTable.type,
        distance_miles: activitiesTable.distance_miles,
        duration_hours: activitiesTable.duration_hours,
        duration_minutes: activitiesTable.duration_minutes,
        duration_seconds: activitiesTable.duration_seconds,
        activity_date: activitiesTable.activity_date,
        created_at: activitiesTable.created_at,
        likes_count: count(activityLikesTable.id),
        user_has_liked: sql<boolean>`CASE WHEN ${currentUserId ? sql`SUM(CASE WHEN ${activityLikesTable.user_id} = ${currentUserId} THEN 1 ELSE 0 END)` : sql`0`} > 0 THEN true ELSE false END`
      })
      .from(activitiesTable)
      .innerJoin(usersTable, eq(activitiesTable.user_id, usersTable.id))
      .leftJoin(activityLikesTable, eq(activitiesTable.id, activityLikesTable.activity_id))
      .groupBy(
        activitiesTable.id,
        activitiesTable.user_id,
        usersTable.name,
        activitiesTable.type,
        activitiesTable.distance_miles,
        activitiesTable.duration_hours,
        activitiesTable.duration_minutes,
        activitiesTable.duration_seconds,
        activitiesTable.activity_date,
        activitiesTable.created_at
      )
      .orderBy(desc(activitiesTable.created_at))
      .execute();

    // Convert numeric fields and return
    return results.map(result => ({
      ...result,
      distance_miles: parseFloat(result.distance_miles), // Convert numeric to number
      likes_count: Number(result.likes_count) // Convert count to number
    }));
  } catch (error) {
    console.error('Get all activities failed:', error);
    throw error;
  }
};
