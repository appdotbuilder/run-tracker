
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginInput): Promise<User | null> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // In a real implementation, you would hash the input password and compare
    // For this placeholder, we'll just check if password matches password_hash
    // This is NOT secure - use bcrypt or similar in production
    if (user.password_hash !== input.password) {
      return null; // Invalid password
    }

    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      name: user.name,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
