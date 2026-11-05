import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createDatabaseConnection, initDatabase } from '../config/database';

// Test table initialization and constraints against a test database instance
describe('Database Initialization & Constraints', () => {
  const testDbPath = path.resolve(__dirname, '../../data/test_database.sqlite');
let testDb: any;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Create an isolated test database connection
    testDb = createDatabaseConnection(testDbPath);
  });

  afterEach(() => {
    if (testDb) {
      testDb.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  // Test Case 1: Successful Table Creation (Happy Path)
  it('should successfully create the records table using initDatabase', () => {
      expect(() => initDatabase(testDb)).not.toThrow();

      const tableCheck = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='records'").get();
      expect(tableCheck).toBeDefined();
    });

  // Test Case 2: Primary Key Constraint Enforcement (Edge Case)
  it('should enforce unique primary key constraints on id', () => {
    initDatabase(testDb);

    const insert = testDb.prepare('INSERT INTO records (id, postId, name, email, body) VALUES (?, ?, ?, ?, ?)');
    insert.run(1, 101, 'Alice', 'alice@example.com', 'Body 1');

    // Attempting to insert duplicate id should throw a constraint error
    expect(() => {
      insert.run(1, 102, 'Bob', 'bob@example.com', 'Body 2');
    }).toThrow();
  });

  // Test Case 3: Idempotency Check (Edge Case)
  it('should allow running initDatabase multiple times safely', () => {
    expect(() => {
      initDatabase(testDb);
      initDatabase(testDb); // Second execution to verify idempotency
    }).not.toThrow();

    // Verify table still exists and is fully intact after multiple initializations
    const tableCheck = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='records'").get();
    expect(tableCheck).toBeDefined();
  });
});