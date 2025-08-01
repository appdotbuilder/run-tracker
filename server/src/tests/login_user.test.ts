
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

const testUser = {
  email: 'test@example.com',
  password_hash: 'test_password', // In real app, this would be hashed
  name: 'Test User'
};

const loginInput: LoginInput = {
  email: 'test@example.com',
  password: 'test_password'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with valid credentials', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.name).toEqual('Test User');
    expect(result!.password_hash).toEqual('test_password');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for invalid email', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'test_password'
    };

    const result = await loginUser(invalidInput);

    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrong_password'
    };

    const result = await loginUser(invalidInput);

    expect(result).toBeNull();
  });

  it('should return null when no users exist', async () => {
    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });
});
